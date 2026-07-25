-- ===========================================================================
-- JALOFA — Setup complet base de données (RESET + migrations + seed)
-- Projet gttvmpizeukswwyrpwif
-- À exécuter dans : Supabase Dashboard > SQL Editor > coller > Run
-- Ce script est RE-EXECUTABLE : le bloc RESET repart d'une base propre.
-- ===========================================================================

-- ===========================================================================
-- RESET — repart d'une base propre (evite "type ... already exists", etc.)
-- ===========================================================================
-- 1) Retire le trigger applicatif posé sur auth.users (hors schema public)
drop trigger if exists on_auth_user_created on auth.users;

-- 2) Supprime toutes les policies du Storage (schema storage, non touche par le reset public)
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

-- 3) Recree le schema public a neuf (supprime tables, types, fonctions applicatifs)
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260712000001_init_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260715000001_order_contact.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ---------------------------------------------------------------------------
-- Contact details captured at checkout.
--
-- Collected for every order, not only home deliveries: a pickup order still
-- needs an identified person to hand the piece to, and the addresses table
-- (which used to carry the name/phone) is only written for home delivery.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column contact_first_name text,
  add column contact_last_name text,
  add column contact_email text,
  add column contact_phone text;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260715000002_fabric_sale_notifications.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260715000003_fabric_images_storage.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ---------------------------------------------------------------------------
-- Storage for fabric swatch photos.
--
-- Public bucket: the catalogue is browsable logged-out, so the photos have to
-- be readable without a session. Writes are namespaced by uploader — the first
-- path segment must be the vendor's own uid, which is what keeps one vendor
-- from overwriting another's swatches in a shared bucket.
--
-- The mime/size limits are enforced by the bucket itself rather than only in
-- the server action: the anon key can reach storage directly, so the ceiling
-- belongs where it cannot be bypassed.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fabric-images',
  'fabric-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "fabric_images_select_all" on storage.objects
  for select using (bucket_id = 'fabric-images');

create policy "fabric_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "fabric_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "fabric_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260715000004_tailor_catalog.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ---------------------------------------------------------------------------
-- Tailors publish their own catalogue: signature models, and fabrics if they
-- want to sell cloth alongside their work.
--
-- `models.tailor_id` null = the platform catalogue from seed.sql, open to any
-- tailor. Non-null = a tailor's own design: it still lists in /modeles, but
-- ordering it locks its author as the tailor, so a competitor is never handed
-- someone else's signature cut.
-- ---------------------------------------------------------------------------
alter table public.models
  add column tailor_id uuid references public.tailors(id) on delete cascade;
create index models_tailor_id_idx on public.models(tailor_id);

-- Writes are scoped to the rows carrying the tailor's own id. The platform
-- catalogue (tailor_id is null) stays read-only from the client — it is seeded
-- through SQL, and `with check` makes a null-owner insert impossible anyway.
create policy "models_write_own" on public.models
  for all to authenticated
  using (tailor_id = (select auth.uid()))
  with check (tailor_id = (select auth.uid()));

create policy "model_photos_write_own" on public.model_photos
  for all to authenticated
  using (
    exists (
      select 1 from public.models m
      where m.id = model_id and m.tailor_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.models m
      where m.id = model_id and m.tailor_id = (select auth.uid())
    )
  );

-- A tailor who adds a fabric needs the shop row `fabrics.vendor_id` points at.
-- `handle_new_user` only creates one for role='vendor', so the row is created
-- on demand at the first save; the tailor's profile role stays 'tailor'.
create policy "vendors_insert_own" on public.vendors
  for insert to authenticated
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage for model photos — same shape as `fabric-images`: public read (the
-- catalogue is browsable logged-out), writes namespaced by the uploader's uid,
-- mime/size ceiling on the bucket because the anon key reaches storage direct.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'model-images',
  'model-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "model_images_select_all" on storage.objects
  for select using (bucket_id = 'model-images');

