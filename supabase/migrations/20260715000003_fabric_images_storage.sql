-- ---------------------------------------------------------------------------
-- Storage for fabric swatch photos.
--
-- Public bucket: the catalogue is browsable logged-out, so the photos have to
-- be readable without a session. Writes are namespaced by uploader — the first
-- path segment must be the vendor's own uid, which is what keeps one vendor
-- from overwriting another's swatches in a shared bucket.
--
-- The mime/size limits are enforced by the bucket itself rather than only in
-- the server action: the anon key can reach storage directly, so the ceiling
-- belongs where it cannot be bypassed.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fabric-images',
  'fabric-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "fabric_images_select_all" on storage.objects
  for select using (bucket_id = 'fabric-images');

create policy "fabric_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "fabric_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "fabric_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
