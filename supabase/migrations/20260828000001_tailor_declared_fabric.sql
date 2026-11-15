-- Le tailleur peut dire « J'ai reçu le tissu » même si le vendeur n'a pas
-- touché « Tissu envoyé » (2026-11-13). Un vendeur qui oublie de déclarer
-- l'envoi ne doit plus retarder la couture.
--
-- En contrepartie, JALOFA appelle le vendeur pour vérifier que c'est vrai :
-- tant que ce n'est pas confirmé, l'argent du tissu reste retenu.
--
--   orders.fabric_vendor_check : null       = rien à vérifier (envoi déclaré par le vendeur)
--                                'pending'  = réception déclarée par le tailleur seul : à vérifier
--                                'confirmed'= le vendeur confirme avoir envoyé : il peut être payé
--                                'denied'   = le vendeur dit n'avoir rien envoyé : pas de paiement
--
-- À appliquer APRÈS 20260826000001 (redéfinit `orders_workflow_guard`).
-- Idempotent.

-- 1. La colonne -----------------------------------------------------------------
alter table public.orders
  add column if not exists fabric_vendor_check text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_fabric_vendor_check_values'
  ) then
    alter table public.orders
      add constraint orders_fabric_vendor_check_values
      check (fabric_vendor_check is null or fabric_vendor_check in ('pending', 'confirmed', 'denied'));
  end if;
end $$;

create index if not exists orders_fabric_vendor_check_pending_idx
  on public.orders (created_at)
  where fabric_vendor_check = 'pending';

-- 2. La garde du workflow : réception possible sans envoi déclaré ---------------
create or replace function public.orders_workflow_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  privileged boolean := current_user not in ('authenticated', 'anon') or public.is_admin();
  pre_cut boolean;
  block text;
begin
  -- Colonnes écrites par le serveur seulement.
  if not privileged and (
       new.delivery_option is distinct from old.delivery_option
    or new.fabric_owner is distinct from old.fabric_owner
    or new.payment_id is distinct from old.payment_id
    or new.paid_at is distinct from old.paid_at
    or new.amount_paid is distinct from old.amount_paid
    or new.fabric_delivery_fee is distinct from old.fabric_delivery_fee
    or new.fabric_shipped_at is distinct from old.fabric_shipped_at
    or new.fabric_received_at is distinct from old.fabric_received_at
    or new.fabric_vendor_check is distinct from old.fabric_vendor_check
    or new.cut_started_at is distinct from old.cut_started_at
    or new.cut_was_authorized is distinct from old.cut_was_authorized
    or new.workflow_hold is distinct from old.workflow_hold
    or new.refund_status is distinct from old.refund_status
  ) then
    raise exception 'Ces informations sont enregistrées par JALOFA'
      using errcode = '42501';
  end if;

  -- Paiement confirmé : horodatage serveur.
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
    new.amount_paid := coalesce(new.amount_paid, new.total_amount);
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Demande d'annulation en cours : tout est gelé, sauf la décision de JALOFA.
  if new.status <> 'cancelled' and public.order_has_pending_cancellation(old.id) then
    raise exception 'Demande d''annulation en cours : la commande est bloquée'
      using errcode = '42501';
  end if;

  if new.status <> 'cancelled' and new.status <> 'rejected' and old.workflow_hold then
    raise exception 'Commande bloquée par JALOFA (litige en cours)'
      using errcode = '42501';
  end if;

  -- Envoi du tissu.
  if new.status = 'fabric_shipped' then
    block := public.order_ship_block(old);
    if block is not null and block <> 'not_applicable' then
      raise exception 'Envoi du tissu pas encore autorisé (%)', block
        using errcode = '42501';
    end if;
    new.fabric_shipped_at := coalesce(old.fabric_shipped_at, now());
  end if;

  -- Réception par le tailleur. Si le vendeur n'a rien déclaré, le tailleur peut
  -- quand même confirmer : JALOFA vérifiera auprès du vendeur avant de le payer.
  if new.status = 'fabric_received_by_tailor' then
    if old.payment_status <> 'paid' then
      raise exception 'Paiement pas encore confirmé'
        using errcode = '42501';
    end if;
    if old.fabric_shipped_at is null
       and new.fabric_shipped_at is null
       and public.order_fabric_owner(old) = 'vendor'
    then
      new.fabric_vendor_check := 'pending';
    end if;
    new.fabric_received_at := coalesce(old.fabric_received_at, now());
  end if;

  -- Découpe : premier passage à une étape de confection.
  pre_cut := old.status in ('received', 'accepted', 'fabric_prepared', 'fabric_shipped', 'fabric_received_by_tailor');
  if old.type <> 'fabric_only'
     and pre_cut
     and new.status in ('in_production', 'sewing', 'quality_check', 'shipped', 'delivered')
  then
    -- La réception éventuelle de cette même mise à jour compte.
    block := public.order_cut_block(new);
    if block is not null and block <> 'already_started' then
      raise exception 'Découpe pas encore autorisée (%)', block
        using errcode = '42501';
    end if;
    new.cut_started_at := coalesce(old.cut_started_at, now());
    new.cut_was_authorized := true;
  end if;

  return new;
