-- ---------------------------------------------------------------------------
-- Storage for tailor profile photos — same shape as `fabric-images` and
-- `model-images`: public read (a shop profile is browsable logged-out), writes
-- namespaced by the uploader's uid, mime/size ceiling on the bucket because the
-- anon key reaches storage directly.
--
-- Feeds `tailors.cover_url`: the profile picture shown on the public shop page
-- and in the tailor directory.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tailor-images',
  'tailor-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "tailor_images_select_all" on storage.objects
  for select using (bucket_id = 'tailor-images');

create policy "tailor_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "tailor_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "tailor_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
