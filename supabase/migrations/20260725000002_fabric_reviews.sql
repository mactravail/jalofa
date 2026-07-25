-- =============================================================================
-- JALOFA — Avis clients sur les vendeurs de tissu
--
-- Pendant du système d'avis des tailleurs (`reviews`), mais côté boutique de
-- tissu : un client qui a reçu une commande de tissu chez un vendeur peut noter
-- ce vendeur (1 à 5), laisser un commentaire et joindre jusqu'à 3 photos.
--
--   • Un avis est rattaché à UNE commande livrée (`order_id` unique) — on ne
--     note pas une boutique « dans le vide », mais un achat réel, une seule fois.
--   • `fabric_id` garde le tissu concerné (facultatif) pour pouvoir afficher les
--     avis vérifiés sur la fiche du tissu.
--   • Les photos réutilisent le bucket Storage public `review-photos` (le même
--     que les avis tailleurs) ; seul le préfixe d'uid de l'auteur y est autorisé.
--
-- La note agrégée est tenue à jour sur `vendors.rating` / `rating_count` par un
-- trigger, comme pour les tailleurs. Idempotent (rejouable).
-- =============================================================================

-- Note agrégée de la boutique — même forme que `tailors`. ----------------------
alter table public.vendors
  add column if not exists rating numeric(2, 1) not null default 0,
  add column if not exists rating_count int not null default 0;

create table if not exists public.fabric_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  -- Le tissu acheté, gardé pour le contexte (l'avis survit à son retrait du
  -- catalogue, d'où `on delete set null`).
  fabric_id uuid references public.fabrics(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists fabric_reviews_vendor_id_idx on public.fabric_reviews(vendor_id);
create index if not exists fabric_reviews_fabric_id_idx on public.fabric_reviews(fabric_id);

create table if not exists public.fabric_review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.fabric_reviews(id) on delete cascade,
  image_url text not null
);

-- Tient à jour la note agrégée du vendeur. `security definer` : l'UPDATE vise
-- `vendors`, que le client (auteur de l'avis) n'a pas le droit de modifier via
-- RLS — la fonction s'exécute donc avec les droits du propriétaire, comme
-- `is_admin()`. `search_path` verrouillé (bonne pratique Supabase).
create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  update public.vendors v
  set rating = coalesce((select round(avg(rating)::numeric, 1) from public.fabric_reviews where vendor_id = target), 0),
      rating_count = (select count(*) from public.fabric_reviews where vendor_id = target)
  where v.id = target;
  return null;
end;
$$;

drop trigger if exists fabric_reviews_refresh_rating on public.fabric_reviews;
create trigger fabric_reviews_refresh_rating
  after insert or update or delete on public.fabric_reviews
  for each row execute function public.refresh_vendor_rating();

-- RLS : lecture publique (les avis sont visibles déconnecté), écriture par
-- l'auteur sur sa propre commande — même modèle que `reviews`. ----------------
alter table public.fabric_reviews enable row level security;
alter table public.fabric_review_photos enable row level security;

create policy "fabric_reviews_select_all" on public.fabric_reviews for select using (true);
create policy "fabric_reviews_insert_own" on public.fabric_reviews
  for insert with check (
    client_id = (select auth.uid())
    and exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()))
  );

create policy "fabric_review_photos_select_all" on public.fabric_review_photos for select using (true);
create policy "fabric_review_photos_write_own" on public.fabric_review_photos
  for all using (
    exists (select 1 from public.fabric_reviews r where r.id = review_id and r.client_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.fabric_reviews r where r.id = review_id and r.client_id = (select auth.uid()))
  );
