-- ---------------------------------------------------------------------------
-- Deux verrous manquants : le rôle à l'inscription, et les colonnes d'une
-- commande.
--
-- La migration précédente (20260802000001) ferme la modification du rôle et des
-- colonnes de confiance. Elle laissait pourtant deux portes ouvertes, toutes
-- deux exploitables depuis un navigateur avec la seule clé anon (publique).
-- ---------------------------------------------------------------------------

begin;

-- ===========================================================================
-- 1. Le rôle ne s'auto-attribue pas à l'inscription
-- ===========================================================================
--
-- `handle_new_user` lisait `raw_user_meta_data ->> 'role'` sans aucun filtre.
-- Or ces métadonnées sont fournies par l'appelant, et l'endpoint d'inscription
-- de Supabase Auth est public — la server action `signUp` n'est pas un passage
-- obligé. Un simple appel suffisait à naître administrateur :
--
--   POST https://<ref>.supabase.co/auth/v1/signup
--   apikey: <clé anon, lisible dans le bundle du navigateur>
--   { "email": "...", "password": "...", "data": { "role": "admin" } }
--
-- Le compte obtenait alors `profiles.role = 'admin'`, c'est-à-dire l'espace
-- d'administration en entier : toutes les commandes et tous les profils (lus
-- avec la clé de service), la suppression d'avis, l'activation des pros.
-- L'assainissement fait dans `signUp` ne protégeait que le chemin applicatif.
--
-- La parade : la base ne fait plus confiance aux métadonnées. Seuls les trois
-- rôles d'inscription publique sont retenus ; toute autre valeur — 'admin' au
-- premier chef, mais aussi une valeur inconnue — retombe sur 'client'.
-- Un administrateur se nomme désormais depuis l'éditeur SQL ou avec la clé de
-- service, jamais en s'inscrivant.

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

  -- Liste blanche explicite. On ne convertit PAS d'abord vers `user_role` :
  -- l'enum contient 'admin', le cast le laisserait donc passer. C'est bien la
  -- comparaison textuelle qui fait le tri, avant toute conversion.
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

-- ===========================================================================
-- 2. Les colonnes d'une commande
-- ===========================================================================
--
-- `orders_update_party` autorise « le client OU le tailleur OU le vendeur » à
-- mettre à jour la ligne — sans `with check` et, comme toujours en Postgres,
-- sans restriction de COLONNE. Chaque partie pouvait donc réécrire n'importe
-- quel champ de la commande, directement en REST :
--
--   • `total_amount = 0`, `tailoring_price = 0` — le client efface la somme due,
--     ce qui corrompt les revenus du pro et les reversements JALOFA ;
--   • `status = 'delivered'` — le client déclare livrée une commande qui ne l'est
--     pas ; les triggers du score de confiance incrémentent alors
--     `completed_orders` / `on_time_orders` du tailleur : note fabriquée ;
--   • `tailor_id`, `client_id`, `order_number` — la commande change de mains.
--
-- La parade suit le même dessin que 20260802000001 : un trigger `before update`,
-- avec les trois mêmes échappatoires (trigger imbriqué, clé de service, admin).
--
-- Ce qui reste volontairement permis, parce que le produit en dépend :
--   • le tailleur assigné chiffre un devis (`quoteOrder`) ;
--   • le client accepte et règle ce devis (`acceptQuote`) — le paiement est
--     déclaratif, réglé hors plateforme par Wave / Orange Money : ce n'est pas ce
--     trigger qui peut y remédier, seule une passerelle le pourrait ;
--   • le client réoriente une commande REFUSÉE vers un autre atelier
--     (`reassignTailor`), ce qui recalcule le prix de confection.

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
  -- Le client réoriente une commande refusée : la seule fenêtre où il lui est
  -- permis de changer d'atelier et de voir le prix de confection recalculé.
  reassigning boolean;
  -- Le tailleur assigné chiffre un devis encore impayé.
  quoting boolean;
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

  -- La RLS a déjà écarté les tiers ; ceinture et bretelles, au cas où une
  -- policy plus large serait ajoutée un jour.
  if not (is_client or is_tailor or is_vendor) then
    raise exception 'Cette commande ne vous appartient pas'
      using errcode = '42501';
  end if;

  reassigning := is_client and old.status = 'rejected';
  quoting := is_tailor
             and coalesce(old.is_quote, false)
             and old.status = 'received'
             and old.payment_status = 'pending';

  -- 2.a  Identité de la commande — immuable pour tout le monde ---------------
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

  -- 2.b  Prestataires assignés ----------------------------------------------
  -- Seul le client, et seulement sur une commande refusée, change d'atelier.
  if (new.tailor_id is distinct from old.tailor_id
      or new.vendor_id is distinct from old.vendor_id)
     and not reassigning
  then
    raise exception
      'Le prestataire d''une commande ne peut être changé qu''après un refus'
      using errcode = '42501';
  end if;

  -- 2.c  L'argent ------------------------------------------------------------
  -- Le prix du tissu et les frais de livraison sont arrêtés à la commande.
  if new.fabric_price is distinct from old.fabric_price
     or new.delivery_fee is distinct from old.delivery_fee
  then
    raise exception 'Le montant d''une commande ne peut pas être modifié'
      using errcode = '42501';
  end if;

  -- Le prix de confection et le total ne bougent que pour chiffrer un devis
  -- (tailleur) ou pour réorienter une commande refusée (client).
  if (new.tailoring_price is distinct from old.tailoring_price
      or new.total_amount is distinct from old.total_amount)
     and not (quoting or reassigning)
  then
    raise exception 'Le montant d''une commande ne peut pas être modifié'
      using errcode = '42501';
  end if;

  -- 2.d  Paiement ------------------------------------------------------------
  -- Le règlement est le geste du client, et il ne va que dans un sens : une
  -- commande payée ne redevient pas « en attente », et seule l'administration
  -- prononce un remboursement.
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

  -- 2.e  Avancement ----------------------------------------------------------
  -- Le pipeline de production appartient aux prestataires : c'est leur travail
  -- qu'il décrit, et c'est de lui que dépend le score de confiance. Le client
  -- n'a que deux gestes — annuler, ou relancer ailleurs après un refus.
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

-- ---------------------------------------------------------------------------
-- Vérification (facultatif, à jouer dans l'éditeur SQL)
--
-- Rappel : depuis l'éditeur, `current_user` vaut `postgres` et les triggers
-- laissent passer — c'est voulu. Il faut endosser un utilisateur connecté :
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<uid-du-client>","role":"authenticated"}';
--   update public.orders set total_amount = 0 where id = '<commande-du-client>';
--   -- attendu : ERROR ... Le montant d'une commande ne peut pas être modifié
--   update public.orders set status = 'delivered' where id = '<commande-du-client>';
--   -- attendu : ERROR ... L'avancement d'une commande est renseigné par le
--   --           prestataire
--   reset role;
--
-- Et pour le rôle à l'inscription, une fois la fonction remplacée : créer un
-- compte via l'API d'auth en passant `"data": {"role":"admin"}`, puis
--
--   select role from public.profiles where id = '<uid-du-compte-de-test>';
--   -- attendu : client
--
-- Ce qui doit continuer de fonctionner : le tailleur chiffre un devis, le
-- client l'accepte et paie, le pro fait avancer la commande jusqu'à livrée, et
-- le client relance une commande refusée chez un autre atelier.
-- ---------------------------------------------------------------------------