end;
$$;

-- 3. Journal + alerte JALOFA quand la réception n'a pas d'envoi déclaré ----------
create or replace function public.orders_vendor_check_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  shop text;
begin
  if new.fabric_vendor_check is not distinct from old.fabric_vendor_check then
    return new;
  end if;

  insert into public.order_events (order_id, event_type, actor_id, actor_role, old_value, new_value)
  values (new.id, 'vendor_shipment_check', (select auth.uid()),
          case when public.is_admin() then 'admin'
               when (select auth.uid()) = new.tailor_id then 'tailor'
               else 'system' end,
          old.fabric_vendor_check, new.fabric_vendor_check);

  if new.fabric_vendor_check = 'pending' then
    select v.shop_name into shop from public.vendors v where v.id = new.vendor_id;
    -- Le vendeur : on lui dit ce qui s'est passé.
    if new.vendor_id is not null then
      insert into public.notifications (user_id, type, title, body, link, order_id)
      values (new.vendor_id, 'vendor_shipment_check', 'Le tailleur a reçu votre tissu',
              'Commande ' || new.order_number || ' : JALOFA va vous appeler pour confirmer l''envoi.',
              '/vendeur/espace', new.id);
    end if;
    -- JALOFA : appeler le vendeur.
    insert into public.notifications (user_id, type, title, body, link, order_id)
    select p.id, 'vendor_shipment_check', 'Envoi de tissu à vérifier',
           'Commande ' || new.order_number || ' : le tailleur a reçu le tissu, '
             || coalesce(shop, 'le vendeur') || ' n''a pas déclaré l''envoi. Appelez-le.',
           '/admin/envois', new.id
      from public.profiles p where p.role = 'admin';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_vendor_check_alert on public.orders;
create trigger orders_vendor_check_alert
  after update of fabric_vendor_check on public.orders
  for each row execute function public.orders_vendor_check_alert();

-- 4. JALOFA tranche après avoir appelé le vendeur --------------------------------
create or replace function public.verify_vendor_fabric_shipment(
  p_order_id uuid,
  p_confirmed boolean,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
begin
  if not public.is_admin() then
    raise exception 'Réservé à JALOFA' using errcode = '42501';
  end if;

  update public.orders
     set fabric_vendor_check = case when p_confirmed then 'confirmed' else 'denied' end,
         -- Confirmé : l'envoi est réputé fait au plus tard à la réception.
         fabric_shipped_at = case when p_confirmed
                                  then coalesce(fabric_shipped_at, fabric_received_at, now())
                                  else fabric_shipped_at end
   where id = p_order_id
     and fabric_vendor_check in ('pending', 'denied', 'confirmed');
  if not found then
    raise exception 'Aucune vérification en cours sur cette commande'
      using errcode = '22023';
  end if;

  if nullif(trim(p_note), '') is not null then
    insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, note)
    values (p_order_id, 'vendor_shipment_verified', caller, 'admin',
            case when p_confirmed then 'confirmed' else 'denied' end, left(p_note, 500));
  end if;
end;
$$;
revoke all on function public.verify_vendor_fabric_shipment(uuid, boolean, text) from public, anon;
grant execute on function public.verify_vendor_fabric_shipment(uuid, boolean, text) to authenticated;