create policy "model_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "model_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "model_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260718000001_pro_subscription_plan.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- JALOFA — Subscription plan on pros (tailors + vendors)
--
-- Le plan décide de la commission prélevée par la plateforme au moment de
-- l'encaissement : `free` = 5% par métier, `standard`/`premium` = 0%. C'est ce
-- que l'administration lit pour ventiler les reversements (cf. `src/lib/payouts`)
-- et la part propre à JALOFA. Défaut `free` : le cas prudent (avec commission)
-- pour toute ligne existante ou tout compte qui n'a pas encore choisi de plan.
-- =============================================================================
create type public.subscription_plan as enum ('free', 'standard', 'premium');

alter table public.tailors
  add column plan public.subscription_plan not null default 'free';

alter table public.vendors
  add column plan public.subscription_plan not null default 'free';


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260718000001_tailor_images_storage.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ---------------------------------------------------------------------------
-- Storage for tailor profile photos — same shape as `fabric-images` and
-- `model-images`: public read (a shop profile is browsable logged-out), writes
-- namespaced by the uploader's uid, mime/size ceiling on the bucket because the
-- anon key reaches storage directly.
--
-- Feeds `tailors.cover_url`: the profile picture shown on the public shop page
-- and in the tailor directory.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tailor-images',
  'tailor-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "tailor_images_select_all" on storage.objects
  for select using (bucket_id = 'tailor-images');

create policy "tailor_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "tailor_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "tailor_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tailor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260718000002_pro_moderation.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- JALOFA — Modération des prestataires (tailleurs + vendeurs)
--
-- Deux leviers réservés à l'administration, distincts du `is_active` que le pro
-- règle lui-même (boutique ouverte / fermée) :
--
--   • Suspension (`is_suspended` + `suspension_reason`) : un blocage imposé par
--     la plateforme — abonnement impayé (`unpaid`) ou faute grave (`misconduct`).
--     Un pro suspendu disparaît du catalogue public et ne peut plus recevoir de
--     commande, quel que soit son propre `is_active`.
--   • Certification (`is_certified`) : un gage de confiance attribué par
--     l'administration, mis en avant sur la fiche publique du prestataire.
--
-- Libellés en français côté UI ; les identifiants restent en anglais (cf.
-- `src/lib/constants.ts`).
-- =============================================================================

create type public.suspension_reason as enum ('unpaid', 'misconduct');

alter table public.tailors
  add column is_suspended boolean not null default false,
  add column suspension_reason public.suspension_reason,
  add column is_certified boolean not null default false;

alter table public.vendors
  add column is_suspended boolean not null default false,
  add column suspension_reason public.suspension_reason,
  add column is_certified boolean not null default false;

-- Le catalogue public ne sert que les boutiques ouvertes ET non suspendues :
-- l'index accompagne le filtre `is_active = true and is_suspended = false`.
create index tailors_visible_idx on public.tailors(is_active, is_suspended);
create index vendors_visible_idx on public.vendors(is_active, is_suspended);

-- ---------------------------------------------------------------------------
-- Garde « administrateur »
--
-- `security definer` pour lire `profiles` sans être bloqué par sa propre RLS,
-- et pour offrir un test réutilisable aux policies de modération. `search_path`
-- verrouillé, comme le veut la bonne pratique Supabase.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Modération : seul l'administrateur peut suspendre / certifier un prestataire.
-- Les policies « _update_own » existantes laissent le pro éditer sa vitrine ;
-- celles-ci ajoutent la main de la plateforme, sans la lui donner sur ces
-- champs (l'application n'expose la suspension/certification qu'à l'admin).
create policy "tailors_update_admin" on public.tailors
  for update using (public.is_admin()) with check (public.is_admin());
create policy "vendors_update_admin" on public.vendors
  for update using (public.is_admin()) with check (public.is_admin());


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20260718000003_vendor_images_storage.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ---------------------------------------------------------------------------
-- Storage for vendor profile photos — same shape as `tailor-images`: public
-- read (a shop profile is browsable logged-out), writes namespaced by the
-- uploader's uid, mime/size ceiling on the bucket because the anon key reaches
-- storage directly.
--
-- Feeds `vendors.cover_url`: the profile picture shown on the public shop page
-- (`/vendeurs/[id]`) and in the vendor directory.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-images',
  'vendor-images',
  true,
  5242880, -- 5 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "vendor_images_select_all" on storage.objects
  for select using (bucket_id = 'vendor-images');

