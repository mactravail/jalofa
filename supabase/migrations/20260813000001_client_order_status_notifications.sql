-- Le client est prévenu à chaque étape de sa commande.
--
-- Déjà couvert ailleurs : refus (`notify_client_order_rejected`), devis prêt
-- (`notify_quote_flow`), voyage du tissu (`notify_fabric_journey`). Ici : la
-- commande acceptée, la couture qui commence, la tenue en route, la livraison.
-- Idempotent : peut être rejoué sans risque.

begin;

create or replace function public.notify_client_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  link text := '/compte/commandes/' || new.id;
begin
  if new.status is not distinct from old.status or new.client_id is null then
    return new;
  end if;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_accepted', 'Commande acceptée',
            'Code ' || new.order_number || ' : votre tailleur a accepté votre commande.',
            link, new.id);

  elsif new.status in ('in_production', 'sewing')
        and old.status not in ('in_production', 'sewing') then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_sewing', 'La couture a commencé',
            'Code ' || new.order_number || ' : votre tenue est entre les mains du tailleur.',
            link, new.id);

  elsif new.status = 'shipped' then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_shipped', 'Votre commande est en route',
            'Code ' || new.order_number || ' : elle arrive bientôt chez vous.',
            link, new.id);

  elsif new.status = 'delivered' then
    insert into public.notifications (user_id, type, title, body, link, order_id)
    values (new.client_id, 'order_delivered', 'Commande livrée',
            'Code ' || new.order_number || ' : bonne tenue ! Donnez votre avis.',
            link, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists orders_notify_client_status on public.orders;
create trigger orders_notify_client_status
  after update of status on public.orders
  for each row execute function public.notify_client_order_status();

commit;
