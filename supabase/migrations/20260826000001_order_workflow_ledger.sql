-- ---------------------------------------------------------------------------
-- Workflow des commandes, annulations, remboursements et registre financier.
-- Cahier des charges JALOFA du 2026-11-13.
--
-- - Deux options de livraison : `economy` (A) et `express` (B).
-- - Tarifs de livraison fixés par chaque pro sur son profil.
-- - Horodatages serveur : paiement, envoi du tissu, réception, découpe.
-- - La découpe (passage à « en production ») et l'envoi du tissu sont
--   AUTORISÉS PAR LA BASE (trigger `orders_workflow_guard`), avec les mêmes
--   règles que `src/lib/order-workflow.ts` — garder les deux identiques.
-- - Demande d'annulation = blocage immédiat, examen par JALOFA.
-- - Registre financier par commande (`order_ledger`), journal d'événements
--   (`order_events`) : append-only, aucune modification ni suppression.
-- - Preuves (photos de découpe, envoi, réception) : bucket privé `order-proofs`.
--
-- Montants en FCFA (XOF, sans sous-unité). Horodatages en UTC.
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

-- 1. Tarifs de livraison des pros --------------------------------------------
-- null = option non proposée par ce pro ; 0 = livraison offerte.
alter table public.vendors
  add column if not exists ship_fee_economy numeric(10, 2) check (ship_fee_economy >= 0),
  add column if not exists ship_fee_express numeric(10, 2) check (ship_fee_express >= 0);
alter table public.tailors
  add column if not exists ship_fee_economy numeric(10, 2) check (ship_fee_economy >= 0),
  add column if not exists ship_fee_express numeric(10, 2) check (ship_fee_express >= 0);

-- 2. Paiements (un paiement peut couvrir plusieurs commandes d'un panier) -----
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete restrict,
  provider        text not null default 'manual' check (provider in ('manual', 'bictorys')),
  provider_ref    text,
  idempotency_key text not null unique,
  amount          numeric(12, 2) not null check (amount >= 0),
  currency        text not null default 'XOF',
  status          text not null default 'pending'
                    check (status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  -- Frais RÉELS confirmés par le prestataire ; null = inconnu. Jamais estimé.
  provider_fee    numeric(12, 2) check (provider_fee >= 0),
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz
);
create unique index if not exists payments_provider_ref_key
  on public.payments(provider, provider_ref) where provider_ref is not null;
create index if not exists payments_client_id_idx on public.payments(client_id);

alter table public.payments enable row level security;
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated
  using (client_id = (select auth.uid()) or public.is_admin());
grant select on public.payments to authenticated;

-- 3. Colonnes de workflow sur la commande -------------------------------------
alter table public.orders
  add column if not exists delivery_option text not null default 'economy',
  add column if not exists fabric_owner text,
  add column if not exists payment_id uuid references public.payments(id),
  add column if not exists paid_at timestamptz,
  add column if not exists amount_paid numeric(12, 2),
  add column if not exists fabric_delivery_fee numeric(10, 2) not null default 0,
  add column if not exists fabric_shipped_at timestamptz,
  add column if not exists fabric_received_at timestamptz,
  add column if not exists cut_started_at timestamptz,
  add column if not exists cut_was_authorized boolean,
  add column if not exists workflow_hold boolean not null default false,
  add column if not exists refund_status text not null default 'none';

alter table public.orders drop constraint if exists orders_delivery_option_check;
alter table public.orders add constraint orders_delivery_option_check
  check (delivery_option in ('economy', 'express'));
alter table public.orders drop constraint if exists orders_fabric_owner_check;
alter table public.orders add constraint orders_fabric_owner_check
  check (fabric_owner is null or fabric_owner in ('vendor', 'tailor', 'client'));
alter table public.orders drop constraint if exists orders_refund_status_check;
alter table public.orders add constraint orders_refund_status_check
  check (refund_status in ('none', 'pending', 'partial', 'refunded', 'failed'));
alter table public.orders drop constraint if exists orders_fabric_delivery_fee_check;
alter table public.orders add constraint orders_fabric_delivery_fee_check
  check (fabric_delivery_fee >= 0);

create index if not exists orders_payment_id_idx on public.orders(payment_id);

-- Reprise des commandes existantes : horodatages tirés de l'historique.
update public.orders o
   set fabric_owner = case
         when o.type = 'own_fabric' then 'client'
         when o.type = 'full' and o.tailor_id is not null and o.tailor_id = o.vendor_id then 'tailor'
         else 'vendor'
       end
 where o.fabric_owner is null;

update public.orders o
   set paid_at = coalesce(
         case when coalesce(o.is_quote, false) then
           (select min(h.created_at) from public.order_status_history h
             where h.order_id = o.id and h.status = 'accepted')
         end,
         o.created_at),
       amount_paid = coalesce(o.amount_paid, o.total_amount)
 where o.payment_status in ('paid', 'refunded') and o.paid_at is null;

update public.orders o
   set fabric_shipped_at = (select min(h.created_at) from public.order_status_history h
                             where h.order_id = o.id and h.status = 'fabric_shipped')
 where o.fabric_shipped_at is null;

update public.orders o
   set fabric_received_at = (select min(h.created_at) from public.order_status_history h
                              where h.order_id = o.id and h.status = 'fabric_received_by_tailor')
 where o.fabric_received_at is null;

-- Découpes d'avant ce workflow : autorisation inconnue (null), jamais supposée.
update public.orders o
   set cut_started_at = (select min(h.created_at) from public.order_status_history h
                          where h.order_id = o.id
                            and h.status in ('in_production', 'sewing', 'quality_check', 'shipped'))
 where o.cut_started_at is null and o.type <> 'fabric_only';

-- 4. Demandes d'annulation ----------------------------------------------------
create table if not exists public.order_cancellations (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete restrict,
  requested_by    uuid not null references public.profiles(id),
  requested_at    timestamptz not null default now(),
  reason          text,
  -- Où en était la commande à la demande (avant expédition, tissu parti, découpe…).
  stage           text not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected')),
  decided_by      uuid references public.profiles(id),
  decided_at      timestamptz,
  decision_reason text,
  refund_amount   numeric(12, 2) check (refund_amount >= 0),
  return_fee      numeric(12, 2) check (return_fee >= 0),
  -- Les parts retenues validées par JALOFA (copie des lignes du registre).
  settlement      jsonb
);
create unique index if not exists order_cancellations_one_pending
  on public.order_cancellations(order_id) where status = 'pending';
create index if not exists order_cancellations_order_id_idx
  on public.order_cancellations(order_id);

alter table public.order_cancellations enable row level security;
drop policy if exists order_cancellations_select_party on public.order_cancellations;
create policy order_cancellations_select_party on public.order_cancellations
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
       where o.id = order_cancellations.order_id
         and (select auth.uid()) in (o.client_id, o.tailor_id, o.vendor_id)
    )
  );
