-- ---------------------------------------------------------------------------
-- Storage for client review photos — same shape as `fabric-images` &
-- `tailor-images`: public read (reviews are browsable logged-out on a shop
-- page), writes namespaced by the uploader's uid, mime/size ceiling on the
-- bucket because the anon key reaches storage directly.
--
-- Feeds `review_photos.image_url`: up to 3 photos a client attaches to the
-- review they leave on a tailor after a delivered order.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "review_photos_select_all" on storage.objects
  for select using (bucket_id = 'review-photos');

create policy "review_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "review_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "review_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
