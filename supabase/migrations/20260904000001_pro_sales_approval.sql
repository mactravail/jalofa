-- ---------------------------------------------------------------------------
-- Ventes validées par JALOFA (anti-arnaque de la Sélection).
--
-- L'accès PRO est offert : n'importe qui peut créer un compte et publier. Pour
-- éviter qu'un faux pro encaisse des clients sans rien livrer :
--   • le pro publie librement — ses tissus, son prêt-à-porter et ses modèles
--     restent VISIBLES sur la plateforme ;
--   • mais aucun client ne peut lui acheter quoi que ce soit (tissu, tel quel,
--     sur mesure, devis) tant que l'administration n'a pas validé ses ventes
--     (`sales_approved = true`, page admin « Validations »).
--
-- `sales_approved` est une colonne privilégiée (le pro ne peut pas se valider
-- lui-même) et un trigger sur `orders` refuse toute commande vers un pro non
-- validé — même si l'application était contournée.
--
-- Les pros déjà inscrits sont validés d'office (ils ont été vus) ; seuls les
-- nouveaux comptes naissent « en attente ».
--
-- Idempotent : peut être rejoué sans risque.
-- ---------------------------------------------------------------------------

begin;

-- 1. La colonne -------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tailors' and column_name = 'sales_approved'
  ) then
    alter table public.tailors add column sales_approved boolean not null default false;
    -- Les ateliers existants : validés d'office (une seule fois, à la création).
    update public.tailors set sales_approved = true;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vendors' and column_name = 'sales_approved'
  ) then
    alter table public.vendors add column sales_approved boolean not null default false;
    update public.vendors set sales_approved = true;
  end if;
end $$;

alter table public.tailors add column if not exists sales_approved_at timestamptz;
alter table public.vendors add column if not exists sales_approved_at timestamptz;

-- 2. Colonne privilégiée : seul l'admin (ou la clé de service) la change -----
--
-- Reprend la liste de 20260804000001 et y ajoute `sales_approved(_at)`.

create or replace function public.guard_pro_privileged_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  protected constant text[] := array[
    'rating', 'rating_count',
    'is_certified', 'is_activated', 'is_suspended', 'suspension_reason',
    'plan', 'plan_expires_at',
    'is_founding_member', 'verified_photos',
    'completed_orders', 'accepted_orders', 'rejected_orders', 'on_time_orders',
    'sales_approved', 'sales_approved_at'
  ];
  before_row jsonb;
  after_row  jsonb;
  col text;
begin
  if pg_trigger_depth() > 1
     or current_user not in ('authenticated', 'anon')
     or public.is_admin()
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.rating := 0;
    new.rating_count := 0;
    new.is_certified := false;
    new.is_activated := false;
    new.is_suspended := false;
    new.suspension_reason := null;
    new.plan := 'free';
    new.plan_expires_at := null;
    new.is_founding_member := false;
    new.verified_photos := 0;
    new.completed_orders := 0;
    new.accepted_orders := 0;
    new.rejected_orders := 0;
    new.on_time_orders := 0;
    new.sales_approved := false;
    new.sales_approved_at := null;
    return new;
  end if;

  before_row := to_jsonb(old);
  after_row := to_jsonb(new);

  foreach col in array protected loop
    if before_row ? col
       and (after_row -> col) is distinct from (before_row -> col)
    then
      raise exception
        'La colonne « % » est attribuée par l''administration et ne peut pas être modifiée', col
        using errcode = '42501';
    end if;
  end loop;

  return new;
end;
$$;

-- 3. Aucune vente vers un pro non validé ------------------------------------
--
-- À la création d'une commande, et quand le tailleur ou le vendeur d'une
-- commande change (réassignation, autre tissu dans un devis révisé).

create or replace function public.guard_order_sellers_approved()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.tailor_id is not null
     and (tg_op = 'INSERT' or new.tailor_id is distinct from old.tailor_id)
     and exists (
       select 1 from public.tailors t
       where t.id = new.tailor_id and not t.sales_approved
     )
  then
    raise exception
      'Ce tailleur est en cours de validation par JALOFA : il ne peut pas encore recevoir de commande.'
      using errcode = 'P0001';
  end if;

  if new.vendor_id is not null
     and (tg_op = 'INSERT' or new.vendor_id is distinct from old.vendor_id)
     and exists (
       select 1 from public.vendors v
       where v.id = new.vendor_id and not v.sales_approved
     )
  then
    raise exception
      'Ce vendeur est en cours de validation par JALOFA : il ne peut pas encore vendre.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_sellers_approved on public.orders;
create trigger orders_guard_sellers_approved
  before insert or update of tailor_id, vendor_id on public.orders
  for each row execute function public.guard_order_sellers_approved();

commit;