grant select on public.order_cancellations to authenticated;

-- 5. Journal d'événements (append-only) ---------------------------------------
create table if not exists public.order_events (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete restrict,
  event_type   text not null,
  actor_id     uuid,
  -- client | tailor | vendor | admin | system
  actor_role   text not null default 'system',
  old_value    text,
  new_value    text,
  note         text,
  external_ref text,
  proof_path   text,
  created_at   timestamptz not null default now()
);
create index if not exists order_events_order_id_idx on public.order_events(order_id, created_at);

alter table public.order_events enable row level security;
drop policy if exists order_events_select_party on public.order_events;
create policy order_events_select_party on public.order_events
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
       where o.id = order_events.order_id
         and (select auth.uid()) in (o.client_id, o.tailor_id, o.vendor_id)
    )
  );
grant select on public.order_events to authenticated;

-- 6. Registre financier par commande (append-only) ----------------------------
-- payment    : argent reçu du client (+)
-- fabric, tailoring, delivery_*, compensation, commission : parts dues décidées
-- provider_fee, payout_fee : frais RÉELS du prestataire de paiement
-- refund, payout : argent effectivement sorti
-- adjustment : correction (montant signé) — jamais de modification d'une ligne
create table if not exists public.order_ledger (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete restrict,
  payment_id      uuid references public.payments(id),
  entry_type      text not null check (entry_type in (
                    'payment', 'fabric', 'tailoring', 'delivery_out', 'delivery_garment',
                    'delivery_return', 'compensation', 'commission', 'provider_fee',
                    'payout_fee', 'refund', 'payout', 'adjustment')),
  party           text not null check (party in ('client', 'vendor', 'tailor', 'carrier', 'jalofa', 'provider')),
  party_id        uuid,
  amount          numeric(12, 2) not null,
  currency        text not null default 'XOF',
  idempotency_key text not null unique,
  external_ref    text,
  proof_path      text,
  note            text,
  created_by      uuid,
  created_at      timestamptz not null default now()
);
create index if not exists order_ledger_order_id_idx on public.order_ledger(order_id);
create index if not exists order_ledger_party_id_idx on public.order_ledger(party_id);

