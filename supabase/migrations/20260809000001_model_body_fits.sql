-- ---------------------------------------------------------------------------
-- La quantité de tissu d'un modèle est décidée par le tailleur qui le publie.
--
-- `body_fits` : pour chaque silhouette, les mètres de tissu qu'il faut selon la
-- taille de la personne, et les intervalles de mesures (en cm) du corps.
--   [{ "body": "moyen",
--      "meters": { "petite": 5, "moyenne": 6, "grande": 6.5, "tres_grande": 7 },
--      "ranges": { "chest": { "min": 92, "max": 102 }, "waist": {…}, "hips": {…},
--                  "shoulders": {…} } }]
--
-- Les policies existantes de `models` (`models_write_own`) couvrent cette colonne.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

alter table public.models
  add column if not exists body_fits jsonb not null default '[]'::jsonb;

alter table public.models
  drop constraint if exists models_body_fits_is_array;
alter table public.models
  add constraint models_body_fits_is_array
  check (jsonb_typeof(body_fits) = 'array');

commit;

notify pgrst, 'reload schema';
