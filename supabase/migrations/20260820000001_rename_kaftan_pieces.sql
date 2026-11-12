-- Renomme les deux kaftans vitrine (tailor_id null) selon leur nombre de pièces :
--   « Kaftan »       → « Kaftan 2 pièces » (tunique + pantalon)
--   « Kaftan Brodé » → « Kaftan 3 pièces » (tunique + gilet + pantalon)
-- Idempotent : ne touche que les anciens noms. Les slugs ne changent pas.
update public.models set name = 'Kaftan 2 pièces'
 where name = 'Kaftan' and category_slug = 'homme' and tailor_id is null;

update public.models set name = 'Kaftan 3 pièces'
 where name = 'Kaftan Brodé' and category_slug = 'homme' and tailor_id is null;