alter table public.order_ledger enable row level security;
drop policy if exists order_ledger_select on public.order_ledger;
create policy order_ledger_select on public.order_ledger
  for select to authenticated
  using (
    public.is_admin()
    or party_id = (select auth.uid())
    or exists (
      select 1 from public.orders o
       where o.id = order_ledger.order_id and o.client_id = (select auth.uid())
    )
  );
grant select on public.order_ledger to authenticated;

create or replace function public.forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Écriture définitive : créez une écriture de correction'
    using errcode = '42501';
end;
$$;

drop trigger if exists order_ledger_immutable on public.order_ledger;
create trigger order_ledger_immutable
  before update or delete on public.order_ledger
  for each row execute function public.forbid_mutation();

drop trigger if exists order_events_immutable on public.order_events;
create trigger order_events_immutable
  before update or delete on public.order_events
  for each row execute function public.forbid_mutation();

-- Une commande n'est jamais supprimée (§2.3).
drop trigger if exists orders_never_deleted on public.orders;
create trigger orders_never_deleted
  before delete on public.orders
  for each row execute function public.forbid_mutation();

-- 7. Preuves ------------------------------------------------------------------
create table if not exists public.order_proofs (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete restrict,
  kind        text not null check (kind in ('shipping', 'reception', 'cut_before', 'cut_after', 'return', 'other')),
  path        text not null,
  uploaded_by uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists order_proofs_order_id_idx on public.order_proofs(order_id);

alter table public.order_proofs enable row level security;
drop policy if exists order_proofs_select_party on public.order_proofs;
create policy order_proofs_select_party on public.order_proofs
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
       where o.id = order_proofs.order_id
         and (select auth.uid()) in (o.client_id, o.tailor_id, o.vendor_id)
    )
  );
grant select on public.order_proofs to authenticated;

drop trigger if exists order_proofs_immutable on public.order_proofs;
create trigger order_proofs_immutable
  before update or delete on public.order_proofs
  for each row execute function public.forbid_mutation();

-- Bucket privé : `<uid>/<order_id>/<fichier>`. Lecture par les parties de la commande.
insert into storage.buckets (id, name, public)
values ('order-proofs', 'order-proofs', false)
on conflict (id) do nothing;

drop policy if exists order_proofs_upload_own on storage.objects;
create policy order_proofs_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'order-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists order_proofs_read_party on storage.objects;
create policy order_proofs_read_party on storage.objects
  for select to authenticated
  using (
    bucket_id = 'order-proofs'
    and (
      public.is_admin()
      or exists (
        select 1 from public.orders o
         where o.id::text = (storage.foldername(name))[2]
           and (select auth.uid()) in (o.client_id, o.tailor_id, o.vendor_id)
      )
    )
  );

-- 8. Règles (miroir de src/lib/order-workflow.ts) -----------------------------
create or replace function public.order_has_pending_cancellation(p_order_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.order_cancellations c
     where c.order_id = p_order_id and c.status = 'pending'
  );
$$;

create or replace function public.order_fabric_owner(o public.orders)
returns text
language sql
immutable
as $$
  select case
    when o.type = 'own_fabric' then 'client'
    when o.type = 'full' and o.tailor_id is not null and o.tailor_id = o.vendor_id then 'tailor'
    else 'vendor'
  end;
$$;

-- null = découpe autorisée ; sinon le motif du blocage (cf. CutBlock).
create or replace function public.order_cut_block(o public.orders)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  owner text := public.order_fabric_owner(o);
  clock timestamptz;
begin
  if o.type = 'fabric_only' then return 'not_applicable'; end if;
  if o.cut_started_at is not null then return 'already_started'; end if;
  if o.status in ('cancelled', 'rejected', 'delivered') then return 'closed'; end if;
  if o.payment_status <> 'paid' or o.paid_at is null then return 'unpaid'; end if;
  if public.order_has_pending_cancellation(o.id) then return 'cancellation_pending'; end if;
  if o.workflow_hold then return 'on_hold'; end if;

  if o.delivery_option = 'economy' and owner <> 'tailor' then
    clock := o.fabric_received_at;
  else
    clock := o.paid_at;
  end if;

  if owner <> 'tailor' and o.fabric_received_at is null then return 'fabric_not_received'; end if;
  if clock is null or now() < clock + interval '24 hours' then return 'waiting'; end if;
  return null;
end;
$$;