create policy "vendor_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vendor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "vendor_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'vendor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'vendor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "vendor_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vendor-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SEED: seed.sql (donnees catalogue)
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- JALOFA — Seed reference data (idempotent)
-- Catalog data that does not depend on a user account.
-- =============================================================================

-- Fabric categories ---------------------------------------------------------
insert into public.fabric_categories (slug, name, sort_order) values
  ('laine', 'Laine', 1),
  ('coton', 'Coton', 2),
  ('lin', 'Lin', 3)
on conflict (slug) do nothing;

-- Model categories ----------------------------------------------------------
insert into public.model_categories (slug, name, gender, sort_order) values
  ('homme', 'Homme', 'homme', 1),
  ('femme', 'Femme', 'femme', 2),
  ('enfant', 'Enfant', 'enfant', 3)
on conflict (slug) do nothing;

-- Styles --------------------------------------------------------------------
insert into public.styles (slug, name, sort_order) values
  ('moderne', 'Moderne', 1),
  ('traditionnel', 'Traditionnel', 2),
  ('elegant', 'Élégant', 3),
  ('mariage', 'Mariage', 4),
  ('casual', 'Casual', 5),
  ('luxe', 'Luxe', 6)
on conflict (slug) do nothing;

-- Models (garment templates) ------------------------------------------------
insert into public.models (name, category_slug, description, difficulty, avg_days, image_url) values
  ('Grand Boubou', 'homme', 'Ample tenue traditionnelle en trois pièces, symbole d''élégance.', 'moyen', 10, '/collection%20homme/style/grand%20boubou.jpg'),
  ('Kaftan', 'homme', 'Tunique longue et fluide, confortable et raffinée.', 'facile', 7, '/collection%20homme/style/kaftan.avif'),
  ('Chemise Africaine', 'homme', 'Chemise à motifs, coupe moderne ou classique.', 'facile', 5, '/collection%20homme/style/chemise.avif'),
  ('Costume', 'homme', 'Costume sur mesure, veste et pantalon.', 'difficile', 14, '/collection%20homme/style/costume%20crois%C3%A9.jpg'),
  ('Ensemble Bazin', 'homme', 'Ensemble deux-pièces en bazin riche : haut brodé et pantalon assorti, l''élégance sénégalaise du quotidien aux grandes occasions.', 'moyen', 9, '/collection%20homme/style/grand%20boubou%20ghana.avif'),
  ('Agbada', 'homme', 'Grande robe d''apparat brodée, portée sur un boubou et un pantalon — la pièce maîtresse des cérémonies ouest-africaines.', 'difficile', 12, '/collection%20homme/style/agbada.jpg'),
  ('Kaftan Brodé', 'homme', 'Kaftan tunique longue rehaussée de broderies au col et au plastron, raffiné pour les fêtes et le vendredi.', 'moyen', 8, '/collection%20homme/style/kaftan%20ghana.jpg'),
  ('Tenue de Cérémonie', 'homme', 'Grand ensemble de cérémonie, broderie riche et finitions soignées, pour mariages, baptêmes et grandes fêtes.', 'difficile', 12, '/collection%20homme/style/diomaye.jpg'),
  ('Costume Africain', 'homme', 'Costume à coupe africaine — veste col Mao ou Senghor et pantalon — l''allure business, en tissu local ou importé.', 'difficile', 12, '/collection%20homme/style/costume%20africain%20(2).jpg'),
  ('Veste Africaine', 'homme', 'Veste-blazer d''inspiration africaine, à porter sur une chemise ou un tee-shirt pour un style habillé décontracté.', 'moyen', 8, '/collection%20homme/style/pantalon%20veste.avif'),
  ('Gilet', 'homme', 'Gilet sans manches, brodé ou uni, porté seul ou sur une chemise pour structurer la silhouette.', 'facile', 5, '/collection%20homme/style/gilet.avif'),
  ('Pantalon', 'homme', 'Pantalon sur mesure — droit, cintré ou large façon saroual — en tissu au choix, seul ou pour compléter un ensemble.', 'facile', 5, '/collection%20homme/style/pantalon.avif'),
  ('Dashiki', 'homme', 'Tunique ample à enfiler, col brodé et motifs colorés — l''esprit panafricain, décontracté et festif.', 'facile', 5, '/collection%20homme/e.jpg'),
  ('Baye Lahat', 'homme', 'Grand boubou traditionnel à la coupe Baye Lahat, ample et solennel, prisé pour les grandes cérémonies religieuses.', 'difficile', 12, '/collection%20homme/style/baye%20lahat.jpg'),
  ('Thiaya', 'homme', 'Pantalon traditionnel sénégalais, taille haute et coupe ample, porté sous le boubou ou le kaftan.', 'facile', 5, '/collection%20homme/style/thiaya.jpg'),
  ('Robe', 'femme', 'Robe sur mesure, du quotidien à la cérémonie.', 'moyen', 9, '/collection%20femme/robe/w.avif'),
  ('Ensemble', 'femme', 'Ensemble coordonné haut et bas.', 'moyen', 8, '/collection%20femme/robe/o.avif'),
  ('Jupe', 'femme', 'Jupe sur mesure, plusieurs longueurs et coupes.', 'facile', 5, '/collection%20femme/jupe/j.avif'),
  ('Boubou Femme', 'femme', 'Boubou féminin élégant, brodé ou uni.', 'moyen', 10, '/collection%20femme/ceremonie/k.avif'),
  ('Boubou Enfant', 'enfant', 'Boubou pour enfant, coupe confortable.', 'facile', 5, '/models/boubou-enfant.jpg'),
  ('Ensemble Enfant', 'enfant', 'Ensemble assorti pour enfant.', 'facile', 5, '/models/ensemble-enfant.jpg')
