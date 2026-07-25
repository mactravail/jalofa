-- ---------------------------------------------------------------------------
-- Refus motivé d'une commande + prix par modèle.
--
-- 1. Le tailleur qui ne peut pas honorer une commande la refuse EN DONNANT un
--    motif (il ne sait pas la faire, il est trop chargé, il ne peut pas livrer
--    à temps). Le motif est porté par la commande, à côté du statut `rejected`.
--
-- 2. Un refus prévient le client sur son espace (notification), pour qu'il
--    choisisse un autre tailleur sans attendre. La notification passe par un
--    trigger `security definer` : `notifications` n'a pas de policy d'insert,
--    ces lignes ne sont créées QUE par le trigger, jamais à la main.
--    (L'administration, elle, retrouve les refus en attente sur sa page dédiée,
--    qui lit directement les commandes `rejected` — toujours à jour.)
--
-- 3. Chaque tailleur facture le prix qu'il veut pour chacune de ses créations :
--    `models.price` porte ce tarif. Il fait foi à la caisse quand le client
--    commande le modèle ; à défaut (catalogue plateforme, prix non renseigné),
--    on retombe sur le `base_price` « dès… » du tailleur.
-- ---------------------------------------------------------------------------

-- 1. Motif de refus -----------------------------------------------------------
create type public.rejection_reason as enum (
  'cannot_make',            -- ne sait pas / ne peut pas faire ce modèle
  'too_busy',               -- trop chargé en ce moment
  'cannot_deliver_in_time'  -- ne peut pas livrer dans les délais
);

alter table public.orders
  add column rejection_reason public.rejection_reason;

-- 3. Prix par modèle ----------------------------------------------------------
-- Null = pas de tarif propre : on retombe sur le `base_price` du tailleur.
alter table public.models
  add column price numeric(10, 2);

-- 2. Notification de refus au client -----------------------------------------
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

create trigger orders_notify_client_rejected
  after update of status on public.orders
  for each row execute function public.notify_client_order_rejected();