-- null = envoi autorisé ; sinon le motif (cf. ShipBlock).
create or replace function public.order_ship_block(o public.orders)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.order_fabric_owner(o) <> 'vendor' then return 'not_applicable'; end if;
  if o.fabric_shipped_at is not null then return 'already_shipped'; end if;
  if o.status in ('cancelled', 'rejected', 'delivered') then return 'closed'; end if;
  if o.payment_status <> 'paid' or o.paid_at is null then return 'unpaid'; end if;
  if public.order_has_pending_cancellation(o.id) then return 'cancellation_pending'; end if;
  if o.workflow_hold then return 'on_hold'; end if;
  if o.delivery_option = 'economy' and now() < o.paid_at + interval '24 hours' then
    return 'waiting';
  end if;
  return null;
end;
$$;

-- 9. Valeurs serveur à la création --------------------------------------------
create or replace function public.orders_workflow_on_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.fabric_owner := public.order_fabric_owner(new);
  -- Personne n'écrit ces horodatages à la place du serveur.
  new.fabric_shipped_at := null;
  new.fabric_received_at := null;
  new.cut_started_at := null;
  new.cut_was_authorized := null;
  new.workflow_hold := false;
  new.refund_status := 'none';
  if new.payment_status = 'paid' then
    new.paid_at := now();
    new.amount_paid := new.total_amount;
  else
    new.paid_at := null;
    new.amount_paid := null;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_workflow_insert on public.orders;
create trigger orders_workflow_insert
  before insert on public.orders
  for each row execute function public.orders_workflow_on_insert();

-- 10. Garde du workflow à chaque mise à jour ----------------------------------
create or replace function public.orders_workflow_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  privileged boolean := current_user not in ('authenticated', 'anon') or public.is_admin();
  pre_cut boolean;
  block text;
begin
  -- Colonnes écrites par le serveur seulement.
  if not privileged and (
       new.delivery_option is distinct from old.delivery_option
    or new.fabric_owner is distinct from old.fabric_owner
    or new.payment_id is distinct from old.payment_id
    or new.paid_at is distinct from old.paid_at
    or new.amount_paid is distinct from old.amount_paid
    or new.fabric_delivery_fee is distinct from old.fabric_delivery_fee
    or new.fabric_shipped_at is distinct from old.fabric_shipped_at
    or new.fabric_received_at is distinct from old.fabric_received_at
    or new.cut_started_at is distinct from old.cut_started_at
    or new.cut_was_authorized is distinct from old.cut_was_authorized
    or new.workflow_hold is distinct from old.workflow_hold
    or new.refund_status is distinct from old.refund_status
  ) then
    raise exception 'Ces informations sont enregistrées par JALOFA'
      using errcode = '42501';
  end if;

  -- Paiement confirmé : horodatage serveur.
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
    new.amount_paid := coalesce(new.amount_paid, new.total_amount);
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Demande d'annulation en cours : tout est gelé, sauf la décision de JALOFA.
  if new.status <> 'cancelled' and public.order_has_pending_cancellation(old.id) then
    raise exception 'Demande d''annulation en cours : la commande est bloquée'
      using errcode = '42501';
  end if;

  if new.status <> 'cancelled' and new.status <> 'rejected' and old.workflow_hold then
    raise exception 'Commande bloquée par JALOFA (litige en cours)'
      using errcode = '42501';
  end if;

  -- Envoi du tissu.
  if new.status = 'fabric_shipped' then
    block := public.order_ship_block(old);
    if block is not null and block <> 'not_applicable' then
      raise exception 'Envoi du tissu pas encore autorisé (%)', block
        using errcode = '42501';
    end if;
    new.fabric_shipped_at := coalesce(old.fabric_shipped_at, now());
  end if;

  -- Réception par le tailleur : seulement un tissu réellement envoyé.
  if new.status = 'fabric_received_by_tailor' then
    if old.fabric_shipped_at is null and new.fabric_shipped_at is null then
      raise exception 'Le vendeur n''a pas encore envoyé le tissu'
        using errcode = '42501';
    end if;
    new.fabric_received_at := coalesce(old.fabric_received_at, now());
  end if;

  -- Découpe : premier passage à une étape de confection.
  pre_cut := old.status in ('received', 'accepted', 'fabric_prepared', 'fabric_shipped', 'fabric_received_by_tailor');
  if old.type <> 'fabric_only'
     and pre_cut
     and new.status in ('in_production', 'sewing', 'quality_check', 'shipped', 'delivered')
  then
    -- La réception éventuelle de cette même mise à jour compte.
    block := public.order_cut_block(new);
    if block is not null and block <> 'already_started' then
      raise exception 'Découpe pas encore autorisée (%)', block
        using errcode = '42501';
    end if;
    new.cut_started_at := coalesce(old.cut_started_at, now());
    new.cut_was_authorized := true;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_workflow_guard on public.orders;
