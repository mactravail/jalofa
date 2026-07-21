-- ---------------------------------------------------------------------------
-- Fabric-sale notifications for vendors.
--
-- `notifications` deliberately has no insert policy: rows are only ever created
-- by this trigger, which runs as security definer so that a client checkout can
-- raise a notification on the vendor's account without being able to write
-- arbitrary ones.
--
-- The notification points at the order rather than freezing the fabric photo
-- and price into its body — the dashboard joins back through `order_id`, so a
-- corrected price or a re-shot swatch is reflected everywhere at once.
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column order_id uuid references public.orders(id) on delete cascade;

create index notifications_order_id_idx on public.notifications(order_id);

create or replace function public.notify_vendor_fabric_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fabric_name text;
begin
  -- No vendor on `own_fabric` orders: the client brings their own cloth.
  if new.vendor_id is null or new.fabric_id is null then
    return new;
  end if;

  select f.name into fabric_name from public.fabrics f where f.id = new.fabric_id;

  insert into public.notifications (user_id, type, title, body, link, order_id)
  values (
    new.vendor_id,
    'fabric_sale',
    'Nouvelle vente de tissu',
    coalesce(fabric_name, 'Tissu') || ' — '
      || trim(to_char(coalesce(new.fabric_meters, 0), 'FM999990.99')) || ' m',
    '/vendeur/espace',
    new.id
  );

  return new;
end;
$$;

create trigger orders_notify_vendor_fabric_sale
  after insert on public.orders
  for each row execute function public.notify_vendor_fabric_sale();
