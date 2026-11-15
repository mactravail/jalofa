-- Fiche produit « Tissu » complète (2026-11-14).
--
-- Le vendeur décrit son tissu comme un professionnel : unité de vente (mètre,
-- yard, pagne de 2 yards, complet de 6 yards), laize, quantité minimum,
-- composition, marque / origine, épaisseur, opacité, tombé, élasticité, motif,
-- finition, entretien, usages conseillés et une 2e photo (gros plan du tissage).
--
-- Prix : `price_per_unit` est le prix saisi par le vendeur pour SON unité.
-- `price_per_meter` reste la colonne de calcul de tout le site (configurateur,
-- caisse) : pour un tissu vendu au yard / pagne / complet, il est dérivé
-- (prix de l'unité ÷ mètres de l'unité). `stock_meters` devient le stock dans
-- l'unité de vente.
--
-- Idempotent : à coller tel quel dans le SQL Editor. À APPLIQUER AVANT le
-- déploiement (le formulaire vendeur écrit ces colonnes).

alter table public.fabrics
  add column if not exists sales_unit text not null default 'METER',
  add column if not exists price_per_unit numeric(10, 2),
  add column if not exists width_cm int,
  add column if not exists min_order_qty numeric(6, 2) not null default 1,
  add column if not exists composition text,
  add column if not exists origin_brand text,
  add column if not exists weight text,
  add column if not exists grammage_gsm int,
  add column if not exists opacity text,
  add column if not exists drape text,
  add column if not exists stretch text,
  add column if not exists pattern text,
  add column if not exists finish text,
  add column if not exists care_instructions text[] not null default '{}',
  add column if not exists recommended_usages text[] not null default '{}',
  add column if not exists detail_image_url text;

alter table public.fabrics drop constraint if exists fabrics_sales_unit_check;
alter table public.fabrics add constraint fabrics_sales_unit_check
  check (sales_unit in ('METER', 'YARD', 'PAGNE_2_YARDS', 'COMPLET_6_YARDS'));

alter table public.fabrics drop constraint if exists fabrics_weight_check;
alter table public.fabrics add constraint fabrics_weight_check
  check (weight is null or weight in ('LIGHT', 'MEDIUM', 'HEAVY'));

alter table public.fabrics drop constraint if exists fabrics_opacity_check;
alter table public.fabrics add constraint fabrics_opacity_check
  check (opacity is null or opacity in ('OPAQUE', 'SEMI_SHEER', 'SHEER'));

alter table public.fabrics drop constraint if exists fabrics_drape_check;
alter table public.fabrics add constraint fabrics_drape_check
  check (drape is null or drape in ('FLUID', 'SEMI_STRUCTURED', 'RIGID'));

alter table public.fabrics drop constraint if exists fabrics_stretch_check;
alter table public.fabrics add constraint fabrics_stretch_check
  check (stretch is null or stretch in ('NONE', 'SLIGHT', 'HIGH'));

alter table public.fabrics drop constraint if exists fabrics_pattern_check;
alter table public.fabrics add constraint fabrics_pattern_check
  check (pattern is null or pattern in
    ('SOLID', 'GEOMETRIC', 'FLORAL', 'STRIPED', 'EMBROIDERED', 'DAMASK'));

alter table public.fabrics drop constraint if exists fabrics_width_check;
alter table public.fabrics add constraint fabrics_width_check
  check (width_cm is null or width_cm between 30 and 400);

alter table public.fabrics drop constraint if exists fabrics_min_order_check;
alter table public.fabrics add constraint fabrics_min_order_check
  check (min_order_qty > 0 and min_order_qty <= 30);

-- Les tissus existants sont vendus au mètre : leur prix d'unité est leur prix au mètre.
update public.fabrics set price_per_unit = price_per_meter where price_per_unit is null;

create index if not exists fabrics_weight_idx on public.fabrics(weight);
create index if not exists fabrics_usages_idx on public.fabrics using gin (recommended_usages);

-- Catégories de tissu : la liste complète, du plus vendu au Sénégal au plus
-- rare. Upsert : noms et ordre remis à jour, les slugs existants (laine, coton,
-- lin, wax, bazin) gardés — les tissus déjà classés ne bougent pas.
insert into public.fabric_categories (slug, name, sort_order) values
  ('wax', 'Wax', 1),
  ('bazin', 'Bazin riche', 2),
  ('bazin-semi-riche', 'Bazin semi-riche', 3),
  ('getzner', 'Bazin Getzner', 4),
  ('thioup', 'Thioup (teinture artisanale)', 5),
  ('pagne-tisse', 'Pagne tissé (Manjak, Kita…)', 6),
  ('kente', 'Kente', 7),
  ('bogolan', 'Bogolan', 8),
  ('faso-dan-fani', 'Faso Dan Fani', 9),
  ('lepi', 'Lépi (indigo)', 10),
  ('brode', 'Tissu brodé', 11),
  ('dentelle', 'Dentelle', 12),
  ('guipure', 'Guipure', 13),
  ('brocart', 'Brocart / Jacquard', 14),
  ('soie', 'Soie', 15),
  ('satin', 'Satin', 16),
  ('mousseline', 'Mousseline', 17),
  ('organza', 'Organza / Tulle', 18),
  ('voile', 'Voile', 19),
  ('velours', 'Velours', 20),
  ('crepe', 'Crêpe', 21),
  ('lin', 'Lin', 22),
  ('coton', 'Coton', 23),
  ('popeline', 'Popeline', 24),
  ('laine', 'Laine', 25),
  ('tergal', 'Tergal / Gabardine', 26),
  ('jean', 'Jean / Denim', 27),
  ('viscose', 'Viscose', 28),
  ('paillete', 'Pailleté / Lurex', 29),
  ('synthetique', 'Synthétique', 30),
  ('autre', 'Autre', 99)
on conflict (slug) do update
  set name = excluded.name, sort_order = excluded.sort_order;
