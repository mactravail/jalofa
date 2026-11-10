-- Devis du tailleur : en plus du prix, un délai (« prêt dans 6 jours ») et une
-- note brève pour le client. Renseignés par `quoteOrder` (client de service).
-- Idempotent.

begin;

alter table public.orders
  add column if not exists quote_ready_days smallint,
  add column if not exists quote_note text;

alter table public.orders
  drop constraint if exists orders_quote_ready_days_check;
alter table public.orders
  add constraint orders_quote_ready_days_check
  check (quote_ready_days is null or quote_ready_days between 1 and 120);

alter table public.orders
  drop constraint if exists orders_quote_note_check;
alter table public.orders
  add constraint orders_quote_note_check
  check (quote_note is null or char_length(quote_note) <= 200);

commit;

notify pgrst, 'reload schema';
