-- JALOFA devient le SEUL vendeur de tissus (2026-11-20).
--
-- Plus de vendeurs de tissus, et les tailleurs ne vendent plus de tissu : tout
-- le catalogue appartient à JALOFA. Pour garder intacte la plomberie existante
-- (orders.vendor_id, fabric_owner = 'vendor', notifications, blocages
-- d'expédition, ledger, policy storage `<uid>/…`), JALOFA possède UNE ligne
-- `vendors` dont l'id est celui du compte administrateur principal
-- (le plus ancien profil `admin`). Elle est marquée `is_platform`.
--
-- Idempotent : rejouable sans risque dans l'éditeur SQL.

begin;

-- 1. La boutique JALOFA --------------------------------------------------------
alter table public.vendors
  add column if not exists is_platform boolean not null default false;

do $$
declare
  admin_id uuid;
begin
  select p.id into admin_id
  from public.profiles p
  where p.role = 'admin'
  order by p.created_at
  limit 1;

  if admin_id is null then
    raise exception 'Aucun profil admin : créez le compte administrateur avant cette migration.';
  end if;

  insert into public.vendors (id, shop_name, plan, is_activated)
  values (admin_id, 'JALOFA', 'free', true)
  on conflict (id) do nothing;

  update public.vendors
  set shop_name = 'JALOFA',
      is_platform = true,
      is_active = true,
      is_activated = true,
      is_suspended = false,
      sales_approved = true,
      sales_approved_at = coalesce(sales_approved_at, now()),
      country = coalesce(country, 'Sénégal'),
      city = coalesce(city, 'Dakar')
  where id = admin_id;

  -- Une seule boutique plateforme.
  update public.vendors set is_platform = false
  where is_platform and id <> admin_id;
end;
$$;

create or replace function public.jalofa_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id from public.vendors v where v.is_platform limit 1;
$$;
grant execute on function public.jalofa_vendor_id() to anon, authenticated;

-- 2. Le catalogue --------------------------------------------------------------
-- Les tissus « démo » (sans vendeur) deviennent des tissus JALOFA en vente.
update public.fabrics
set vendor_id = public.jalofa_vendor_id()
where vendor_id is null;

-- Les tissus des pros sont masqués (pas supprimés : les commandes passées
-- gardent leur tissu).
update public.fabrics
set is_active = false
where vendor_id is distinct from public.jalofa_vendor_id()
  and is_active;

-- Les boutiques de tissus des pros sont fermées.
update public.vendors
set is_active = false
where not is_platform and is_active;

-- 3. Seul l'administrateur écrit le catalogue de tissus -----------------------
drop policy if exists "fabrics_write_own" on public.fabrics;
create policy "fabrics_write_own" on public.fabrics
  for all
  using (vendor_id = (select auth.uid()) and public.is_admin())
  with check (vendor_id = (select auth.uid()) and public.is_admin());

drop policy if exists "fabric_photos_write_own" on public.fabric_photos;
create policy "fabric_photos_write_own" on public.fabric_photos
  for all using (
    public.is_admin() and exists (
      select 1 from public.fabrics f
      where f.id = fabric_id and f.vendor_id = (select auth.uid())
    )
  ) with check (
    public.is_admin() and exists (
      select 1 from public.fabrics f
      where f.id = fabric_id and f.vendor_id = (select auth.uid())
    )
  );

-- 4. L'inscription ne crée plus de boutique de tissus -------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed text;
  new_role public.user_role;
  shop text;
begin
  claimed := new.raw_user_meta_data ->> 'role';
  -- « vendor » n'existe plus côté produit : un ancien lien devient tailleur.
  new_role := case
    when claimed = 'client' then 'client'::public.user_role
    when claimed in ('tailor', 'vendor', 'pro') then 'tailor'::public.user_role
    else 'client'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    new_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );

  if new_role = 'tailor' then
    shop := new.raw_user_meta_data ->> 'full_name';
    insert into public.tailors (id, shop_name, plan, is_activated)
    values (new.id, shop, 'free', true)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- 5. Une vente de tissu prévient JALOFA dans l'admin --------------------------
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

  if new.vendor_id is not distinct from new.tailor_id then
    return new;
  end if;

  if tg_op = 'INSERT' then
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
    '/admin/boutique/a-traiter',
    new.id
  );

  return new;
end;
$$;

commit;

notify pgrst, 'reload schema';
