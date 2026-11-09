-- ---------------------------------------------------------------------------
-- Disponibilité des tissus + argent du vendeur libéré à la réception du tissu.
--
-- - `fabrics.in_stock` : le pro indique si un tissu est disponible ou épuisé. Sans
--   indication, il est disponible (les mètres de `stock_meters` ne servent plus).
-- - Le vendeur est payé quand le tissu est reçu : par le tailleur (commande
--   complète) ou par le client (tissu seul). Ce n'est donc plus lui qui déclare
--   la réception : le trigger le limite à ses propres étapes et le client confirme
--   via `confirm_fabric_received`.
-- - Le vendeur d'une vente de tissu seul lit l'adresse de livraison du client.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

-- 1. Disponibilité ------------------------------------------------------------
alter table public.fabrics
  add column if not exists in_stock boolean not null default true;

-- 2. Le vendeur ne déclare que ses propres étapes -----------------------------
create or replace function public.guard_vendor_order_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
begin
  if pg_trigger_depth() > 1
     or current_user not in ('authenticated', 'anon')
     or public.is_admin()
     or new.status is not distinct from old.status
     or caller is distinct from old.vendor_id
     or caller is not distinct from old.tailor_id
     or caller is not distinct from old.client_id
  then
    return new;
  end if;

  if new.status not in ('accepted', 'fabric_prepared', 'fabric_shipped', 'rejected', 'cancelled') then
    raise exception 'La réception du tissu est confirmée par celui qui le reçoit'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_vendor_status on public.orders;
create trigger orders_guard_vendor_status
  before update of status on public.orders
  for each row execute function public.guard_vendor_order_status();

-- 3. Le client confirme la réception de son tissu -----------------------------
-- `security definer` : le client n'a pas le droit de faire avancer une commande
-- en général, seulement ce geste précis.
create or replace function public.confirm_fabric_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.orders
     set status = 'delivered'
   where id = p_order_id
     and client_id = (select auth.uid())
     and type = 'fabric_only'
     and status = 'fabric_shipped';

  if not found then
    raise exception 'Cette commande ne peut pas être confirmée'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.confirm_fabric_received(uuid) from public, anon;
grant execute on function public.confirm_fabric_received(uuid) to authenticated;

-- 4. Le client est aussi prévenu quand son tissu seul part --------------------
create or replace function public.notify_fabric_journey()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fabric_name text;
  atelier_name text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.type = 'fabric_only' then
    if new.status = 'fabric_shipped' then
      insert into public.notifications (user_id, type, title, body, link, order_id)
      values (new.client_id, 'fabric_shipped', 'Votre tissu est en route',
              'À l''arrivée, touchez « J''ai reçu mon tissu ».',
              '/compte/commandes/' || new.id, new.id);
    end if;
    return new;
  end if;

  if new.type <> 'full'
     or new.vendor_id is null
     or new.tailor_id is null
     or new.vendor_id = new.tailor_id
     or new.status not in ('fabric_shipped', 'fabric_received_by_tailor')
  then
    return new;
  end if;

  select f.name into fabric_name from public.fabrics f where f.id = new.fabric_id;
  select t.shop_name into atelier_name from public.tailors t where t.id = new.tailor_id;

  if new.status = 'fabric_shipped' then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values
      (new.client_id, 'fabric_shipped', 'Votre tissu est en route',
       'Le vendeur l''a envoyé à l''atelier de ' || coalesce(atelier_name, 'votre tailleur') || '.',
       '/compte/commandes/' || new.id, new.id),
      (new.tailor_id, 'fabric_shipped', 'Un tissu arrive à votre atelier',
       coalesce(fabric_name, 'Tissu') || ' pour la commande ' || new.order_number
         || '. À l''arrivée, touchez « J''ai reçu le tissu ».',
       '/tailleur/espace/en-cours', new.id);
  else
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values
      (new.client_id, 'fabric_received', 'Votre tailleur a bien reçu le tissu',
       coalesce(atelier_name, 'Votre tailleur') || ' peut commencer la couture.',
       '/compte/commandes/' || new.id, new.id);
  end if;

  return new;
end;
$$;

-- 5. Adresse de livraison : le vendeur d'un tissu seul livre le client --------
-- (le tailleur la lit déjà, `addresses_select_order_tailor`). Sur une commande
-- complète, le vendeur livre l'atelier et ne voit pas l'adresse du client.
drop policy if exists addresses_select_order_vendor on public.addresses;
create policy addresses_select_order_vendor on public.addresses
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.address_id = addresses.id
        and o.type = 'fabric_only'
        and o.vendor_id = (select auth.uid())
    )
  );

commit;

notify pgrst, 'reload schema';
