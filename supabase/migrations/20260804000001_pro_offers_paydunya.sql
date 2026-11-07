-- ---------------------------------------------------------------------------
-- Deux comptes à l'inscription : Client (gratuit) et Pro.
--
-- Un compte Pro ouvre les DEUX métiers d'un coup — atelier (tailleur) et
-- boutique de tissus (vendeur). Deux offres :
--   • Gratuit : aucun abonnement, commission sur chaque vente ;
--   • Pro     : abonnement mensuel (plan `premium`), 0 % de commission, payé
--               en mobile money via PayDunya.
--
-- Le compte naît TOUJOURS sur l'offre Gratuit. Le passage à Pro n'est accordé
-- que par le serveur (clé de service) une fois le paiement PayDunya confirmé :
-- `plan` et `plan_expires_at` sont des colonnes privilégiées.
--
-- Idempotent : peut être rejoué.
-- ---------------------------------------------------------------------------

begin;

-- 1. Échéance de l'abonnement ------------------------------------------------

alter table public.tailors add column if not exists plan_expires_at timestamptz;
alter table public.vendors add column if not exists plan_expires_at timestamptz;

-- 2. Inscription : rôle en liste blanche + les deux boutiques, ouvertes -------
--
-- Reprend la liste blanche de 20260803000001 (on ne naît jamais admin) et la
-- double boutique de 20260801000001 : tout pro (rôle tailor OU vendor) reçoit
-- son atelier ET sa boutique de tissus, activés, sur l'offre Gratuit.

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
  new_role := case
    when claimed in ('client', 'tailor', 'vendor') then claimed::public.user_role
    else 'client'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    new_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );

  if new_role in ('tailor', 'vendor') then
    shop := new.raw_user_meta_data ->> 'full_name';
    insert into public.tailors (id, shop_name, plan, is_activated)
    values (new.id, shop, 'free', true)
    on conflict (id) do nothing;
    insert into public.vendors (id, shop_name, plan, is_activated)
    values (new.id, shop, 'free', true)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- 3. `plan_expires_at` rejoint les colonnes privilégiées ---------------------

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
    'completed_orders', 'accepted_orders', 'rejected_orders', 'on_time_orders'
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

-- 4. Paiements d'abonnement (PayDunya) ---------------------------------------
--
-- Une ligne par facture PayDunya. Écrite uniquement par le serveur (clé de
-- service) : aucune policy d'écriture. Le pro lit les siennes.

create table if not exists public.subscription_payments (
  id          uuid primary key default gen_random_uuid(),
  pro_id      uuid not null references public.profiles (id) on delete cascade,
  plan        public.subscription_plan not null default 'premium',
  months      integer not null default 1 check (months between 1 and 12),
  amount      integer not null check (amount > 0),
  provider    text not null default 'paydunya',
  token       text unique,
  status      text not null default 'pending'
              check (status in ('pending', 'completed', 'cancelled', 'failed')),
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create index if not exists subscription_payments_pro_idx
  on public.subscription_payments (pro_id, created_at desc);

alter table public.subscription_payments enable row level security;

drop policy if exists subscription_payments_select_own on public.subscription_payments;
create policy subscription_payments_select_own on public.subscription_payments
  for select using (pro_id = (select auth.uid()) or public.is_admin());

commit;