create trigger orders_workflow_guard
  before update on public.orders
  for each row execute function public.orders_workflow_guard();

-- 11. Événements et registre automatiques -------------------------------------
create or replace function public.orders_workflow_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  role_name text := case
    when actor is null then 'system'
    when public.is_admin() then 'admin'
    when actor = new.client_id then 'client'
    when actor = new.tailor_id then 'tailor'
    when actor = new.vendor_id then 'vendor'
    else 'system'
  end;
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value)
    values (new.id, 'order_created', actor, role_name, new.status::text);
  else
    if new.status is distinct from old.status then
      insert into public.order_events (order_id, event_type, actor_id, actor_role, old_value, new_value)
      values (new.id, 'status_changed', actor, role_name, old.status::text, new.status::text);
    end if;
    if new.fabric_received_at is distinct from old.fabric_received_at and new.fabric_received_at is not null then
      insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value)
      values (new.id, 'fabric_received', actor, role_name, new.fabric_received_at::text);
    end if;
    if new.cut_started_at is distinct from old.cut_started_at and new.cut_started_at is not null then
      insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, note)
      values (new.id, 'cut_started', actor, role_name, new.cut_started_at::text,
              case when new.cut_was_authorized then 'autorisée' else 'non autorisée' end);
    end if;
    if new.workflow_hold is distinct from old.workflow_hold then
      insert into public.order_events (order_id, event_type, actor_id, actor_role, old_value, new_value)
      values (new.id, 'hold_changed', actor, role_name, old.workflow_hold::text, new.workflow_hold::text);
    end if;
  end if;

  -- Argent reçu : une écriture, une seule fois par commande.
  if new.payment_status = 'paid'
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid')
  then
    insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value)
    values (new.id, 'payment_confirmed', actor, role_name, coalesce(new.amount_paid, new.total_amount)::text);
    insert into public.order_ledger (order_id, payment_id, entry_type, party, party_id, amount, idempotency_key, created_by)
    values (new.id, new.payment_id, 'payment', 'client', new.client_id,
            coalesce(new.amount_paid, new.total_amount), 'payment:' || new.id, actor)
    on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_workflow_log on public.orders;
create trigger orders_workflow_log
  after insert or update on public.orders
  for each row execute function public.orders_workflow_log();

-- 12. Le tailleur confirme avoir reçu le tissu du client ----------------------
create or replace function public.confirm_client_fabric_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.orders
     set fabric_received_at = now()
   where id = p_order_id
     and tailor_id = (select auth.uid())
     and type = 'own_fabric'
     and fabric_received_at is null
     and status not in ('cancelled', 'rejected', 'delivered')
     and not public.order_has_pending_cancellation(p_order_id);
  if not found then
    raise exception 'Réception impossible à enregistrer sur cette commande'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.confirm_client_fabric_received(uuid) from public, anon;
grant execute on function public.confirm_client_fabric_received(uuid) to authenticated;

