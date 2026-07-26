-- =============================================================================
-- JALOFA — Plateforme gratuite + score de confiance
--
-- Changement de cap : JALOFA est GRATUIT pour les pros (aucun abonnement, aucune
-- commission, aucun frais). Un tailleur ou un vendeur crée son compte et vend
-- aussitôt. Cette migration :
--
--   1. Active automatiquement les espaces pros à l'inscription (plus de
--      validation manuelle par l'administration, ni de paiement Wave).
--   2. Ajoute le MOYEN DE PAIEMENT du pro (où sont versées ses ventes).
--   3. Ajoute les signaux du SCORE DE CONFIANCE (avis, commandes, délais,
--      acceptation, photos vérifiées) + les distinctions « Membre Fondateur »
--      et « Vérifié ».
--
-- La mécanique des abonnements/commissions reste en base (colonne `plan`,
-- reversements) mais n'est plus branchée à l'UI — réactivable plus tard.
-- Idempotent (rejouable sans dommage).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Activation automatique des pros
-- ---------------------------------------------------------------------------

-- Les pros déjà en attente ne doivent plus rester enfermés dehors : on ouvre
-- tous les espaces.
update public.tailors set is_activated = true where is_activated = false;
update public.vendors set is_activated = true where is_activated = false;

-- Nouveau compte -> profil (+ boutique(s)). Comme avant, l'offre gratuite ouvre
-- les DEUX métiers ; la nouveauté : chaque boutique naît DÉJÀ ACTIVÉE.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role public.user_role;
  new_plan public.subscription_plan;
  shop text;
  make_tailor boolean;
  make_vendor boolean;
begin
  new_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'client');
  new_plan := coalesce((new.raw_user_meta_data ->> 'plan')::public.subscription_plan, 'free');
  shop := new.raw_user_meta_data ->> 'full_name';

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    new_role,
    shop,
    new.raw_user_meta_data ->> 'phone'
  );

  if new_role in ('tailor', 'vendor') then
    make_tailor := new_role = 'tailor' or new_plan in ('premium', 'free');
    make_vendor := new_role = 'vendor' or new_plan in ('premium', 'free');

    if make_tailor then
      insert into public.tailors (id, shop_name, plan, is_activated)
      values (new.id, shop, new_plan, true)
      on conflict (id) do nothing;
    end if;
    if make_vendor then
      insert into public.vendors (id, shop_name, plan, is_activated)
      values (new.id, shop, new_plan, true)
      on conflict (id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Moyen de paiement du pro (où il est réglé de ses ventes)
--
-- `payout_method` : 'orange_money' | 'wave' | 'free_money' | 'bank'
-- `payout_number` : numéro Mobile Money, ou RIB / IBAN pour un virement
-- `payout_name`   : nom du titulaire du compte
-- ---------------------------------------------------------------------------
alter table public.tailors
  add column if not exists payout_method text,
  add column if not exists payout_number text,
  add column if not exists payout_name text;

alter table public.vendors
  add column if not exists payout_method text,
  add column if not exists payout_number text,
  add column if not exists payout_name text;

-- ---------------------------------------------------------------------------
-- 3. Signaux du score de confiance
--
-- Dénormalisés sur la fiche du pro pour un affichage public bon marché et
-- compatible RLS (on ne lit jamais les commandes d'autrui côté client). Les
-- compteurs de commandes sont tenus à jour par le trigger plus bas.
-- ---------------------------------------------------------------------------
alter table public.tailors
  add column if not exists is_founding_member boolean not null default false,
  add column if not exists verified_photos int not null default 0,
  add column if not exists completed_orders int not null default 0,
  add column if not exists accepted_orders int not null default 0,
  add column if not exists rejected_orders int not null default 0,
  add column if not exists on_time_orders int not null default 0;

alter table public.vendors
  add column if not exists is_founding_member boolean not null default false,
  add column if not exists verified_photos int not null default 0,
  add column if not exists completed_orders int not null default 0,
  add column if not exists accepted_orders int not null default 0,
  add column if not exists rejected_orders int not null default 0,
  add column if not exists on_time_orders int not null default 0;

-- Les pionniers : tout pro inscrit pendant l'année de lancement reçoit le badge
-- « Membre Fondateur ». Cutoff fixe -> rejouable sans re-marquer les futurs pros.
update public.tailors t set is_founding_member = true
  from public.profiles p
  where p.id = t.id and p.created_at < '2027-01-01';
update public.vendors v set is_founding_member = true
  from public.profiles p
  where p.id = v.id and p.created_at < '2027-01-01';

-- Compteurs de commandes tenus à jour à chaque changement d'état d'une commande.
-- « À l'heure » = livrée dans le délai annoncé par le tailleur (proxy sur les
-- dates de la commande). Les vendeurs ne cousent pas : leur `on_time_orders`
-- reste à 0 (le critère « délais » ne pèse alors pas dans leur score).
create or replace function public.refresh_pro_order_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_id uuid := coalesce(new.tailor_id, old.tailor_id);
  v_id uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  if t_id is not null then
    update public.tailors x set
      completed_orders = (
        select count(*) from public.orders o
        where o.tailor_id = t_id and o.status = 'delivered'
      ),
      rejected_orders = (
        select count(*) from public.orders o
        where o.tailor_id = t_id and o.status = 'rejected'
      ),
      accepted_orders = (
        select count(*) from public.orders o
        where o.tailor_id = t_id
          and o.status not in ('received', 'rejected', 'cancelled')
      ),
      on_time_orders = (
        select count(*) from public.orders o
        where o.tailor_id = t_id and o.status = 'delivered'
          and (o.updated_at::date - o.created_at::date) <= x.avg_delivery_days
      )
    where x.id = t_id;
  end if;

  if v_id is not null then
    update public.vendors x set
      completed_orders = (
        select count(*) from public.orders o
        where o.vendor_id = v_id and o.status = 'delivered'
      ),
      rejected_orders = (
        select count(*) from public.orders o
        where o.vendor_id = v_id and o.status = 'rejected'
      ),
      accepted_orders = (
        select count(*) from public.orders o
        where o.vendor_id = v_id
          and o.status not in ('received', 'rejected', 'cancelled')
      )
    where x.id = v_id;
  end if;

  return null;
end;
$$;

drop trigger if exists orders_refresh_pro_stats on public.orders;
create trigger orders_refresh_pro_stats
  after insert or update or delete on public.orders
  for each row execute function public.refresh_pro_order_stats();

-- Amorçage des compteurs sur l'historique déjà en base.
update public.tailors x set
  completed_orders = (
    select count(*) from public.orders o
    where o.tailor_id = x.id and o.status = 'delivered'
  ),
  rejected_orders = (
    select count(*) from public.orders o
    where o.tailor_id = x.id and o.status = 'rejected'
  ),
  accepted_orders = (
    select count(*) from public.orders o
    where o.tailor_id = x.id
      and o.status not in ('received', 'rejected', 'cancelled')
  ),
  on_time_orders = (
    select count(*) from public.orders o
    where o.tailor_id = x.id and o.status = 'delivered'
      and (o.updated_at::date - o.created_at::date) <= x.avg_delivery_days
  );

update public.vendors x set
  completed_orders = (
    select count(*) from public.orders o
    where o.vendor_id = x.id and o.status = 'delivered'
  ),
  rejected_orders = (
    select count(*) from public.orders o
    where o.vendor_id = x.id and o.status = 'rejected'
  ),
  accepted_orders = (
    select count(*) from public.orders o
    where o.vendor_id = x.id
      and o.status not in ('received', 'rejected', 'cancelled')
  );
