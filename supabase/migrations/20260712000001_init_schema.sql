-- =============================================================================
-- JALOFA — Initial schema
-- Tailoring marketplace: clients, tailors, fabric vendors, orders, chat, reviews.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('client', 'tailor', 'vendor', 'admin');

create type public.order_type as enum ('full', 'fabric_only', 'own_fabric');

create type public.order_status as enum (
  'received',
  'accepted',
  'rejected',
  'fabric_prepared',
  'fabric_shipped',
  'fabric_received_by_tailor',
  'in_production',
  'sewing',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled'
);

create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type public.payment_method as enum ('orange_money', 'wave', 'free_money', 'card');

create type public.measurement_mode as enum ('manual', 'standard');

create type public.delivery_method as enum ('home', 'pickup');

-- ---------------------------------------------------------------------------
-- Utility: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text,
  phone text,
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  recipient_name text,
  phone text,
  address_line text not null,
  city text not null,
  region text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses(user_id);

-- ---------------------------------------------------------------------------
-- Tailors (shop profile, id = profile id)
-- ---------------------------------------------------------------------------
create table public.tailors (
  id uuid primary key references public.profiles(id) on delete cascade,
  shop_name text,
  bio text,
  city text,
  base_price numeric(10, 2) not null default 0,
  avg_delivery_days int not null default 7,
  -- Le tailleur offre la livraison : affiché sur sa fiche publique et, à la
  -- caisse, les frais de livraison à domicile ne sont pas facturés au client.
  free_delivery boolean not null default false,
  cover_url text,
  rating numeric(2, 1) not null default 0,
  rating_count int not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tailors_city_idx on public.tailors(city);
create index tailors_active_idx on public.tailors(is_active);

create trigger tailors_updated_at
  before update on public.tailors
  for each row execute function public.set_updated_at();

create table public.tailor_photos (
  id uuid primary key default gen_random_uuid(),
  tailor_id uuid not null references public.tailors(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index tailor_photos_tailor_id_idx on public.tailor_photos(tailor_id);

-- ---------------------------------------------------------------------------
-- Vendors (fabric shop, id = profile id)
-- ---------------------------------------------------------------------------
create table public.vendors (
  id uuid primary key references public.profiles(id) on delete cascade,
  shop_name text,
  bio text,
  city text,
  cover_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fabric catalog
-- ---------------------------------------------------------------------------
create table public.fabric_categories (
  slug text primary key,
  name text not null,
  sort_order int not null default 0
);

create table public.fabrics (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade,
  name text not null,
  category_slug text references public.fabric_categories(slug),
  color text,
  material text,
  price_per_meter numeric(10, 2) not null default 0,
  description text,
  stock_meters numeric(10, 2) not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fabrics_vendor_id_idx on public.fabrics(vendor_id);
create index fabrics_category_idx on public.fabrics(category_slug);
create index fabrics_active_idx on public.fabrics(is_active);

create trigger fabrics_updated_at
  before update on public.fabrics
  for each row execute function public.set_updated_at();

create table public.fabric_photos (
  id uuid primary key default gen_random_uuid(),
  fabric_id uuid not null references public.fabrics(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);
create index fabric_photos_fabric_id_idx on public.fabric_photos(fabric_id);

-- ---------------------------------------------------------------------------
-- Model catalog (garment templates)
-- ---------------------------------------------------------------------------
create table public.model_categories (
  slug text primary key,
  name text not null,
  gender text not null check (gender in ('homme', 'femme', 'enfant', 'mixte')),
  sort_order int not null default 0
);

create table public.styles (
  slug text primary key,
  name text not null,
  sort_order int not null default 0
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_slug text references public.model_categories(slug),
  description text,
  difficulty text check (difficulty in ('facile', 'moyen', 'difficile')),
  avg_days int not null default 7,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index models_category_idx on public.models(category_slug);

create table public.model_photos (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);
create index model_photos_model_id_idx on public.model_photos(model_id);

create table public.model_styles (
  model_id uuid not null references public.models(id) on delete cascade,
  style_slug text not null references public.styles(slug) on delete cascade,
  primary key (model_id, style_slug)
);

-- ---------------------------------------------------------------------------
-- Measurements
-- ---------------------------------------------------------------------------
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  mode public.measurement_mode not null,
  standard_size text,
  height numeric(6, 2),
  chest numeric(6, 2),
  waist numeric(6, 2),
  hips numeric(6, 2),
  shoulders numeric(6, 2),
  arm_length numeric(6, 2),
  leg_length numeric(6, 2),
  neck numeric(6, 2),
  wrist numeric(6, 2),
  notes text,
  created_at timestamptz not null default now()
);
create index measurements_user_id_idx on public.measurements(user_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('NAT-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.order_seq')::text, 5, '0')),
  client_id uuid not null references public.profiles(id) on delete cascade,
  tailor_id uuid references public.tailors(id),
  vendor_id uuid references public.vendors(id),
  type public.order_type not null,
  model_id uuid references public.models(id),
  style_slug text references public.styles(slug),
  fabric_id uuid references public.fabrics(id),
  fabric_meters numeric(6, 2),
  measurement_id uuid references public.measurements(id),
  address_id uuid references public.addresses(id),
  delivery_method public.delivery_method not null default 'home',
  -- Ville de destination, dénormalisée sur la commande (et pas seulement dans
  -- `addresses`) : le pro regroupe ses colis par ville sans jointure, y compris
  -- pour un retrait en boutique où aucune adresse n'est créée.
  delivery_city text,
  status public.order_status not null default 'received',
  fabric_price numeric(10, 2) not null default 0,
  tailoring_price numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  payment_status public.payment_status not null default 'pending',
  payment_method public.payment_method,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_client_id_idx on public.orders(client_id);
create index orders_tailor_id_idx on public.orders(tailor_id);
create index orders_vendor_id_idx on public.orders(vendor_id);
create index orders_status_idx on public.orders(status);
create index orders_delivery_city_idx on public.orders(delivery_city);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history(order_id);

-- Record the initial status and every status change into history.
create or replace function public.log_order_status()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, status, created_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- ---------------------------------------------------------------------------
-- Chat messages (scoped to an order)
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  attachment_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_order_id_idx on public.messages(order_id);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  tailor_id uuid not null references public.tailors(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index reviews_tailor_id_idx on public.reviews(tailor_id);

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  image_url text not null
);

-- Keep the tailor's aggregate rating in sync.
create or replace function public.refresh_tailor_rating()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.tailor_id, old.tailor_id);
begin
  update public.tailors t
  set rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where tailor_id = target), 0),
      rating_count = (select count(*) from public.reviews where tailor_id = target)
  where t.id = target;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_tailor_rating();

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
create table public.favorite_tailors (
  user_id uuid not null references public.profiles(id) on delete cascade,
  tailor_id uuid not null references public.tailors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tailor_id)
);

create table public.favorite_fabrics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  fabric_id uuid not null references public.fabrics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, fabric_id)
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications(user_id);