-- 13. Le client demande l'annulation : blocage immédiat -----------------------
create or replace function public.request_order_cancellation(p_order_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
  o public.orders;
  req uuid;
  stage_name text;
begin
  -- Verrou : une découpe simultanée attend la fin de cette transaction (§12).
  select * into o from public.orders where id = p_order_id for update;
  if not found or o.client_id is distinct from caller then
    raise exception 'Commande introuvable' using errcode = '42501';
  end if;
  if o.status in ('cancelled', 'delivered') then
    raise exception 'Cette commande est terminée' using errcode = '42501';
  end if;

  -- Refusée par le tailleur : personne n'a travaillé, tout est remboursé.
  if o.status = 'rejected' then
    update public.orders
       set status = 'cancelled',
           refund_status = case when o.payment_status = 'paid' then 'pending' else 'none' end
     where id = p_order_id;
    insert into public.order_events (order_id, event_type, actor_id, actor_role, note)
    values (p_order_id, 'cancelled_after_rejection', caller, 'client', left(p_reason, 500));
    if o.payment_status = 'paid' then
      insert into public.notifications (user_id, type, title, body, link, order_id)
      select p.id, 'refund_to_do', 'Remboursement à faire',
             'Commande ' || o.order_number || ' refusée puis annulée : tout rembourser.',
             '/admin/remboursements', p_order_id
        from public.profiles p where p.role = 'admin';
    end if;
    return null;
  end if;

  -- Rien payé : on annule tout de suite, aucun argent à rendre.
  if o.payment_status = 'pending' then
    update public.orders set status = 'cancelled' where id = p_order_id;
    insert into public.order_events (order_id, event_type, actor_id, actor_role, note)
    values (p_order_id, 'cancelled_before_payment', caller, 'client', left(p_reason, 500));
    return null;
  end if;

  if o.status = 'shipped' then
    raise exception 'Votre habit est déjà en route : contactez JALOFA' using errcode = '42501';
  end if;

  stage_name := case
    when o.cut_started_at is not null then
      case when o.cut_was_authorized then 'after_authorized_cut' else 'after_unauthorized_cut' end
    when o.fabric_shipped_at is not null or o.fabric_received_at is not null then 'fabric_travelled'
    else 'before_shipment'
  end;

  begin
    insert into public.order_cancellations (order_id, requested_by, reason, stage)
    values (p_order_id, caller, left(p_reason, 500), stage_name)
    returning id into req;
  exception when unique_violation then
    raise exception 'Une demande d''annulation est déjà en cours' using errcode = '42501';
  end;

  insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, note)
  values
    (p_order_id, 'cancellation_requested', caller, 'client', stage_name, left(p_reason, 500)),
    (p_order_id, 'cancellation_blocked', null, 'system', o.status::text, 'Interventions bloquées');

  insert into public.notifications (user_id, type, title, body, link, order_id)
  select distinct u, 'cancellation_requested',
         'STOP : demande d''annulation',
         'Commande ' || o.order_number || ' : ne coupez pas, n''envoyez rien. JALOFA examine.',
         case when u = o.vendor_id and u is distinct from o.tailor_id
              then '/vendeur/espace/a-traiter' else '/tailleur/espace/en-cours' end,
         p_order_id
    from unnest(array[o.tailor_id, o.vendor_id]) as u
   where u is not null;

  insert into public.notifications (user_id, type, title, body, link, order_id)
  select p.id, 'cancellation_requested', 'Demande d''annulation à examiner',
         'Commande ' || o.order_number || '.', '/admin/annulations', p_order_id
    from public.profiles p where p.role = 'admin';

  return req;
end;
$$;
revoke all on function public.request_order_cancellation(uuid, text) from public, anon;
grant execute on function public.request_order_cancellation(uuid, text) to authenticated;

-- 14. JALOFA décide -----------------------------------------------------------
-- p_lines : [{ "party": "tailor", "party_id": "…", "kind": "compensation", "amount": 10500 }, …]
create or replace function public.decide_order_cancellation(
  p_request_id uuid,
  p_accept boolean,
  p_reason text,
  p_refund numeric,
  p_return_fee numeric,
  p_lines jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
  c public.order_cancellations;
  o public.orders;
  kept numeric := 0;
  line jsonb;
  i int := 0;
begin
  if not public.is_admin() then
    raise exception 'Réservé à JALOFA' using errcode = '42501';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Indiquez le motif de la décision' using errcode = '22023';
  end if;

  select * into c from public.order_cancellations where id = p_request_id for update;
  if not found or c.status <> 'pending' then
    raise exception 'Cette demande a déjà été traitée' using errcode = '42501';
  end if;
  select * into o from public.orders where id = c.order_id for update;

  if not p_accept then
    update public.order_cancellations
       set status = 'rejected', decided_by = caller, decided_at = now(), decision_reason = left(p_reason, 1000)
     where id = p_request_id;
    insert into public.order_events (order_id, event_type, actor_id, actor_role, note)
    values (o.id, 'cancellation_rejected', caller, 'admin', left(p_reason, 1000));
    insert into public.notifications (user_id, type, title, body, link, order_id)
    select distinct u, 'cancellation_rejected', 'Annulation refusée : la commande reprend',
           'Commande ' || o.order_number || ' : ' || left(p_reason, 200),
           case when u = o.client_id then '/compte/commandes/' || o.id
                when u = o.vendor_id and u is distinct from o.tailor_id then '/vendeur/espace/a-traiter'
                else '/tailleur/espace/en-cours' end,
           o.id
      from unnest(array[o.client_id, o.tailor_id, o.vendor_id]) as u
     where u is not null;
    return;
  end if;

  if p_refund is null or p_refund < 0 then
    raise exception 'Montant du remboursement invalide' using errcode = '22023';
  end if;
  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    if (line ->> 'amount')::numeric < 0 then
      raise exception 'Montant négatif interdit' using errcode = '22023';
    end if;
    kept := kept + (line ->> 'amount')::numeric;
  end loop;
  if kept + p_refund > coalesce(o.amount_paid, o.total_amount) then
    raise exception 'Les montants dépassent ce que le client a payé' using errcode = '22023';
  end if;

  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    i := i + 1;
    insert into public.order_ledger (order_id, entry_type, party, party_id, amount, idempotency_key, note, created_by)
    values (o.id, line ->> 'kind', line ->> 'party', nullif(line ->> 'party_id', '')::uuid,
            (line ->> 'amount')::numeric, 'cancel:' || p_request_id || ':' || i,
            'Annulation acceptée', caller);
  end loop;

  update public.order_cancellations
     set status = 'accepted', decided_by = caller, decided_at = now(),
         decision_reason = left(p_reason, 1000), refund_amount = p_refund,
         return_fee = p_return_fee, settlement = p_lines
   where id = p_request_id;

  update public.orders
     set status = 'cancelled',
         refund_status = case when p_refund > 0 then 'pending' else 'none' end
   where id = o.id;

  insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, note)
  values (o.id, 'cancellation_accepted', caller, 'admin', p_refund::text, left(p_reason, 1000));

  insert into public.notifications (user_id, type, title, body, link, order_id)
  select distinct u, 'cancellation_accepted', 'Commande annulée',
         case when u = o.client_id
              then 'Vous serez remboursé de ' || to_char(p_refund, 'FM999G999G990') || ' FCFA.'
              else 'Commande ' || o.order_number || ' annulée par JALOFA.' end,
         case when u = o.client_id then '/compte/commandes/' || o.id
              when u = o.vendor_id and u is distinct from o.tailor_id then '/vendeur/espace/terminees'
              else '/tailleur/espace/terminees' end,
         o.id
    from unnest(array[o.client_id, o.tailor_id, o.vendor_id]) as u
   where u is not null;
