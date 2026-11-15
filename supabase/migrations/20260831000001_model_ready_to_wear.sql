-- « Tel quel » = prêt-à-porter.
-- Le tailleur qui publie un modèle dit s'il l'a déjà cousu, prêt à partir, et
-- dans quelles couleurs. Le catalogue JALOFA (tailor_id null) ne se vend plus
-- « tel quel » : seulement sur mesure.
-- Idempotent : peut être rejoué sans risque dans le SQL Editor.

alter table public.models
  add column if not exists ready_to_wear boolean not null default false,
  add column if not exists ready_colors text[] not null default '{}';

-- Au plus 12 couleurs de 40 caractères — le formulaire borne déjà, la base aussi.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'models_ready_colors_max'
  ) then
    alter table public.models
      add constraint models_ready_colors_max
      check (coalesce(array_length(ready_colors, 1), 0) <= 12);
  end if;
end $$;
