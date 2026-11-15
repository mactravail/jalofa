-- Catégories de tissu : Wax et Bazin, les tissus les plus vendus au Sénégal
-- (2026-11-13). Idempotent.
insert into public.fabric_categories (slug, name, sort_order) values
  ('wax', 'Wax', 4),
  ('bazin', 'Bazin', 5)
on conflict (slug) do nothing;
