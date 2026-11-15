-- Devis automatique par modèle : le tailleur choisit, à la publication, de
-- chiffrer chaque demande lui-même (« manual », par défaut) ou de répondre
-- automatiquement avec un prix fixe, un prix de livraison et un délai
-- (« auto »). Une demande de devis sur un modèle « auto » arrive donc déjà
-- chiffrée au client, qui peut accepter et payer tout de suite.
-- Idempotent.

begin;

alter table public.models
  add column if not exists quote_mode text not null default 'manual',
  add column if not exists quote_price integer,
  add column if not exists quote_delivery_fee integer not null default 0,
  add column if not exists quote_ready_days smallint;

alter table public.models drop constraint if exists models_quote_mode_check;
alter table public.models
  add constraint models_quote_mode_check check (quote_mode in ('manual', 'auto'));

alter table public.models drop constraint if exists models_quote_price_check;
alter table public.models
  add constraint models_quote_price_check check (quote_price is null or quote_price > 0);

alter table public.models drop constraint if exists models_quote_delivery_fee_check;
alter table public.models
  add constraint models_quote_delivery_fee_check check (quote_delivery_fee >= 0);

alter table public.models drop constraint if exists models_quote_ready_days_check;
alter table public.models
  add constraint models_quote_ready_days_check
  check (quote_ready_days is null or quote_ready_days between 1 and 120);

-- Un devis automatique a toujours son prix et son délai.
alter table public.models drop constraint if exists models_quote_auto_complete_check;
alter table public.models
  add constraint models_quote_auto_complete_check
  check (quote_mode <> 'auto' or (quote_price is not null and quote_ready_days is not null));

-- Le tailleur voit dans ses commandes que ce devis est parti tout seul.
alter table public.orders
  add column if not exists quote_auto boolean not null default false;

commit;

notify pgrst, 'reload schema';