on conflict do nothing;

-- Model galleries -----------------------------------------------------------
-- Ordre d'affichage : le vêtement seul, puis porté (devant, dos), puis les
-- détails. Photos servies depuis /public/collection homme|femme — l'espace du
-- dossier est encodé dans l'URL. Les modèles absents n'ont pas encore de
-- galerie et retombent sur `models.image_url`.
insert into public.model_photos (model_id, image_url, sort_order)
select m.id, p.image_url, p.sort_order
from public.models m
join (values
  ('Grand Boubou', '/collection%20homme/a1.avif', 0),
  ('Grand Boubou', '/collection%20homme/a2.avif', 1),
  ('Grand Boubou', '/collection%20homme/a3.avif', 2),
  ('Grand Boubou', '/collection%20homme/a4.avif', 3),
  ('Kaftan', '/collection%20homme/c1.avif', 0),
  ('Kaftan', '/collection%20homme/c.avif', 1),
  ('Kaftan', '/collection%20homme/c2.avif', 2),
  ('Chemise Africaine', '/collection%20homme/b1.avif', 0),
  ('Chemise Africaine', '/collection%20homme/b.avif', 1),
  ('Chemise Africaine', '/collection%20homme/b2.avif', 2),
  ('Chemise Africaine', '/collection%20homme/b3.avif', 3),
  ('Costume', '/collection%20homme/k1.avif', 0),
  ('Costume', '/collection%20homme/k.avif', 1),
  ('Costume', '/collection%20homme/k2.avif', 2),
  ('Pantalon', '/collection%20homme/style/pantalon.avif', 0),
  ('Robe', '/collection%20femme/robe/w.avif', 0),
  ('Robe', '/collection%20femme/robe/w1.avif', 1),
  ('Robe', '/collection%20femme/robe/w2.avif', 2),
  ('Ensemble', '/collection%20femme/robe/o.avif', 0),
  ('Ensemble', '/collection%20femme/robe/o1.avif', 1),
  ('Jupe', '/collection%20femme/jupe/j.avif', 0),
  ('Jupe', '/collection%20femme/jupe/j1.avif', 1),
  ('Jupe', '/collection%20femme/jupe/j2.avif', 2),
  ('Boubou Femme', '/collection%20femme/ceremonie/k.avif', 0),
  ('Boubou Femme', '/collection%20femme/ceremonie/k1.avif', 1),
  ('Boubou Femme', '/collection%20femme/ceremonie/k2.avif', 2)
) as p(model_name, image_url, sort_order) on p.model_name = m.name
on conflict do nothing;

