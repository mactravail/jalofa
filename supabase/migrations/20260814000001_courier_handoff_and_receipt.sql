-- ---------------------------------------------------------------------------
-- Livraison : le livreur, puis la réception confirmée par le client.
--
-- 1. Le tailleur remet la tenue à un livreur : il donne son nom, son numéro et
--    l'heure d'arrivée prévue (colonnes `courier_*`), la commande passe « en
--    route » (`shipped`).
-- 2. Le client est prévenu avec ces informations.
-- 3. C'est le CLIENT qui dit « J'ai reçu ma tenue » (`confirm_order_received`) :
--    la commande passe « livrée », le tailleur est prévenu. Avis et retouches
--    s'ouvrent seulement à ce moment.
--
-- À exécuter APRÈS 20260813000001 (il en remplace la fonction de notification).
-- Idempotent : peut être rejoué dans le SQL Editor.
-- ---------------------------------------------------------------------------
begin;

-- 1. Le livreur ---------------------------------------------------------------
alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists courier_phone text;
alter table public.orders add column if not exists courier_eta timestamptz;

-- 2. Le client confirme la réception de sa tenue --------------------------------
create or replace function public.confirm_order_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.orders
     set status = 'delivered'
   where id = p_order_id
     and client_id = (select auth.uid())
     and type <> 'fabric_only'
     and status = 'shipped';

  if not found then
    raise exception 'Cette commande ne peut pas être confirmée'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.confirm_order_received(uuid) from public, anon;
grant execute on function public.confirm_order_received(uuid) to authenticated;

-- 3. Les notifications des étapes ----------------------------------------------
create or replace function public.notify_client_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  link text := '/compte/commandes/' || new.id;
  eta text;
begin
  if new.status is not distinct from old.status or new.client_id is null then
    return new;
  end if;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_accepted', 'Commande acceptée',
            'Votre tailleur a accepté votre commande.', link, new.id);

  elsif new.status in ('in_production', 'sewing')
        and old.status not in ('in_production', 'sewing') then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_sewing', 'La couture a commencé',
            'Votre tenue est entre les mains du tailleur.', link, new.id);

  elsif new.status = 'shipped' then
    eta := case
      when new.courier_eta is null then null
      else to_char(new.courier_eta at time zone 'Africa/Dakar', 'DD/MM "à" HH24"h"MI')
    end;
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_shipped', 'Votre tenue est en route',
            concat_ws(' ',
              case when new.courier_name is not null or new.courier_phone is not null
                then 'Livreur : ' || concat_ws(' · ', new.courier_name, new.courier_phone) || '.'
              end,
              case when eta is not null then 'Arrivée prévue le ' || eta || '.' end,
              'Le livreur a votre numéro pour vous appeler.'),
            link, new.id);

  elsif new.status = 'delivered' then
    -- Le client vient de confirmer : c'est le tailleur qu'on prévient.
    if new.tailor_id is not null then
      insert into public.notifications (user_id, type, title, body, link, order_id)
      values (new.tailor_id, 'order_delivered', 'Le client a reçu sa tenue',
              'Code ' || new.order_number || ' : commande terminée.',
              '/tailleur/espace/terminees', new.id);
    end if;
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_delivered', 'Commande reçue',
            'Merci ! Donnez votre avis sur votre tailleur et votre tissu.', link, new.id);
  end if;

  return new;
end;
$$;

-- 4. « La tenue vous va ? » : Parfaite / Un problème ------------------------
-- Une réponse par commande, donnée après « Reçue ». Le tailleur et le vendeur
-- la lisent ; JALOFA s'en sert pour évaluer chaque prestataire. Écriture par
-- server action (client de service) — jamais directement par le client.
create table if not exists public.order_satisfaction (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null unique references public.orders(id) on delete cascade,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  tailor_id  uuid references public.tailors(id) on delete set null,
  vendor_id  uuid references public.vendors(id) on delete set null,
  verdict    text not null check (verdict in ('perfect', 'problem')),
  issues     text[] not null default '{}',
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists order_satisfaction_tailor_id_idx
  on public.order_satisfaction(tailor_id);
create index if not exists order_satisfaction_vendor_id_idx
  on public.order_satisfaction(vendor_id);

alter table public.order_satisfaction enable row level security;

drop policy if exists order_satisfaction_select_party on public.order_satisfaction;
create policy order_satisfaction_select_party on public.order_satisfaction
  for select to authenticated
  using (client_id = auth.uid() or tailor_id = auth.uid() or vendor_id = auth.uid());

grant select on public.order_satisfaction to authenticated;

drop trigger if exists orders_notify_client_status on public.orders;
create trigger orders_notify_client_status
  after update of status on public.orders
  for each row execute function public.notify_client_order_status();

commit;

notify pgrst, 'reload schema';
