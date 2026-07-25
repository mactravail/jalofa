-- ---------------------------------------------------------------------------
-- Livraison offerte par le vendeur de tissu.
--
-- Pendant du champ `tailors.free_delivery` : le vendeur peut indiquer qu'il
-- prend la livraison à sa charge. Affiché sur sa fiche publique et, à la
-- caisse, les frais de livraison à domicile ne sont pas facturés au client
-- pour une commande de tissu seul servie par ce vendeur.
-- ---------------------------------------------------------------------------
alter table public.vendors
  add column if not exists free_delivery boolean not null default false;
