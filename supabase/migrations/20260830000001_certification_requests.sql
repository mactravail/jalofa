-- =============================================================================
-- JALOFA — Demandes de certification des pros
--
-- Depuis son menu, un tailleur ou un vendeur de tissus demande le badge
-- « Certifié ». Il remplit un formulaire : son vrai nom, son téléphone, son
-- adresse, une photocopie de sa carte d'identité, le nom de son entreprise, et
-- en option son logo, son NINEA et son registre de commerce.
--
-- L'administration lit la demande, regarde les pièces, puis accepte (le pro
-- reçoit `is_certified = true`) ou refuse avec un motif.
--
-- Bucket PRIVÉ `certification-docs` : une carte d'identité n'est jamais
-- publique. Le pro écrit sous `<uid>/…` ; seule l'administration lit, via un
-- lien signé fabriqué côté serveur avec la clé de service.
--
-- Idempotent : peut être rejoué sans risque dans l'éditeur SQL.
-- =============================================================================
begin;

create table if not exists public.certification_requests (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.profiles(id) on delete cascade,
  -- L'espace d'où la demande est partie : un pro aux deux métiers peut demander
  -- la certification pour son atelier ET pour sa boutique.
  kind text not null check (kind in ('tailor', 'vendor')),
  legal_name text not null,
  phone text not null,
  address text not null,
  company_name text not null,
  ninea text,
  -- Chemins dans le bucket privé `certification-docs` (jamais une URL publique).
  id_card_path text not null,
  logo_path text,
  trade_register_path text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  -- Le motif d'un refus, montré au pro pour qu'il corrige sa demande.
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists certification_requests_pro_idx
  on public.certification_requests(pro_id, kind, created_at desc);
create index if not exists certification_requests_status_idx
  on public.certification_requests(status);

-- RLS : le pro crée une demande en son nom (toujours « en attente ») et relit
-- les siennes ; l'administration trie l'ensemble via la clé de service.
alter table public.certification_requests enable row level security;

drop policy if exists "certification_insert_own" on public.certification_requests;
create policy "certification_insert_own" on public.certification_requests
  for insert to authenticated
  with check (
    pro_id = (select auth.uid())
    and status = 'pending'
    and admin_note is null
    and reviewed_at is null
  );

drop policy if exists "certification_select_own" on public.certification_requests;
create policy "certification_select_own" on public.certification_requests
  for select to authenticated
  using (pro_id = (select auth.uid()));

-- Bucket privé des pièces justificatives.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certification-docs',
  'certification-docs',
  false,
  2097152, -- 2 Mo par fichier (les photos arrivent réduites dans le navigateur)
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "certification_docs_insert_own" on storage.objects;
create policy "certification_docs_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'certification-docs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "certification_docs_select_own" on storage.objects;
create policy "certification_docs_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'certification-docs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
