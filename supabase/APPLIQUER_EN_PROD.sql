-- ===========================================================================
-- JALOFA — à appliquer en production (éditeur SQL Supabase)
--
-- Projet : gttvmpizeukswwyrpwif
--
-- Ce fichier rassemble les trois migrations qui manquent à la base de
-- production, dans l'ordre où elles doivent passer. Tout est idempotent : le
-- script peut être rejoué sans dommage, et s'interrompt sans rien laisser à
-- moitié fait (une seule transaction).
--
--   1. 20260726000001 — refus motivé + prix par modèle.
--      Constatée ABSENTE en production le 2026-07-28 (`orders.rejection_reason`
--      et `models.price` n'existent pas), alors que le code s'en sert déjà :
--      le bouton « Refuser » de l'espace tailleur échoue, et le prix propre
--      d'une création est ignoré au profit du « dès… » de la boutique.
--
--   2. 20260802000001 — verrouillage des colonnes privilégiées.
--      Empêche un utilisateur connecté de se donner `role = 'admin'`, de se
--      certifier ou de s'inventer une note, directement en REST.
--
--   3. 20260803000001 — rôle à l'inscription + colonnes d'une commande.
--      Empêche de naître administrateur via l'API d'auth publique, et de
--      réécrire le montant ou l'avancement d'une commande.
--
-- Les points 2 et 3 ferment des élévations de privilège exploitables depuis un
-- navigateur avec la seule clé anon (publique) : à appliquer en priorité.
-- ===========================================================================

begin;

-- ===========================================================================
-- 1. Refus motivé d'une commande + prix par modèle   (20260726000001)
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rejection_reason') then
    create type public.rejection_reason as enum (
      'cannot_make',            -- ne sait pas / ne peut pas faire ce modèle
      'too_busy',               -- trop chargé en ce moment
      'cannot_deliver_in_time'  -- ne peut pas livrer dans les délais
    );
  end if;
end
$$;

alter table public.orders
  add column if not exists rejection_reason public.rejection_reason;

-- Null = pas de tarif propre : on retombe sur le `base_price` du tailleur.
alter table public.models
  add column if not exists price numeric(10, 2);

-- Notification de refus au client. `notifications` n'a aucune policy d'insert :
-- ces lignes ne sont créées QUE par ce trigger `security definer`.
create or replace function public.notify_client_order_rejected()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reason_label text;
begin
  -- On ne réagit qu'au passage effectif à « refusée ».
  if new.status <> 'rejected' or new.status is not distinct from old.status then
    return new;
  end if;

  reason_label := case new.rejection_reason
    when 'cannot_make' then 'Le tailleur ne peut pas réaliser ce modèle.'
    when 'too_busy' then 'Le tailleur est trop chargé en ce moment.'
    when 'cannot_deliver_in_time' then 'Le tailleur ne peut pas livrer dans les délais.'
    else 'Le tailleur ne peut pas honorer cette commande.'
  end;

  insert into public.notifications (user_id, type, title, body, link, order_id)
  values (
    new.client_id,
    'order_rejected',
    'Commande refusée',
    reason_label || ' Choisissez un autre tailleur pour la relancer.',
    '/compte/commandes/' || new.id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists orders_notify_client_rejected on public.orders;
create trigger orders_notify_client_rejected
  after update of status on public.orders
  for each row execute function public.notify_client_order_rejected();

-- ===========================================================================
-- 2. Verrouillage des colonnes privilégiées          (20260802000001)
-- ===========================================================================
--
-- Les policies « ligne à soi » (`profiles_update_own`, `tailors_update_own`,
-- `vendors_update_own`) autorisent la mise à jour de la ligne, mais Postgres n'y
-- attache aucune restriction de COLONNE. La clé anon étant publique côté
-- navigateur, tout utilisateur connecté pouvait écrire en REST sur sa propre
-- ligne : `profiles.role = 'admin'` (escalade complète), `tailors.rating = 5`,
-- `is_certified`, `is_activated`, `plan`, et les compteurs du score de confiance.
--
-- Trois échappatoires volontaires, dans cet ordre :
--   1. `pg_trigger_depth() > 1` — l'écriture vient d'un autre trigger (les
--      recalculs de note et de compteurs, seules sources légitimes) ;
--   2. `current_user` hors ('authenticated','anon') — clé de service ou éditeur
--      SQL, par où passent l'admin et les scripts de maintenance ;
--   3. `public.is_admin()` — un administrateur agissant depuis l'application.
--
-- Les fonctions sont volontairement SECURITY INVOKER : sous SECURITY DEFINER,
-- `current_user` vaudrait le propriétaire et le garde-fou ne se déclencherait
-- jamais.

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

-- Une seule fonction pour `tailors` et `vendors` : les colonnes portent les
-- mêmes noms des deux côtés. `to_jsonb` rend la comparaison indépendante de la
-- table, et `? col` ignore une colonne absente.
--
-- L'INSERT est gardé lui aussi : `vendors_insert_own` laisse un utilisateur
-- créer sa propre ligne vendeur. Sans garde-fou il pouvait la créer déjà
-- certifiée, déjà ouverte et notée 5/5. À la création on ne refuse donc pas : on
-- réécrit ces colonnes à leur valeur de départ.
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

-- ===========================================================================
-- 3. Rôle à l'inscription + colonnes d'une commande  (20260803000001)
-- ===========================================================================

-- 3.a  Le rôle ne s'auto-attribue pas à l'inscription -----------------------
--
-- `handle_new_user` lisait `raw_user_meta_data ->> 'role'` sans filtre. Ces
-- métadonnées sont fournies par l'appelant, et l'endpoint d'inscription de
-- Supabase Auth est public — la server action `signUp` n'est pas un passage
-- obligé. Un simple appel suffisait à naître administrateur :
--
--   POST https://<ref>.supabase.co/auth/v1/signup
--   apikey: <clé anon, lisible dans le bundle du navigateur>
--   { "email": "...", "password": "...", "data": { "role": "admin" } }
--
-- La base ne fait donc plus confiance aux métadonnées : liste blanche explicite.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed text;
  new_role public.user_role;
begin
  claimed := new.raw_user_meta_data ->> 'role';

  -- On ne convertit PAS d'abord vers `user_role` : l'enum contient 'admin', le
  -- cast le laisserait passer. C'est la comparaison textuelle qui fait le tri.
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

  if new_role = 'tailor' then
    insert into public.tailors (id, shop_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  elsif new_role = 'vendor' then
    insert into public.vendors (id, shop_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  end if;

  return new;
end;
$$;

-- 3.b  Les colonnes d'une commande ------------------------------------------
--
-- `orders_update_party` autorise « le client OU le tailleur OU le vendeur » à
-- mettre à jour la ligne — sans `with check` et sans restriction de COLONNE.
-- Chaque partie pouvait donc réécrire n'importe quel champ en REST :
--   • `total_amount = 0` — le client efface la somme due ;
--   • `status = 'delivered'` — le client déclare livrée une commande qui ne
--     l'est pas, et les triggers du score de confiance incrémentent alors
--     `completed_orders` / `on_time_orders` du tailleur : note fabriquée, qui
--     ouvre en plus le droit de déposer un avis ;
--   • `tailor_id`, `client_id`, `order_number` — la commande change de mains.
--
-- Restent volontairement permis, parce que le produit en dépend : le tailleur
-- assigné chiffre un devis, le client l'accepte et le règle (paiement
-- déclaratif, réglé hors plateforme par Wave / Orange Money — seule une
-- passerelle pourrait y remédier), et le client réoriente une commande REFUSÉE.

create or replace function public.guard_order_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  caller    uuid := (select auth.uid());
  is_client boolean;
  is_tailor boolean;
  is_vendor boolean;
  reassigning boolean;  -- le client relance une commande refusée
  quoting     boolean;  -- le tailleur assigné chiffre un devis impayé
begin
  if pg_trigger_depth() > 1
     or current_user not in ('authenticated', 'anon')
     or public.is_admin()
  then
    return new;
  end if;

  is_client := old.client_id is not distinct from caller;
  is_tailor := old.tailor_id is not distinct from caller;
  is_vendor := old.vendor_id is not distinct from caller;

  -- La RLS a déjà écarté les tiers ; ceinture et bretelles.
  if not (is_client or is_tailor or is_vendor) then
    raise exception 'Cette commande ne vous appartient pas'
      using errcode = '42501';
  end if;

  reassigning := is_client and old.status = 'rejected';
  quoting := is_tailor
             and coalesce(old.is_quote, false)
             and old.status = 'received'
             and old.payment_status = 'pending';

  -- Identité de la commande — immuable pour tout le monde.
  if new.id is distinct from old.id
     or new.order_number is distinct from old.order_number
     or new.client_id is distinct from old.client_id
     or new.type is distinct from old.type
     or new.model_id is distinct from old.model_id
     or new.fabric_id is distinct from old.fabric_id
     or new.fabric_meters is distinct from old.fabric_meters
     or new.measurement_id is distinct from old.measurement_id
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Les éléments d''une commande ne peuvent plus être modifiés'
      using errcode = '42501';
  end if;

  -- Prestataires assignés : seul le client, et seulement après un refus.
  if (new.tailor_id is distinct from old.tailor_id
      or new.vendor_id is distinct from old.vendor_id)
     and not reassigning
  then
    raise exception
      'Le prestataire d''une commande ne peut être changé qu''après un refus'
      using errcode = '42501';
  end if;

  -- L'argent : tissu et livraison sont arrêtés à la commande.
  if new.fabric_price is distinct from old.fabric_price
     or new.delivery_fee is distinct from old.delivery_fee
  then
    raise exception 'Le montant d''une commande ne peut pas être modifié'
      using errcode = '42501';
  end if;

  -- Confection et total : seulement pour chiffrer un devis ou réorienter.
  if (new.tailoring_price is distinct from old.tailoring_price
      or new.total_amount is distinct from old.total_amount)
     and not (quoting or reassigning)
  then
    raise exception 'Le montant d''une commande ne peut pas être modifié'
      using errcode = '42501';
  end if;

  -- Paiement : geste du client, et dans un seul sens. Une commande payée ne
  -- redevient pas « en attente », et seule l'administration rembourse.
  if new.payment_status is distinct from old.payment_status then
    if not is_client or old.payment_status <> 'pending' or new.payment_status <> 'paid' then
      raise exception 'Le statut de paiement ne peut pas être modifié ainsi'
        using errcode = '42501';
    end if;
  end if;
  if new.payment_method is distinct from old.payment_method and not is_client then
    raise exception 'Le moyen de paiement est choisi par le client'
      using errcode = '42501';
  end if;

  -- Avancement : le pipeline de production appartient aux prestataires — c'est
  -- leur travail qu'il décrit, et de lui que dépend le score de confiance. Le
  -- client n'a que deux gestes : annuler, ou relancer après un refus (plus
  -- l'acceptation d'un devis, qui fait passer la commande à « acceptée »).
  if new.status is distinct from old.status then
    if is_client and not (is_tailor or is_vendor) then
      if not (new.status = 'cancelled'
              or (reassigning and new.status = 'received')
              or (new.status = 'accepted'
                  and old.status = 'received'
                  and coalesce(old.is_quote, false)))
      then
        raise exception
          'L''avancement d''une commande est renseigné par le prestataire'
          using errcode = '42501';
      end if;
    end if;

    -- Une commande terminée est terminée : plus personne n'y revient.
    if old.status in ('delivered', 'cancelled') then
      raise exception 'Cette commande est clôturée'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_columns on public.orders;
create trigger orders_guard_columns
  before update on public.orders
  for each row execute function public.guard_order_columns();

commit;

-- ===========================================================================
-- Vérification, une fois le script passé
-- ===========================================================================
--
-- a) Les colonnes qui manquaient existent :
--
--   select column_name from information_schema.columns
--   where table_name = 'orders' and column_name = 'rejection_reason';
--   select column_name from information_schema.columns
--   where table_name = 'models' and column_name = 'price';
--   -- attendu : une ligne chacune
--
-- b) Les quatre garde-fous sont posés :
--
--   select tgname from pg_trigger where tgname in (
--     'profiles_guard_role', 'tailors_guard_privileged',
--     'vendors_guard_privileged', 'orders_guard_columns');
--   -- attendu : 4 lignes
--
-- c) Les garde-fous mordent. Depuis l'éditeur, `current_user` vaut `postgres` et
--    les triggers laissent passer — c'est voulu. Il faut endosser un utilisateur
--    connecté :
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<uid-d-un-client>","role":"authenticated"}';
--   update public.profiles set role = 'admin' where id = '<uid-d-un-client>';
--   -- attendu : ERROR ... Le rôle d'un compte ne peut être changé que par
--   --           l'administration
--   reset role;
--
-- d) Le rôle à l'inscription : créer un compte via l'API d'auth en passant
--    `"data": {"role":"admin"}`, puis
--
--   select role from public.profiles where id = '<uid-du-compte-de-test>';
--   -- attendu : client        (et non admin)
--
-- e) Ce qui doit continuer de fonctionner, à vérifier dans l'application :
--    inscription client / tailleur / vendeur ; édition de la vitrine d'un pro ;
--    commande de bout en bout ; le tailleur chiffre un devis, le client
--    l'accepte et paie ; le pro fait avancer la commande jusqu'à livrée ; le
--    tailleur refuse une commande (motif enregistré + notification au client) ;
--    le client relance chez un autre atelier ; dépôt d'un avis après livraison.
-- ===========================================================================