end;
$$;
revoke all on function public.decide_order_cancellation(uuid, boolean, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.decide_order_cancellation(uuid, boolean, text, numeric, numeric, jsonb) to authenticated;

-- 15. Remboursement effectué (total ou partiel), protégé contre les doublons --
create or replace function public.record_order_refund(
  p_order_id uuid,
  p_amount numeric,
  p_external_ref text,
  p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
  o public.orders;
  due numeric;
  done numeric;
  inserted int;
begin
  if not public.is_admin() then
    raise exception 'Réservé à JALOFA' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Montant invalide' using errcode = '22023';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Commande introuvable'; end if;

  -- Ce qui est dû : la décision d'annulation ; sinon (refus du tailleur, ou
  -- annulation d'avant ce workflow, toujours remboursée en entier) tout le payé.
  select coalesce(
           (select c.refund_amount from public.order_cancellations c
             where c.order_id = o.id and c.status = 'accepted'
             order by c.decided_at desc limit 1),
           case when o.status in ('rejected', 'cancelled') then coalesce(o.amount_paid, o.total_amount) end,
           -- Tissu seul rendu et reçu par le vendeur : le prix du tissu.
           (select o.fabric_price from public.fabric_returns r
             where r.order_id = o.id and r.status = 'received'),
           0)
    into due;
  select coalesce(sum(amount), 0) into done
    from public.order_ledger where order_id = o.id and entry_type = 'refund';

  insert into public.order_ledger (order_id, payment_id, entry_type, party, party_id, amount, idempotency_key, external_ref, created_by)
  values (o.id, o.payment_id, 'refund', 'client', o.client_id, p_amount,
          'refund:' || o.id || ':' || p_idempotency_key, p_external_ref, caller)
  on conflict (idempotency_key) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    return; -- déjà enregistré : rien à refaire
  end if;

  if done + p_amount > due then
    raise exception 'Le remboursement dépasse ce qui est dû (% FCFA)', due - done
      using errcode = '22023';
  end if;

  update public.orders
     set refund_status = case when done + p_amount >= due then 'refunded' else 'partial' end,
         payment_status = case when done + p_amount >= coalesce(o.amount_paid, o.total_amount)
                               then 'refunded'::public.payment_status else o.payment_status end
   where id = o.id;

  insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, external_ref)
  values (o.id, 'refund_recorded', caller, 'admin', p_amount::text, p_external_ref);

  insert into public.notifications (user_id, type, title, body, link, order_id)
  values (o.client_id, 'order_refunded', 'Vous avez été remboursé',
          to_char(p_amount, 'FM999G999G990') || ' FCFA vous ont été renvoyés.',
          '/compte/commandes/' || o.id, o.id);
end;
$$;
revoke all on function public.record_order_refund(uuid, numeric, text, text) from public, anon;
grant execute on function public.record_order_refund(uuid, numeric, text, text) to authenticated;

-- 16. Versement à un pro, une fois par commande et par métier -----------------
-- p_lines : [{ "order_id": "…", "amount": 25000 }, …]
create or replace function public.record_payout(
  p_pro_id uuid,
  p_role text,
  p_method text,
  p_reference text,
  p_lines jsonb
)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
  line jsonb;
  inserted int;
  total int := 0;
begin
  if not public.is_admin() then
    raise exception 'Réservé à JALOFA' using errcode = '42501';
  end if;
  if p_role not in ('tailor', 'vendor') then
    raise exception 'Métier invalide' using errcode = '22023';
  end if;

  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    if (line ->> 'amount')::numeric <= 0 then continue; end if;
    insert into public.order_ledger (order_id, entry_type, party, party_id, amount, idempotency_key, external_ref, note, created_by)
    values ((line ->> 'order_id')::uuid, 'payout', p_role, p_pro_id, (line ->> 'amount')::numeric,
            'payout:' || (line ->> 'order_id') || ':' || p_role || ':' || p_pro_id,
            p_reference, left(p_method, 100), caller)
    on conflict (idempotency_key) do nothing;
    get diagnostics inserted = row_count;
    if inserted > 0 then
      total := total + 1;
      insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, external_ref)
      values ((line ->> 'order_id')::uuid, 'payout_recorded', caller, 'admin', line ->> 'amount', p_reference);
    end if;
  end loop;
  return total;
