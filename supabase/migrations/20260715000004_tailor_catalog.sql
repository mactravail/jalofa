-- ---------------------------------------------------------------------------
-- Tailors publish their own catalogue: signature models, and fabrics if they
-- want to sell cloth alongside their work.
--
-- `models.tailor_id` null = the platform catalogue from seed.sql, open to any
-- tailor. Non-null = a tailor's own design: it still lists in /modeles, but
-- ordering it locks its author as the tailor, so a competitor is never handed
-- someone else's signature cut.
-- ---------------------------------------------------------------------------
alter table public.models
  add column tailor_id uuid references public.tailors(id) on delete cascade;
create index models_tailor_id_idx on public.models(tailor_id);

-- Writes are scoped to the rows carrying the tailor's own id. The platform
-- catalogue (tailor_id is null) stays read-only from the client — it is seeded
-- through SQL, and `with check` makes a null-owner insert impossible anyway.
create policy "models_write_own" on public.models
  for all to authenticated
  using (tailor_id = (select auth.uid()))
  with check (tailor_id = (select auth.uid()));

create policy "model_photos_write_own" on public.model_photos
  for all to authenticated
  using (
    exists (
      select 1 from public.models m
      where m.id = model_id and m.tailor_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.models m
      where m.id = model_id and m.tailor_id = (select auth.uid())
    )
  );

-- A tailor who adds a fabric needs the shop row `fabrics.vendor_id` points at.
-- `handle_new_user` only creates one for role='vendor', so the row is created
-- on demand at the first save; the tailor's profile role stays 'tailor'.
create policy "vendors_insert_own" on public.vendors
  for insert to authenticated
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage for model photos — same shape as `fabric-images`: public read (the
-- catalogue is browsable logged-out), writes namespaced by the uploader's uid,
-- mime/size ceiling on the bucket because the anon key reaches storage direct.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'model-images',
  'model-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "model_images_select_all" on storage.objects
  for select using (bucket_id = 'model-images');

create policy "model_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "model_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "model_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