-- ---------------------------------------------------------------------------
-- New user -> profile (+ shop row for tailors/vendors)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role public.user_role;
begin
  new_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'client');

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    new_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );

  if new_role = 'tailor' then
    insert into public.tailors (id, shop_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  elsif new_role = 'vendor' then
    insert into public.vendors (id, shop_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.tailors enable row level security;
alter table public.tailor_photos enable row level security;
alter table public.vendors enable row level security;
alter table public.fabric_categories enable row level security;
alter table public.fabrics enable row level security;
alter table public.fabric_photos enable row level security;
alter table public.model_categories enable row level security;
alter table public.styles enable row level security;
alter table public.models enable row level security;
alter table public.model_photos enable row level security;
alter table public.model_styles enable row level security;
alter table public.measurements enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.review_photos enable row level security;
alter table public.favorite_tailors enable row level security;
alter table public.favorite_fabrics enable row level security;
alter table public.notifications enable row level security;

-- Profiles ------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = (select auth.uid()));
create policy "profiles_select_order_party" on public.profiles
  for select using (
    exists (
      select 1 from public.orders o
      where (o.client_id = (select auth.uid()) and o.tailor_id = public.profiles.id)
         or (o.tailor_id = (select auth.uid()) and o.client_id = public.profiles.id)
    )
  );
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid()));

