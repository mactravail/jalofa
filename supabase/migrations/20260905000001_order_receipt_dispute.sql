-- « Avez-vous reçu votre commande ? » (2026-11-15)
--
-- Règle : le pro est payé 24 h après la livraison. Le client qui n'a PAS reçu
-- son colis a 24 h pour le dire ; un problème sur ce qu'il a reçu se signale à
-- tout moment.
--
-- Dans l'admin (« Colis à confirmer »), JALOFA demande au client sur WhatsApp
-- s'il a reçu sa commande :
--   - oui, ou pas de réponse en 24 h → la commande passe à « delivered » (le
--     tailleur et le vendeur peuvent être payés) ;
--   - non → `receipt_disputed_at` est rempli : la commande reste en route,
--     personne n'est payé tant que JALOFA n'a pas vérifié.
--
-- Écrit par JALOFA seulement (clé de service ou admin). Idempotent.

alter table public.orders
  add column if not exists receipt_disputed_at timestamptz;

create or replace function public.orders_receipt_dispute_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.receipt_disputed_at is distinct from old.receipt_disputed_at
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'Ces informations sont enregistrées par JALOFA'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_receipt_dispute_guard on public.orders;
create trigger orders_receipt_dispute_guard
  before update on public.orders
  for each row execute function public.orders_receipt_dispute_guard();
