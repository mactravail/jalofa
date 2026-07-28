-- ---------------------------------------------------------------------------
-- Verrouillage des colonnes privilégiées
--
-- Le problème : les policies « ligne à soi » (`profiles_update_own`,
-- `tailors_update_own`, `vendors_update_own`) autorisent la mise à jour de la
-- ligne, mais Postgres n'y attache aucune restriction de COLONNE. La clé anon
-- étant publique côté navigateur, tout utilisateur connecté pouvait écrire
-- directement en REST sur sa propre ligne :
--
--   • `profiles.role = 'admin'` — les gardes de /admin lisent exactement cette
--     colonne : escalade de privilèges complète ;
--   • `tailors.rating = 5.0`, `rating_count = 300` — note inventée ;
--   • `is_certified`, `is_activated`, `is_suspended`, `plan` — badge de
--     confiance, ouverture de boutique et forfait attribués par l'administration ;
--   • les compteurs du score de confiance (`completed_orders`, `on_time_orders`…),
--     tenus par des triggers.
--
-- La parade : un trigger `before update` par table, qui refuse la modification
-- de ces colonnes quand elle vient d'un utilisateur final. Trois échappatoires
-- volontaires, dans cet ordre :
--
--   1. `pg_trigger_depth() > 1` — l'écriture vient d'un autre trigger
--      (`refresh_tailor_rating`, `refresh_pro_order_stats`…). Ces fonctions
--      recalculent les notes et les compteurs : ce sont les seules sources
--      légitimes de ces colonnes.
--   2. `current_user` hors ('authenticated', 'anon') — clé de service ou
--      éditeur SQL. C'est par là que passent /admin/abonnements (activation,
--      forfait) et les scripts de maintenance.
--   3. `public.is_admin()` — un administrateur agissant depuis l'application
--      avec la clé anon : suspension et certification (`setProSuspension`,
--      `setProCertification`) écrivent ainsi.
--
-- Les fonctions sont volontairement SECURITY INVOKER : sous SECURITY DEFINER,
-- `current_user` vaudrait le propriétaire de la fonction et le garde-fou ne se
-- déclencherait jamais. Elles n'ont besoin d'aucun privilège propre —
-- `public.is_admin()` est déjà SECURITY DEFINER de son côté.
-- ---------------------------------------------------------------------------

-- Tout ou rien : si une seule instruction échoue, rien n'est posé.
begin;

-- 0. Dépendance ------------------------------------------------------------
--
-- Les deux garde-fous appellent `public.is_admin()` (créée en 20260718000002).
-- Recréée ici à l'identique : si elle manquait, l'erreur n'apparaîtrait qu'à
-- l'exécution — c'est-à-dire au premier enregistrement d'un profil, en
-- production. On préfère la certitude.

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

-- 1. Le rôle d'un compte ----------------------------------------------------

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     and pg_trigger_depth() <= 1
     and current_user in ('authenticated', 'anon')
     and not public.is_admin()
  then
    raise exception
      'Le rôle d''un compte ne peut être changé que par l''administration'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 2. Les colonnes de confiance d'un prestataire -----------------------------
--
-- Une seule fonction pour `tailors` et `vendors` : les colonnes portent les
-- mêmes noms des deux côtés. La comparaison passe par `to_jsonb` pour rester
-- indépendante de la table, et `? col` ignore une colonne absente — le contrôle
-- survit donc au retrait d'une colonne sur l'une des deux tables.
--
-- L'INSERT est gardé lui aussi : `vendors_insert_own` autorise un utilisateur
-- connecté à créer sa propre ligne vendeur (c'est ainsi qu'un tailleur qui vend
-- du tissu obtient sa boutique, cf. `saveFabric`). Sans garde-fou, il pouvait la
-- créer déjà certifiée, déjà ouverte et notée 5/5. À la création, on ne refuse
-- donc pas : on réécrit ces colonnes à leur valeur de départ — une boutique naît
-- vierge, et c'est l'administration ou les triggers qui la remplissent ensuite.

create or replace function public.guard_pro_privileged_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  protected constant text[] := array[
    'rating', 'rating_count',
    'is_certified', 'is_activated', 'is_suspended', 'suspension_reason',
    'plan',
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

  -- Naissance : on remet chaque colonne privilégiée à sa valeur de départ,
  -- exactement les `default` du schéma. Les deux tables portent les mêmes
  -- colonnes — si l'une venait à en perdre une, l'erreur serait immédiate et
  -- bruyante, ce qui vaut mieux qu'un garde-fou silencieusement contourné.
  if tg_op = 'INSERT' then
    new.rating := 0;
    new.rating_count := 0;
    new.is_certified := false;
    new.is_activated := false;
    new.is_suspended := false;
    new.suspension_reason := null;
    new.plan := 'free';
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

drop trigger if exists tailors_guard_privileged on public.tailors;
create trigger tailors_guard_privileged
  before insert or update on public.tailors
  for each row execute function public.guard_pro_privileged_columns();

drop trigger if exists vendors_guard_privileged on public.vendors;
create trigger vendors_guard_privileged
  before insert or update on public.vendors
  for each row execute function public.guard_pro_privileged_columns();

commit;

-- ---------------------------------------------------------------------------
-- Vérification (facultatif, à jouer dans l'éditeur SQL)
--
-- Depuis l'éditeur SQL, `current_user` vaut `postgres` : les triggers laissent
-- donc passer, c'est normal et voulu. Pour éprouver le garde-fou, il faut se
-- placer dans la peau d'un utilisateur connecté :
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<uid-d-un-client>","role":"authenticated"}';
--   update public.profiles set role = 'admin' where id = '<uid-d-un-client>';
--   -- attendu : ERROR ... Le rôle d'un compte ne peut être changé que par
--   --           l'administration
--   reset role;
--
-- Même chose pour une boutique :
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<uid-d-un-tailleur>","role":"authenticated"}';
--   update public.tailors set is_certified = true where id = '<uid-d-un-tailleur>';
--   -- attendu : ERROR ... La colonne « is_certified » est attribuée par
--   --           l'administration
--   reset role;
--
-- Et pour confirmer qu'on n'a rien cassé : la mise à jour d'un profil normal
-- (nom, téléphone), l'enregistrement de la vitrine d'un pro (nom de boutique,
-- prix, livraison offerte) et le dépôt d'un avis (qui recalcule `rating` via un
-- trigger) doivent continuer de fonctionner.
-- ---------------------------------------------------------------------------
