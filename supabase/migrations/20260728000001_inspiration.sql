-- =============================================================================
-- JALOFA — Inspiration : les tenues partagées par la communauté
--
-- Un client publie depuis son espace la photo d'une tenue qu'il porte — cousue
-- par un tailleur du quartier, achetée au marché ou en boutique — et la rend
-- visible sur une page publique « Inspiration ». Les autres visiteurs peuvent
-- s'en inspirer, aller trouver un tailleur pour la même, et voir où le tissu a
-- été acheté.
--
--   • `inspiration_posts`  — une publication : légende, type de vêtement, qui l'a
--     confectionnée (`maker_kind` + nom libre) et où le tissu a été acheté
--     (`fabric_note` en texte libre, plus un lien facultatif vers un tissu du
--     catalogue `fabric_id`).
--   • `inspiration_photos` — les photos rattachées (1 à 3), triées par
--     `sort_order`. Elles vivent dans le bucket Storage public
--     `inspiration-photos`, préfixées par l'uid de l'auteur.
--
-- Modération : une publication est visible dès sa création (`is_published`
-- vrai) ; l'administration peut la retirer (via la clé de service, comme les
-- avis). RLS activée partout. Idempotent (rejouable).
-- =============================================================================

-- Storage — même forme que `review-photos` : lecture publique (la galerie est
-- consultable déconnecté), écriture réservée à l'auteur sous son préfixe d'uid,
-- plafond mime/taille car la clé anon atteint le Storage directement. --------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inspiration-photos',
  'inspiration-photos',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

drop policy if exists "inspiration_photos_select_all" on storage.objects;
create policy "inspiration_photos_select_all" on storage.objects
  for select using (bucket_id = 'inspiration-photos');

drop policy if exists "inspiration_photos_insert_own" on storage.objects;
create policy "inspiration_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inspiration-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "inspiration_photos_update_own" on storage.objects;
create policy "inspiration_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'inspiration-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'inspiration-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "inspiration_photos_delete_own" on storage.objects;
create policy "inspiration_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inspiration-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Publications ----------------------------------------------------------------
create table if not exists public.inspiration_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  -- Nom d'affichage de l'auteur, figé à la publication. Dénormalisé exprès : la
  -- RLS de `profiles` interdit à un visiteur public de lire le profil d'un autre
  -- client, un join ne rendrait donc rien sur la galerie publique.
  author_name text,
  -- Description libre de la tenue.
  caption text,
  -- Type de vêtement, saisi librement (ex. « Grand boubou », « Robe »).
  garment_label text,
  -- Qui a confectionné / d'où vient la tenue.
  maker_kind text not null default 'tailleur_quartier'
    check (maker_kind in ('tailleur_quartier', 'marche', 'boutique', 'jalofa', 'autre')),
  -- Nom du tailleur / marché / boutique (facultatif).
  maker_name text,
  -- Où le tissu a été acheté, en texte libre (ex. « Marché HLM, Dakar »).
  fabric_note text,
  -- Lien facultatif vers un tissu du catalogue. `set null` : la publication
  -- survit au retrait du tissu du catalogue.
  fabric_id uuid references public.fabrics(id) on delete set null,
  -- Visible sur la page publique. L'administration peut retirer une publication.
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists inspiration_posts_created_idx on public.inspiration_posts(created_at desc);
create index if not exists inspiration_posts_author_idx on public.inspiration_posts(author_id);
create index if not exists inspiration_posts_fabric_idx on public.inspiration_posts(fabric_id);

create table if not exists public.inspiration_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.inspiration_posts(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);
create index if not exists inspiration_photos_post_idx on public.inspiration_photos(post_id);

-- RLS : lecture publique des publications visibles (l'auteur voit aussi les
-- siennes masquées), écriture par l'auteur sur ses propres publications. La
-- suppression par l'administration passe par la clé de service (comme les avis).
alter table public.inspiration_posts enable row level security;
alter table public.inspiration_photos enable row level security;

drop policy if exists "inspiration_posts_select_public_or_own" on public.inspiration_posts;
create policy "inspiration_posts_select_public_or_own" on public.inspiration_posts
  for select using (is_published or author_id = (select auth.uid()));

drop policy if exists "inspiration_posts_insert_own" on public.inspiration_posts;
create policy "inspiration_posts_insert_own" on public.inspiration_posts
  for insert with check (author_id = (select auth.uid()));

drop policy if exists "inspiration_posts_update_own" on public.inspiration_posts;
create policy "inspiration_posts_update_own" on public.inspiration_posts
  for update using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "inspiration_posts_delete_own" on public.inspiration_posts;
create policy "inspiration_posts_delete_own" on public.inspiration_posts
  for delete using (author_id = (select auth.uid()));

drop policy if exists "inspiration_photos_select_public_or_own" on public.inspiration_photos;
create policy "inspiration_photos_select_public_or_own" on public.inspiration_photos
  for select using (
    exists (
      select 1 from public.inspiration_posts p
      where p.id = post_id and (p.is_published or p.author_id = (select auth.uid()))
    )
  );

drop policy if exists "inspiration_photos_write_own" on public.inspiration_photos;
create policy "inspiration_photos_write_own" on public.inspiration_photos
  for all using (
    exists (
      select 1 from public.inspiration_posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.inspiration_posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );
