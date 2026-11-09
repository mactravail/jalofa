-- ---------------------------------------------------------------------------
-- Ce que le pro reçoit du client, et quand. JALOFA ne vend rien et ne livre rien :
-- c'est le pro qui livre, mais il ne doit pas pouvoir joindre le client avant son
-- paiement, sinon la commande sort de la plateforme.
--
--   Pendant le devis : le récapitulatif, le CODE (`orders.order_number`) et
--     l'adresse de livraison. Le nom, le téléphone et l'e-mail : JALOFA seul.
--   Une fois payé : aussi le nom, le téléphone et l'e-mail, pour celui qui livre.
--
-- Cacher les colonnes à l'écran ne suffit pas : `orders_select_party` donne au pro
-- toute la ligne en REST, et d'autres policies le profil et l'adresse du client.
-- La RLS ne filtre pas par colonne, donc :
--
--   1. nom, téléphone et e-mail vivent dans `order_contacts`, que le pro ne lit
--      qu'une fois la commande payée ; `orders.contact_*` restent vides ;
--   2. l'adresse de livraison est copiée sur la commande (`delivery_address`,
--      `delivery_country`) : `addresses` porte aussi le nom et le téléphone, le pro
--      ne la lit plus, ni le profil du client ;
--   3. la livraison gratuite se décide par produit (`delivery_zone` sur `models` et
--      `fabrics`), pour chaque tissu et chaque modèle ;
--   4. le parcours du devis prévient chacun : demande, nouveau devis, prix, paiement.
--
-- À APPLIQUER AVANT LE DÉPLOIEMENT, et APRÈS les migrations 20260805 à 20260809
-- encore en attente : le code écrit dans ces colonnes et dans `order_contacts`.
--
-- Idempotent : peut être rejoué dans le SQL Editor, y compris par-dessus sa version
-- précédente (dont il retire le verrou « seul JALOFA déclare livré »).
-- ---------------------------------------------------------------------------
begin;

-- 1. Les coordonnées privées d'une commande -----------------------------------
create table if not exists public.order_contacts (
  order_id   uuid primary key references public.orders(id) on delete cascade,
  first_name text,
  last_name  text,
  email      text,
  phone      text,
  created_at timestamptz not null default now()
);

alter table public.order_contacts enable row level security;

-- Le client les lit toujours. Le pro seulement si la commande est payée, et s'il
-- livre le client : sur une commande complète, le vendeur envoie à l'atelier. Une
-- commande annulée, refusée ou remboursée ne lui donne rien. Même règle que
-- `contactRevealed`. L'admin passe par le client de service.
drop policy if exists order_contacts_select_client on public.order_contacts;
drop policy if exists order_contacts_select_party on public.order_contacts;
create policy order_contacts_select_party on public.order_contacts
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.order_contacts.order_id
        and (
          o.client_id = (select auth.uid())
          or (
            o.payment_status = 'paid'
            and o.status not in ('cancelled', 'rejected')
            and (
              (o.tailor_id = (select auth.uid()) and o.type <> 'fabric_only')
              or (o.vendor_id = (select auth.uid()) and o.type = 'fabric_only')
            )
          )
        )
    )
  );

drop policy if exists order_contacts_insert_client on public.order_contacts;
create policy order_contacts_insert_client on public.order_contacts
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = public.order_contacts.order_id
        and o.client_id = (select auth.uid())
    )
  );

-- 2. L'adresse de livraison et le numéro du devis ------------------------------
alter table public.orders
  add column if not exists delivery_address text,
  add column if not exists delivery_country text,
  add column if not exists quote_revision integer not null default 0;

-- 3. Les commandes déjà en base --------------------------------------------------
insert into public.order_contacts (order_id, first_name, last_name, email, phone)
select id, contact_first_name, contact_last_name, contact_email, contact_phone
from public.orders
where contact_first_name is not null
   or contact_last_name is not null
   or contact_email is not null
   or contact_phone is not null
on conflict (order_id) do nothing;

-- Sans toucher à `updated_at` : la page des refus affiche cette date.
alter table public.orders disable trigger orders_updated_at;

update public.orders
set contact_first_name = null,
    contact_last_name  = null,
    contact_email      = null,
    contact_phone      = null
where contact_first_name is not null
   or contact_last_name is not null
   or contact_email is not null
   or contact_phone is not null;

