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