-- Addresses -----------------------------------------------------------------
create policy "addresses_own_all" on public.addresses
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "addresses_select_order_tailor" on public.addresses
  for select using (
    exists (
      select 1 from public.orders o
      where o.address_id = public.addresses.id and o.tailor_id = (select auth.uid())
    )
  );

-- Tailors (public shops) ----------------------------------------------------
create policy "tailors_select_all" on public.tailors for select using (true);
create policy "tailors_update_own" on public.tailors
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "tailor_photos_select_all" on public.tailor_photos for select using (true);
create policy "tailor_photos_write_own" on public.tailor_photos
  for all using (tailor_id = (select auth.uid())) with check (tailor_id = (select auth.uid()));

-- Vendors (public shops) ----------------------------------------------------
create policy "vendors_select_all" on public.vendors for select using (true);
create policy "vendors_update_own" on public.vendors
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Fabric catalog (public read, vendor writes own) ---------------------------
create policy "fabric_categories_select_all" on public.fabric_categories for select using (true);
create policy "fabrics_select_all" on public.fabrics for select using (true);
create policy "fabrics_write_own" on public.fabrics
  for all using (vendor_id = (select auth.uid())) with check (vendor_id = (select auth.uid()));
create policy "fabric_photos_select_all" on public.fabric_photos for select using (true);
create policy "fabric_photos_write_own" on public.fabric_photos
  for all using (
    exists (select 1 from public.fabrics f where f.id = fabric_id and f.vendor_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.fabrics f where f.id = fabric_id and f.vendor_id = (select auth.uid()))
  );

-- Model catalog (public read) ----------------------------------------------
create policy "model_categories_select_all" on public.model_categories for select using (true);
create policy "styles_select_all" on public.styles for select using (true);
create policy "models_select_all" on public.models for select using (true);
create policy "model_photos_select_all" on public.model_photos for select using (true);
create policy "model_styles_select_all" on public.model_styles for select using (true);

-- Measurements --------------------------------------------------------------
create policy "measurements_own_all" on public.measurements
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "measurements_select_order_tailor" on public.measurements
  for select using (
    exists (
      select 1 from public.orders o
      where o.measurement_id = public.measurements.id and o.tailor_id = (select auth.uid())
    )
  );

-- Orders --------------------------------------------------------------------
create policy "orders_select_party" on public.orders
  for select using (client_id = (select auth.uid()) or tailor_id = (select auth.uid()) or vendor_id = (select auth.uid()));
create policy "orders_insert_client" on public.orders
  for insert with check (client_id = (select auth.uid()));
create policy "orders_update_party" on public.orders
  for update using (client_id = (select auth.uid()) or tailor_id = (select auth.uid()) or vendor_id = (select auth.uid()));

-- Order status history ------------------------------------------------------
create policy "order_history_select_party" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = (select auth.uid()) or o.tailor_id = (select auth.uid()) or o.vendor_id = (select auth.uid()))
    )
  );
create policy "order_history_insert_party" on public.order_status_history
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = (select auth.uid()) or o.tailor_id = (select auth.uid()) or o.vendor_id = (select auth.uid()))
    )
  );

-- Messages ------------------------------------------------------------------
create policy "messages_select_party" on public.messages
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = (select auth.uid()) or o.tailor_id = (select auth.uid()) or o.vendor_id = (select auth.uid()))
    )
  );
create policy "messages_insert_party" on public.messages
  for insert with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = (select auth.uid()) or o.tailor_id = (select auth.uid()) or o.vendor_id = (select auth.uid()))
    )
  );

-- Reviews (public read, client writes own) ----------------------------------
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews
  for insert with check (
    client_id = (select auth.uid())
    and exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()))
  );
create policy "review_photos_select_all" on public.review_photos for select using (true);
create policy "review_photos_write_own" on public.review_photos
  for all using (
    exists (select 1 from public.reviews r where r.id = review_id and r.client_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.reviews r where r.id = review_id and r.client_id = (select auth.uid()))
  );

-- Favorites -----------------------------------------------------------------
create policy "favorite_tailors_own" on public.favorite_tailors
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "favorite_fabrics_own" on public.favorite_fabrics
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Notifications -------------------------------------------------------------
create policy "notifications_select_own" on public.notifications
  for select using (user_id = (select auth.uid()));
create policy "notifications_update_own" on public.notifications
  for update using (user_id = (select auth.uid()));