update public.orders o
set delivery_address = a.address_line,
    delivery_country = a.country
from public.addresses a
where o.address_id = a.id
  and o.delivery_address is null;

alter table public.orders enable trigger orders_updated_at;

-- 4. Plus de profil ni de carnet d'adresses du client pour les pros -------------
-- Dans l'autre sens non plus : le client n'a pas à lire le téléphone du tailleur.
drop policy if exists "profiles_select_order_party" on public.profiles;
drop policy if exists "addresses_select_order_tailor" on public.addresses;
drop policy if exists addresses_select_order_vendor on public.addresses;

-- 5. La livraison, décidée par le pro sur chaque produit ------------------------
alter table public.models
  add column if not exists delivery_zone text not null default 'none';
alter table public.models drop constraint if exists models_delivery_zone_check;
alter table public.models
  add constraint models_delivery_zone_check
  check (delivery_zone in ('none', 'dakar', 'senegal', 'world'));

alter table public.fabrics
  add column if not exists delivery_zone text not null default 'none';
alter table public.fabrics drop constraint if exists fabrics_delivery_zone_check;
alter table public.fabrics
  add constraint fabrics_delivery_zone_check
  check (delivery_zone in ('none', 'dakar', 'senegal', 'world'));

-- On garde ce que chaque pro avait déjà choisi pour toute sa boutique.
update public.models m
set delivery_zone = t.free_delivery_zone
from public.tailors t
where m.tailor_id = t.id
  and m.delivery_zone = 'none'
  and t.free_delivery_zone <> 'none';

update public.fabrics f
set delivery_zone = 'world'
from public.vendors v
where f.vendor_id = v.id
  and f.delivery_zone = 'none'
  and v.free_delivery;

-- 6. Retire le verrou de la version précédente : c'est le pro qui livre ---------
drop trigger if exists orders_guard_delivered on public.orders;
drop function if exists public.guard_order_delivered();

-- 7. Chacun est prévenu, avec le code et rien d'autre ---------------------------
-- Le vendeur est prévenu du paiement par `notify_vendor_fabric_sale`.
create or replace function public.notify_quote_flow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(new.is_quote, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.tailor_id is not null then
      insert into public.notifications (user_id, type, title, body, link, order_id)
      values (new.tailor_id, 'quote_request', 'Nouvelle demande de devis',
              'Code ' || new.order_number || ' : donnez votre prix.',
              '/tailleur/espace/a-traiter', new.id);
    end if;
    return new;
  end if;

  -- Le client paie : le travail commence.
  if old.payment_status = 'pending' and new.payment_status = 'paid' then
    if new.tailor_id is not null then
      insert into public.notifications (user_id, type, title, body, link, order_id)
      values (new.tailor_id, 'quote_paid', 'Le client a payé',
              'Code ' || new.order_number || ' : vous pouvez commencer. Ses coordonnées sont sur la commande.',
              '/tailleur/espace/en-cours', new.id);
    end if;
    return new;
  end if;

  if new.payment_status <> 'pending' or new.tailor_id is null then
    return new;
  end if;

  -- Une demande refusée repart chez un autre tailleur.
  if new.tailor_id is distinct from old.tailor_id then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.tailor_id, 'quote_request', 'Nouvelle demande de devis',
            'Code ' || new.order_number || ' : donnez votre prix.',
            '/tailleur/espace/a-traiter', new.id);
    return new;
  end if;

  -- Le client a changé sa demande : le tailleur refait son prix.
  if new.quote_revision > old.quote_revision then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.tailor_id, 'quote_revised', 'Le client a modifié sa demande',
            'Code ' || new.order_number || ' : donnez un nouveau prix.',
            '/tailleur/espace/a-traiter', new.id);
    return new;
  end if;

  -- Le tailleur a donné son prix.
  if coalesce(old.tailoring_price, 0) <= 0 and new.tailoring_price > 0 then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'quote_ready', 'Votre devis est prêt',
            'Regardez le détail du prix, puis acceptez ou modifiez votre demande.',
            '/compte/commandes/' || new.id, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists orders_notify_quote_flow on public.orders;
create trigger orders_notify_quote_flow
  after insert or update of tailor_id, tailoring_price, quote_revision, payment_status
  on public.orders
  for each row execute function public.notify_quote_flow();

commit;

notify pgrst, 'reload schema';
