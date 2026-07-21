-- ---------------------------------------------------------------------------
-- Contact details captured at checkout.
--
-- Collected for every order, not only home deliveries: a pickup order still
-- needs an identified person to hand the piece to, and the addresses table
-- (which used to carry the name/phone) is only written for home delivery.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column contact_first_name text,
  add column contact_last_name text,
  add column contact_email text,
  add column contact_phone text;
