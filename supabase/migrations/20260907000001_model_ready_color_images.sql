-- Prêt-à-porter : une photo par couleur.
-- Le tailleur montre le modèle dans chaque couleur qu'il a cousue.
-- `{ "Bleu marine": "https://…/model-images/<uid>/….webp" }` ; absente = photos du modèle.
-- À appliquer APRÈS 20260903000001_model_ready_color_prices.sql.
-- Idempotent : peut être rejoué sans risque dans le SQL Editor.

alter table public.models
  add column if not exists ready_color_images jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'models_ready_color_images_object'
  ) then
    alter table public.models
      add constraint models_ready_color_images_object
      check (jsonb_typeof(ready_color_images) = 'object');
  end if;
end $$;

notify pgrst, 'reload schema';
