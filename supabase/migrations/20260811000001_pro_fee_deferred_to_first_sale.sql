-- Offre Pro « payée à la première vente » : le pro peut, à l'inscription,
-- choisir de ne pas payer tout de suite. L'offre Pro s'active, et les
-- 10 000 FCFA sont retenus sur le reversement de sa première vente.
--
-- Ce frais différé est une ligne de `subscription_payments` avec
-- provider = 'sale' et le nouveau statut 'deferred'. Idempotent.

begin;

alter table public.subscription_payments
  drop constraint if exists subscription_payments_status_check;

alter table public.subscription_payments
  add constraint subscription_payments_status_check
  check (status in ('pending', 'completed', 'cancelled', 'failed', 'deferred'));

-- Un seul frais différé ouvert par pro.
create unique index if not exists subscription_payments_one_deferred_idx
  on public.subscription_payments (pro_id)
  where status = 'deferred';

commit;
