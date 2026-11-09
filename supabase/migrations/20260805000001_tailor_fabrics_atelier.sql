-- ---------------------------------------------------------------------------
-- Les tissus d'un modèle + l'adresse de l'atelier + le voyage du tissu.
--
-- - `model_fabrics` : les tissus qu'un tailleur a à disposition pour un modèle
--   (ce que le client choisit en « Tel quel »).
-- - `tailor_ateliers` : où envoyer un tissu acheté chez un autre vendeur. Table à
--   part, et non colonne de `tailors` (lisible par tous) : beaucoup de tailleurs
--   travaillent chez eux. Seuls le tailleur et le vendeur d'une commande PAYÉE y
--   ont accès.
-- - Notifications : le vendeur est prévenu quand le tissu est réellement à envoyer
--   (au paiement pour un devis), le client quand il part et quand il est reçu.
--
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

-- 1. Tissus d'un modèle ------------------------------------------------------
create table if not exists public.model_fabrics (
  model_id  uuid not null references public.models(id)  on delete cascade,
  fabric_id uuid not null references public.fabrics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (model_id, fabric_id)
);

create index if not exists model_fabrics_fabric_id_idx
  on public.model_fabrics(fabric_id);

alter table public.model_fabrics enable row level security;

drop policy if exists model_fabrics_select_all on public.model_fabrics;
create policy model_fabrics_select_all on public.model_fabrics
  for select using (true);

-- Le modèle ET le tissu doivent appartenir au tailleur connecté.
drop policy if exists model_fabrics_insert_own on public.model_fabrics;
create policy model_fabrics_insert_own on public.model_fabrics
  for insert to authenticated
  with check (
    exists (select 1 from public.models m
            where m.id = model_id and m.tailor_id = auth.uid())
    and exists (select 1 from public.fabrics f
                where f.id = fabric_id and f.vendor_id = auth.uid())
  );

drop policy if exists model_fabrics_delete_own on public.model_fabrics;
create policy model_fabrics_delete_own on public.model_fabrics
  for delete to authenticated
  using (
    exists (select 1 from public.models m
            where m.id = model_id and m.tailor_id = auth.uid())
  );

grant select on public.model_fabrics to anon, authenticated;
grant insert, delete on public.model_fabrics to authenticated;

-- 2. Adresse de l'atelier ----------------------------------------------------
create table if not exists public.tailor_ateliers (
  tailor_id  uuid primary key references public.tailors(id) on delete cascade,
  address    text not null check (length(trim(address)) > 0),
  phone      text not null check (length(trim(phone)) > 0),
  updated_at timestamptz not null default now()
);

alter table public.tailor_ateliers enable row level security;

drop policy if exists tailor_ateliers_owner on public.tailor_ateliers;
create policy tailor_ateliers_owner on public.tailor_ateliers
  for all to authenticated
  using (tailor_id = auth.uid())
  with check (tailor_id = auth.uid());

-- Le vendeur ne lit l'adresse que s'il a un tissu payé à envoyer à cet atelier.
drop policy if exists tailor_ateliers_vendor_read on public.tailor_ateliers;
create policy tailor_ateliers_vendor_read on public.tailor_ateliers
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.tailor_id = tailor_ateliers.tailor_id
        and o.vendor_id = auth.uid()
        and o.payment_status = 'paid'
    )
  );

grant select, insert, update on public.tailor_ateliers to authenticated;

-- 3. Vente de tissu : prévenir le vendeur au bon moment ----------------------
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

  -- Le tissu appartient au tailleur de la commande : rien à vendre ni à envoyer.
  if new.vendor_id is not distinct from new.tailor_id then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Un devis n'est pas une vente tant que le client n'a pas payé.
    if coalesce(new.is_quote, false) then
      return new;
    end if;
  else
    -- Mise à jour : seul le paiement d'un devis déclenche la notification.
    if not (coalesce(new.is_quote, false)
            and old.payment_status = 'pending'
            and new.payment_status = 'paid') then
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

  insert into public.notifications (user_id, type, title, body, link, order_id)
  values (
    new.vendor_id,
    'fabric_sale',
    'Nouvelle vente de tissu',
    body_text,
    '/vendeur/espace/a-traiter',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists orders_notify_vendor_fabric_sale on public.orders;
create trigger orders_notify_vendor_fabric_sale
  after insert or update of payment_status on public.orders
  for each row execute function public.notify_vendor_fabric_sale();

-- 4. Le voyage du tissu : prévenir le client et le tailleur ------------------
create or replace function public.notify_fabric_journey()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fabric_name text;
  atelier_name text;
begin
  if new.status is not distinct from old.status
     or new.type <> 'full'
     or new.vendor_id is null
     or new.tailor_id is null
     or new.vendor_id = new.tailor_id
     or new.status not in ('fabric_shipped', 'fabric_received_by_tailor')
  then
    return new;
  end if;

  select f.name into fabric_name from public.fabrics f where f.id = new.fabric_id;
  select t.shop_name into atelier_name from public.tailors t where t.id = new.tailor_id;

  if new.status = 'fabric_shipped' then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values
      (new.client_id, 'fabric_shipped', 'Votre tissu est en route',
       'Le vendeur l''a envoyé à l''atelier de ' || coalesce(atelier_name, 'votre tailleur') || '.',
       '/compte/commandes/' || new.id, new.id),
      (new.tailor_id, 'fabric_shipped', 'Un tissu arrive à votre atelier',
       coalesce(fabric_name, 'Tissu') || ' pour la commande ' || new.order_number
         || '. À l''arrivée, touchez « J''ai reçu le tissu ».',
       '/tailleur/espace/en-cours', new.id);
  else
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values
      (new.client_id, 'fabric_received', 'Votre tailleur a bien reçu le tissu',
       coalesce(atelier_name, 'Votre tailleur') || ' peut commencer la couture.',
       '/compte/commandes/' || new.id, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists orders_notify_fabric_journey on public.orders;
create trigger orders_notify_fabric_journey
  after update of status on public.orders
  for each row execute function public.notify_fabric_journey();

commit;

notify pgrst, 'reload schema';
