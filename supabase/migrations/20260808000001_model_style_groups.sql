-- ---------------------------------------------------------------------------
-- Le style d'un modèle appartient au tailleur qui le publie.
--
-- - `style_groups` : ce que le client peut choisir sur CE modèle. Un thiaya n'a
--   pas de col : son tailleur ne crée simplement pas ce groupe. Chaque choix porte
--   une vraie photo et, s'il coûte plus cher, son supplément.
--     [{ "slug", "name", "options": [{ "slug", "name", "photo", "extra" }] }]
-- - `care_tips` : les recommandations du tailleur, une par ligne (lavage, choses
--   à éviter…).
--
-- Les photos vont dans le bucket `model-images`, sous le préfixe du tailleur.
-- Les policies existantes de `models` (`models_write_own`) couvrent ces colonnes.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

alter table public.models
  add column if not exists style_groups jsonb not null default '[]'::jsonb,
  add column if not exists care_tips text;

alter table public.models
  drop constraint if exists models_style_groups_is_array;
alter table public.models
  add constraint models_style_groups_is_array
  check (jsonb_typeof(style_groups) = 'array');

commit;

notify pgrst, 'reload schema';
