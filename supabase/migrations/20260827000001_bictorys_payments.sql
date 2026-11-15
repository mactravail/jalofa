-- ---------------------------------------------------------------------------
-- Bictorys : paiement réel des commandes (à appliquer APRÈS 20260826000001).
--
-- - `open_payment` prend un prestataire : `bictorys` ouvre un paiement EN
--   ATTENTE (les commandes naissent « en attente de paiement ») ; `manual`
--   reste le stub d'avant (payé tout de suite) tant que Bictorys n'est pas
--   configuré.
-- - `confirm_payment` (webhook vérifié, clé de service) : passe les commandes
--   payées, accepte les devis, répartit les frais RÉELS Bictorys au registre.
-- - `fail_payment` : paiement échoué/annulé/expiré → commandes directes
--   annulées, devis rendus au client pour qu'il réessaie.
-- - Le vendeur n'est prévenu d'une vente qu'une fois le paiement confirmé.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

-- 1. Paiement : ce que Bictorys nous a renvoyé -------------------------------
alter table public.payments
  add column if not exists checkout_url text,
  add column if not exists provider_charge_id text,
  add column if not exists provider_status text,
  add column if not exists customer_fee numeric(12, 2) check (customer_fee >= 0);

-- 2. Ouvrir un paiement -------------------------------------------------------
drop function if exists public.open_payment(numeric, text);
create or replace function public.open_payment(
  p_amount numeric,
  p_idempotency_key text,
  p_provider text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
  pid uuid;
begin
  if caller is null then raise exception 'Connectez-vous' using errcode = '42501'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'Montant invalide' using errcode = '22023'; end if;
  if p_provider not in ('manual', 'bictorys') then
    raise exception 'Prestataire inconnu' using errcode = '22023';
  end if;

  insert into public.payments (client_id, provider, idempotency_key, amount, status, confirmed_at)
  values (
    caller, p_provider, caller || ':' || p_idempotency_key, p_amount,
    case when p_provider = 'manual' then 'paid' else 'pending' end,
    case when p_provider = 'manual' then now() end
  )
  on conflict (idempotency_key) do nothing
  returning id into pid;

  if pid is null then
    select id into pid from public.payments where idempotency_key = caller || ':' || p_idempotency_key;
  end if;
  return pid;
end;
$$;
revoke all on function public.open_payment(numeric, text, text) from public, anon;
grant execute on function public.open_payment(numeric, text, text) to authenticated;

-- 3. Confirmer (webhook vérifié) ----------------------------------------------
-- p_amount : le montant du paiement côté JALOFA, déjà comparé par le serveur au
-- montant Bictorys (frais client éventuels déduits). Service role uniquement.
drop function if exists public.confirm_payment(uuid, text, numeric, text, numeric);
create or replace function public.confirm_payment(
  p_payment_id uuid,
  p_provider_ref text,
  p_amount numeric,
  p_currency text,
  p_provider_fee numeric,
  p_customer_fee numeric default null,
  p_provider_status text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pay public.payments;
  o record;
  n int;
  i int := 0;
  fee_left numeric;
  share numeric;
begin
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Paiement introuvable'; end if;
  if pay.status = 'paid' then return; end if; -- webhook en double
  if pay.amount <> p_amount or pay.currency <> p_currency then
    raise exception 'Montant ou devise inattendus';
  end if;

  update public.payments
     set status = 'paid', provider_ref = p_provider_ref, provider_fee = p_provider_fee,
         customer_fee = p_customer_fee, provider_status = p_provider_status, confirmed_at = now()
   where id = pay.id;

  -- Devis : le paiement en fait une commande ferme.
  update public.orders
     set payment_status = 'paid',
         status = case when coalesce(is_quote, false) and status = 'received'
                       then 'accepted'::public.order_status else status end
   where payment_id = pay.id and payment_status = 'pending';

  -- Frais réels du prestataire, répartis au prorata des commandes du panier
  -- (le dernier ordre prend l'arrondi). Rien si Bictorys n'en annonce pas.
  if coalesce(p_provider_fee, 0) > 0 then
    select count(*) into n from public.orders where payment_id = pay.id;
    fee_left := p_provider_fee;
    for o in
      select id, total_amount from public.orders where payment_id = pay.id order by created_at, id
    loop
      i := i + 1;
      share := case when i = n then fee_left
                    else round(p_provider_fee * o.total_amount / nullif(pay.amount, 0)) end;
      fee_left := fee_left - share;
      insert into public.order_ledger (order_id, payment_id, entry_type, party, amount, idempotency_key, external_ref, note)
      values (o.id, pay.id, 'provider_fee', 'provider', share,
              'provider_fee:' || pay.id || ':' || o.id, p_provider_ref, 'Frais Bictorys réels')
      on conflict (idempotency_key) do nothing;
    end loop;
  end if;
end;
$$;
revoke all on function public.confirm_payment(uuid, text, numeric, text, numeric, numeric, text) from public, anon, authenticated;

-- 4. Échec, annulation ou expiration ------------------------------------------
create or replace function public.fail_payment(p_payment_id uuid, p_provider_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pay public.payments;
begin
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Paiement introuvable'; end if;
  if pay.status <> 'pending' then return; end if; -- déjà réglé : un échec tardif ne défait rien

  update public.payments
     set status = 'failed', provider_status = p_provider_status
   where id = pay.id;

  -- Commande directe : annulée (le client repasse par son panier).
  update public.orders
     set status = 'cancelled', payment_status = 'failed'
   where payment_id = pay.id and payment_status = 'pending' and not coalesce(is_quote, false);

  -- Devis : il reste en attente, le client peut payer à nouveau.
  update public.orders
     set payment_id = null
   where payment_id = pay.id and payment_status = 'pending' and coalesce(is_quote, false);
end;
$$;
revoke all on function public.fail_payment(uuid, text) from public, anon, authenticated;

-- 5. Le vendeur est prévenu d'une vente une fois PAYÉE -----------------------
create or replace function public.notify_vendor_fabric_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fabric_name text;
  atelier_name text;
  body_text text;
begin
  if new.vendor_id is null or new.fabric_id is null then
    return new;
  end if;

  -- Le tissu appartient au tailleur de la commande : rien à vendre ni à envoyer.
  if new.vendor_id is not distinct from new.tailor_id then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Commande déjà payée (paiement manuel) ; sinon, on attend le paiement.
    if new.payment_status <> 'paid' then
      return new;
    end if;
  else
    if not (old.payment_status = 'pending' and new.payment_status = 'paid') then
      return new;
    end if;
  end if;

  select f.name into fabric_name from public.fabrics f where f.id = new.fabric_id;

  body_text := coalesce(fabric_name, 'Tissu') || ' — '
    || trim(to_char(coalesce(new.fabric_meters, 0), 'FM999990.99')) || ' m';

  if new.tailor_id is not null then
    select t.shop_name into atelier_name from public.tailors t where t.id = new.tailor_id;
    body_text := body_text || '. À envoyer à l''atelier de '
      || coalesce(atelier_name, 'ce tailleur') || '.';
  end if;

  if new.delivery_option = 'economy' then
    body_text := body_text || ' Économique : attendez 24 h avant d''envoyer.';
  else
    body_text := body_text || ' Express : envoyez aujourd''hui.';
  end if;

  insert into public.notifications (user_id, type, title, body, link, order_id)
  values (
    new.vendor_id,
    'fabric_sale',
    'Nouvelle vente de tissu',
    body_text,
    '/vendeur/espace/a-traiter',
    new.id
  );

  return new;
end;
$$;

commit;

notify pgrst, 'reload schema';
