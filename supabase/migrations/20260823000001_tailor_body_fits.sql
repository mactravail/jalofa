-- ---------------------------------------------------------------------------
-- Les mètres de tissu, une seule fois par tailleur.
--
-- Remplir le tableau corps × taille à chaque modèle était long : le tailleur
-- l'écrit désormais une fois, dans « Mes métrages », et il s'applique à tous ses
-- modèles (un tableau par collection : homme, femme, enfant).
--   { "homme":  [{ "body": "moyen", "meters": {…}, "ranges": {…} }, …],
--     "femme":  [...],
--     "enfant": [...] }
--
-- Lecture publique : le client voit ce métrage dans la personnalisation.
-- Écriture : le tailleur, sur sa propre ligne.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.tailor_body_fits (
  tailor_id  uuid primary key references public.tailors(id) on delete cascade,
  fits       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tailor_body_fits
  drop constraint if exists tailor_body_fits_is_object;
alter table public.tailor_body_fits
  add constraint tailor_body_fits_is_object check (jsonb_typeof(fits) = 'object');

alter table public.tailor_body_fits enable row level security;

drop policy if exists tailor_body_fits_read on public.tailor_body_fits;
create policy tailor_body_fits_read on public.tailor_body_fits
  for select to anon, authenticated
  using (true);

drop policy if exists tailor_body_fits_owner on public.tailor_body_fits;
create policy tailor_body_fits_owner on public.tailor_body_fits
  for all to authenticated
  using (tailor_id = auth.uid())
  with check (tailor_id = auth.uid());

grant select on public.tailor_body_fits to anon, authenticated;
grant insert, update, delete on public.tailor_body_fits to authenticated;

commit;

notify pgrst, 'reload schema';
