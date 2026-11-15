-- ---------------------------------------------------------------------------
-- Broderie « Je choisis » : photo de la broderie voulue par le client.
--
-- Au récap du configurateur, le client qui choisit sa broderie joint une photo,
-- la décrit et donne sa couleur (description + couleur vont dans `orders.notes`).
-- La photo est rangée dans un bucket PRIVÉ, sous `<uid client>/<id commande>.jpg`.
-- Le tailleur la voit dès le devis par un lien signé fabriqué côté serveur
-- (clé de service) : personne ne lit le bucket directement, sauf son auteur.
--
-- Idempotent : peut être rejoué sans risque dans l'éditeur SQL.
-- ---------------------------------------------------------------------------
begin;

alter table public.orders
  add column if not exists embroidery_photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'embroidery-photos',
  'embroidery-photos',
  false,
  2097152, -- 2 Mo (les photos arrivent compressées à ~100 Ko)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "embroidery_photos_insert_own" on storage.objects;
create policy "embroidery_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'embroidery-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "embroidery_photos_select_own" on storage.objects;
create policy "embroidery_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'embroidery-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "embroidery_photos_delete_own" on storage.objects;
create policy "embroidery_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'embroidery-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
