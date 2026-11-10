-- ---------------------------------------------------------------------------
-- Photo de silhouette jointe à une taille standard (S, M, L, XL…).
--
-- Le client qui ne connaît pas ses mesures peut joindre une photo de lui, ou
-- d'une personne qui a la même silhouette : le tailleur ajuste mieux.
--
-- Bucket PRIVÉ : une photo de personne n'est jamais publique. Le client écrit
-- sous `<uid>/…` ; personne ne lit directement. Le serveur fabrique un lien signé
-- pour le tailleur de la commande, et seulement une fois la commande payée (avant
-- le paiement, le pro ne connaît que le code et l'adresse : cf. 20260810000001).
--
-- Idempotent : peut être rejoué sans risque dans l'éditeur SQL.
-- ---------------------------------------------------------------------------
begin;

alter table public.measurements
  add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'body-photos',
  'body-photos',
  false,
  2097152, -- 2 Mo (les photos arrivent compressées à ~100 Ko)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "body_photos_insert_own" on storage.objects;
create policy "body_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "body_photos_select_own" on storage.objects;
create policy "body_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "body_photos_delete_own" on storage.objects;
create policy "body_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