end;
$$;
revoke all on function public.record_payout(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.record_payout(uuid, text, text, text, jsonb) to authenticated;

-- 17. JALOFA bloque / débloque une commande (litige) --------------------------
create or replace function public.set_order_hold(p_order_id uuid, p_hold boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé à JALOFA' using errcode = '42501';
  end if;
  update public.orders set workflow_hold = p_hold where id = p_order_id;
  insert into public.order_events (order_id, event_type, actor_id, actor_role, new_value, note)
  values (p_order_id, case when p_hold then 'dispute_opened' else 'dispute_resolved' end,
          (select auth.uid()), 'admin', p_hold::text, left(p_reason, 1000));
end;
$$;
revoke all on function public.set_order_hold(uuid, boolean, text) from public, anon;
grant execute on function public.set_order_hold(uuid, boolean, text) to authenticated;

-- 18. Paiement ----------------------------------------------------------------
-- Ouvre le paiement d'un panier pour le client connecté. Provider `manual` =
-- STUB en attendant Bictorys : il est marqué payé tout de suite, comme avant.
-- Avec Bictorys, le paiement restera `pending` jusqu'au webhook vérifié
-- (`confirm_payment`, appelé côté serveur avec la clé de service).
create or replace function public.open_payment(p_amount numeric, p_idempotency_key text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := (select auth.uid());
  pid uuid;
begin
  if caller is null then raise exception 'Connectez-vous' using errcode = '42501'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'Montant invalide' using errcode = '22023'; end if;

  insert into public.payments (client_id, provider, idempotency_key, amount, status, confirmed_at)
  values (caller, 'manual', caller || ':' || p_idempotency_key, p_amount, 'paid', now())
  on conflict (idempotency_key) do nothing
  returning id into pid;

  if pid is null then
    select id into pid from public.payments where idempotency_key = caller || ':' || p_idempotency_key;
  end if;
  return pid;
end;
$$;
revoke all on function public.open_payment(numeric, text) from public, anon;
grant execute on function public.open_payment(numeric, text) to authenticated;

-- Confirmation par le prestataire (webhook vérifié). Idempotente, et refuse un
-- montant ou une devise qui ne correspondent pas. Service role uniquement.
create or replace function public.confirm_payment(
  p_payment_id uuid,
  p_provider_ref text,
  p_amount numeric,
  p_currency text,
  p_provider_fee numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pay public.payments;
begin
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Paiement introuvable'; end if;
  if pay.status = 'paid' then return; end if; -- webhook en double
  if pay.amount <> p_amount or pay.currency <> p_currency then
    raise exception 'Montant ou devise inattendus';
  end if;

  update public.payments
     set status = 'paid', provider_ref = p_provider_ref, provider_fee = p_provider_fee, confirmed_at = now()
   where id = pay.id;
  update public.orders set payment_status = 'paid'
   where payment_id = pay.id and payment_status = 'pending';
end;
$$;
revoke all on function public.confirm_payment(uuid, text, numeric, text, numeric) from public, anon, authenticated;

commit;

notify pgrst, 'reload schema';
