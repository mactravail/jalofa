-- =============================================================================
-- JALOFA — Activation des pros par l'administration
--
-- Les paiements d'abonnement passent (pour l'instant) par Wave, hors plateforme :
-- un pro qui s'inscrit n'obtient donc PAS son espace tout de suite. Il reste « en
-- attente » jusqu'à ce que l'administration confirme le règlement et active son
-- espace à la main (cf. `/admin/abonnements`).
--
--   • `is_activated = false` (défaut) : compte créé mais espace verrouillé — le pro
--     voit un écran d'attente au lieu de son tableau de bord.
--   • `is_activated = true` : l'administration a confirmé le paiement Wave (ou
--     validé l'inscription) ; l'espace est ouvert.
--
-- Distinct de `is_active` (le pro ouvre/ferme sa boutique lui-même) et de
-- `is_suspended` (blocage imposé par la plateforme). Idempotent (rejouable).
-- =============================================================================

alter table public.tailors
  add column if not exists is_activated boolean not null default false;
alter table public.vendors
  add column if not exists is_activated boolean not null default false;

-- Les pros déjà inscrits avant cette règle ne doivent pas se retrouver enfermés
-- dehors : on les considère déjà validés. Les nouveaux comptes partent, eux, de
-- `false` (le défaut de la colonne) et attendent l'administration.
update public.tailors set is_activated = true where is_activated = false;
update public.vendors set is_activated = true where is_activated = false;

-- ---------------------------------------------------------------------------
-- Nouveau compte -> profil (+ boutique(s) selon l'abonnement)
--
-- Ce qui change par rapport à la version d'origine :
--   • le plan choisi à l'inscription (métadonnées d'auth) est désormais ENREGISTRÉ
--     sur la boutique — c'est lui qui décide de la commission (cf. `planCommission`) ;
--   • **Standard** (un métier) ne crée que la boutique du métier choisi ;
--   • **Premium** et **Gratuit** (les deux métiers) créent les DEUX boutiques, pour
--     que le sélecteur d'espace fonctionne dès l'activation ;
--   • chaque boutique naît `is_activated = false` : l'administration l'ouvre ensuite.
-- ---------------------------------------------------------------------------
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

  -- Un compte pro ouvre une boutique dans son métier ; Premium et Gratuit
  -- couvrent les deux, donc on ouvre aussi l'autre. Les clients/admins : aucune.
  if new_role in ('tailor', 'vendor') then
    make_tailor := new_role = 'tailor' or new_plan in ('premium', 'free');
    make_vendor := new_role = 'vendor' or new_plan in ('premium', 'free');

    if make_tailor then
      insert into public.tailors (id, shop_name, plan)
      values (new.id, shop, new_plan)
      on conflict (id) do nothing;
    end if;
    if make_vendor then
      insert into public.vendors (id, shop_name, plan)
      values (new.id, shop, new_plan)
      on conflict (id) do nothing;
    end if;
  end if;

  return new;
end;
$$;