-- Every model is available in every style for the MVP catalog.
insert into public.model_styles (model_id, style_slug)
select m.id, s.slug from public.models m cross join public.styles s
on conflict do nothing;

-- Demo fabrics (no vendor yet — replaced by real vendor listings later) ------
-- Swatch photos are served from /public/fabrics.
insert into public.fabrics (name, category_slug, color, material, price_per_meter, description, stock_meters, image_url) values
  ('Laine Mérinos Vert Forêt', 'laine', 'Vert forêt', 'Laine mérinos', 12000, 'Laine mérinos au tissage serré, teinte vert forêt profonde.', 60, '/fabrics/1.jpg'),
  ('Tweed Gris Chiné', 'laine', 'Gris chiné', 'Laine (tweed)', 11000, 'Tweed de laine gris chiné, texture chaude et structurée.', 45, '/fabrics/2.jpg'),
  ('Coton Sergé Bleu Marine', 'coton', 'Bleu marine', 'Coton sergé', 4500, 'Sergé de coton bleu marine, mat et résistant, coupe nette.', 130, '/fabrics/3.jpg'),
  ('Tweed à Carreaux Beige', 'laine', 'Beige', 'Laine (tweed)', 12500, 'Tweed à carreaux beige et bleu clair, esprit sport chic.', 40, '/fabrics/4.jpg'),
  ('Laine Bleu Royal', 'laine', 'Bleu royal', 'Laine', 13000, 'Laine bleu royal au micro-motif œil-de-perdrix, éclat discret.', 50, '/fabrics/5.jpg'),
  ('Flanelle Bleu Ardoise', 'laine', 'Bleu ardoise', 'Laine (flanelle)', 11500, 'Flanelle de laine bleu ardoise, toucher doux et fine rayure ton sur ton.', 55, '/fabrics/6.jpg'),
  ('Popeline Blanche', 'coton', 'Blanc', 'Coton', 3800, 'Popeline de coton blanche, indispensable pour chemises habillées.', 160, '/fabrics/7.jpg'),
  ('Popeline Gris Perle', 'coton', 'Gris perle', 'Coton', 3800, 'Popeline de coton gris perle, lumineuse et facile à porter.', 140, '/fabrics/8.jpg'),
  ('Sergé Bordeaux', 'laine', 'Bordeaux', 'Laine sergé', 10500, 'Sergé de laine bordeaux au tissage diagonal, profond et élégant.', 50, '/fabrics/9.jpg'),
  ('Seersucker Rayé Vert', 'coton', 'Vert', 'Coton (seersucker)', 5000, 'Seersucker de coton à rayures vertes, gaufré et respirant pour la chaleur.', 90, '/fabrics/10.jpg'),
  ('Lin Terracotta', 'lin', 'Terracotta', 'Lin', 6500, 'Lin terracotta au grain naturel, léger et respirant.', 80, '/fabrics/11.jpg'),
  ('Laine Prune', 'laine', 'Prune', 'Laine', 12000, 'Laine unie couleur prune, tombé souple et raffiné.', 45, '/fabrics/12.jpg'),
  ('Lin Vert Olive', 'lin', 'Vert olive', 'Lin', 6500, 'Lin vert olive au grain naturel, idéal pour les tenues d''été.', 75, '/fabrics/13.jpg'),
  ('Popeline Rose Poudré', 'coton', 'Rose', 'Coton', 3800, 'Popeline de coton rose poudré, douce et lumineuse.', 120, '/fabrics/14.jpg')
on conflict do nothing;
