-- =============================================================================
-- JALOFA — Subscription plan on pros (tailors + vendors)
--
-- Le plan décide de la commission prélevée par la plateforme au moment de
-- l'encaissement : `free` = 5% par métier, `standard`/`premium` = 0%. C'est ce
-- que l'administration lit pour ventiler les reversements (cf. `src/lib/payouts`)
-- et la part propre à JALOFA. Défaut `free` : le cas prudent (avec commission)
-- pour toute ligne existante ou tout compte qui n'a pas encore choisi de plan.
-- =============================================================================
create type public.subscription_plan as enum ('free', 'standard', 'premium');

alter table public.tailors
  add column plan public.subscription_plan not null default 'free';

alter table public.vendors
  add column plan public.subscription_plan not null default 'free';
