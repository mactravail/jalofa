-- Stock des tissus décompté à chaque vente payée.
--
-- `fabrics.stock_meters` contient le stock dans l'unité de vente du vendeur
-- (mètre, yard, pagne, complet — cf. 20260901000001). Quand une commande qui
-- utilise un tissu du catalogue passe « payée », on retire du stock la quantité
-- achetée (mètres de la commande ÷ longueur d'une unité). À zéro, le tissu
-- passe « épuisé » (`in_stock = false`) : le site ne le vend plus jusqu'à ce que
-- le vendeur renseigne un nouveau stock.
--
-- Un stock à 0 au moment de la vente = stock non suivi (ancien tissu publié sans
-- quantité) : rien n'est décompté, le vendeur garde la main avec « Épuisé ».
--
-- Idempotent : à coller tel quel dans le SQL Editor, APRÈS 20260901000001.

alter table public.fabrics
  add column if not exists sales_unit text not null default 'METER';
alter table public.fabrics
  add column if not exists in_stock boolean not null default true;

-- Par couleur, facultatif : { "Bleu ciel": { "price": 1500, "image_url": "…" } }.
-- Sans entrée, la couleur se vend au prix et à la photo du tissu.
alter table public.fabrics
  add column if not exists color_variants jsonb not null default '{}'::jsonb;

create or replace function public.decrement_fabric_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unit_m numeric;
begin
  if new.fabric_id is null or coalesce(new.fabric_meters, 0) <= 0 then
    return new;
  end if;
  if new.payment_status is distinct from 'paid' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.payment_status is not distinct from 'paid' then
    return new;
  end if;

  select case f.sales_unit
           when 'YARD' then 0.9144
           when 'PAGNE_2_YARDS' then 1.8288
           when 'COMPLET_6_YARDS' then 5.4864
           else 1
         end
    into unit_m
    from public.fabrics f
   where f.id = new.fabric_id
     for update;

  if unit_m is null then
    return new;
  end if;

  update public.fabrics f
     set stock_meters = greatest(0, round(f.stock_meters - new.fabric_meters / unit_m, 2)),
         in_stock = case
                      when f.stock_meters - new.fabric_meters / unit_m <= 0.01 then false
                      else f.in_stock
                    end
   where f.id = new.fabric_id
     and f.stock_meters > 0;

  return new;
end;
$$;

revoke all on function public.decrement_fabric_stock() from public, anon, authenticated;

drop trigger if exists orders_decrement_fabric_stock on public.orders;
create trigger orders_decrement_fabric_stock
  after insert or update of payment_status on public.orders
  for each row execute function public.decrement_fabric_stock();
