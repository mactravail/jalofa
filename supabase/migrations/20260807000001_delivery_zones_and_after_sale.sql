-- ---------------------------------------------------------------------------
-- Zones de livraison gratuite + après-vente (retour de tissu, retouches).
--
-- - `tailors.free_delivery_zone` : le tailleur dit où son prix inclut la livraison.
-- - `addresses.country` : nécessaire pour savoir si le client est dans la zone.
-- - `vendor_addresses` : où le client renvoie un tissu. Privée, lue côté serveur.
-- - `fabric_returns` et `order_alterations` : lecture seule pour les parties ; les
--   écritures passent par les server actions (client de service), qui vérifient
--   l'identité et les délais. Un client ne peut donc pas se déclarer remboursé.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

-- 1. Zones de livraison ------------------------------------------------------
alter table public.tailors
  add column if not exists free_delivery_zone text not null default 'none';

alter table public.tailors
  drop constraint if exists tailors_free_delivery_zone_check;
alter table public.tailors
  add constraint tailors_free_delivery_zone_check
  check (free_delivery_zone in ('none', 'dakar', 'senegal', 'world'));

-- « Livraison offerte » d'avant : le site ne livrait qu'au Sénégal.
update public.tailors
   set free_delivery_zone = 'senegal'
 where free_delivery and free_delivery_zone = 'none';

alter table public.addresses
  add column if not exists country text not null default 'Sénégal';

-- 2. Adresse de retour du vendeur --------------------------------------------
create table if not exists public.vendor_addresses (
  vendor_id  uuid primary key references public.vendors(id) on delete cascade,
  address    text not null check (length(trim(address)) > 0),
  phone      text not null check (length(trim(phone)) > 0),
  updated_at timestamptz not null default now()
);

alter table public.vendor_addresses enable row level security;

drop policy if exists vendor_addresses_owner on public.vendor_addresses;
create policy vendor_addresses_owner on public.vendor_addresses
  for all to authenticated
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

grant select, insert, update on public.vendor_addresses to authenticated;

-- 3. Retour d'un tissu -------------------------------------------------------
create table if not exists public.fabric_returns (
  order_id     uuid primary key references public.orders(id) on delete cascade,
  client_id    uuid not null references public.profiles(id) on delete cascade,
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  status       text not null default 'requested'
                 check (status in ('requested', 'received')),
  requested_at timestamptz not null default now(),
  received_at  timestamptz
);

create index if not exists fabric_returns_vendor_id_idx
  on public.fabric_returns(vendor_id);

alter table public.fabric_returns enable row level security;

drop policy if exists fabric_returns_select_party on public.fabric_returns;
create policy fabric_returns_select_party on public.fabric_returns
  for select to authenticated
  using (client_id = auth.uid() or vendor_id = auth.uid());

grant select on public.fabric_returns to authenticated;

-- 4. Retouche d'un vêtement --------------------------------------------------
create table if not exists public.order_alterations (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  tailor_id  uuid not null references public.tailors(id) on delete cascade,
  reason     text not null
               check (reason in ('too_big', 'too_small', 'slit_too_wide', 'other')),
  note       text,
  status     text not null default 'requested'
               check (status in ('requested', 'done')),
  created_at timestamptz not null default now(),
  done_at    timestamptz
);

create index if not exists order_alterations_order_id_idx
  on public.order_alterations(order_id);
create index if not exists order_alterations_tailor_id_idx
  on public.order_alterations(tailor_id);

alter table public.order_alterations enable row level security;

drop policy if exists order_alterations_select_party on public.order_alterations;
create policy order_alterations_select_party on public.order_alterations
  for select to authenticated
  using (client_id = auth.uid() or tailor_id = auth.uid());

grant select on public.order_alterations to authenticated;

commit;

notify pgrst, 'reload schema';
