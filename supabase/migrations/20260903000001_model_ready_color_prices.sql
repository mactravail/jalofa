-- Prêt-à-porter : un prix par couleur.
-- Le tailleur peut vendre une couleur plus cher qu'une autre (ex. Blanc brodé or).
-- `{ "Blanc": 25000 }` ; une couleur absente = le prix du modèle.
-- À appliquer APRÈS 20260831000001_model_ready_to_wear.sql.
-- Idempotent : peut être rejoué sans risque dans le SQL Editor.

alter table public.models
  add column if not exists ready_color_prices jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'models_ready_color_prices_object'
  ) then
    alter table public.models
      add constraint models_ready_color_prices_object
      check (jsonb_typeof(ready_color_prices) = 'object');
  end if;
end $$;
