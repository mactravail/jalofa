-- JALOFA EUROPE — une section de JALOFA, pas une base parallèle.
--
-- Uniquement des AJOUTS, idempotents (rejouables sans risque). Aucune donnée
-- existante n'est modifiée : tous les pros actuels restent « Sénégal », tous les
-- produits actuels gardent leurs valeurs.
--
-- 1. `tailors.country` / `vendors.country` : le pays de l'atelier ou de la
--    boutique. Un pays d'Europe (liste dans `src/lib/europe.ts`) range
--    automatiquement les produits du pro dans JALOFA EUROPE.
-- 2. `models` : la catégorie européenne (5 au lancement), la matière, le type de
--    confection et les tailles disponibles. Tous facultatifs.
-- 3. Une zone de livraison « europe » (gratuite dans toute l'Europe).
--
-- À appliquer dans le SQL Editor AVANT de déployer le code (le catalogue lit
-- ces colonnes).

-- 1. Le pays des pros ---------------------------------------------------------
alter table public.tailors
  add column if not exists country text not null default 'Sénégal';
alter table public.vendors
  add column if not exists country text not null default 'Sénégal';

create index if not exists tailors_country_idx on public.tailors(country);
create index if not exists vendors_country_idx on public.vendors(country);

-- 2. Les fiches produit européennes -------------------------------------------
alter table public.models add column if not exists europe_type text;
alter table public.models drop constraint if exists models_europe_type_check;
alter table public.models
  add constraint models_europe_type_check
  check (europe_type is null or europe_type in (
    'robe-mariage', 'costume-homme', 'costume-femme', 'chemise-homme', 'chemise-femme',
    'smoking-homme', 'robe', 'robe-soiree', 'travail-femme', 'detente-femme'
  ));

alter table public.models add column if not exists material text;

alter table public.models add column if not exists making_type text;
alter table public.models drop constraint if exists models_making_type_check;
alter table public.models
  add constraint models_making_type_check
  check (making_type is null or making_type in ('sur_mesure', 'pret_a_porter', 'les_deux'));

-- Texte libre : « S, M, L, XL » ou « 38 à 56 ».
alter table public.models add column if not exists sizes text;

create index if not exists models_europe_type_idx on public.models(europe_type);

-- 3. La zone de livraison « europe » ------------------------------------------
alter table public.models drop constraint if exists models_delivery_zone_check;
alter table public.models
  add constraint models_delivery_zone_check
  check (delivery_zone in ('none', 'dakar', 'senegal', 'europe', 'world'));

alter table public.fabrics drop constraint if exists fabrics_delivery_zone_check;
alter table public.fabrics
  add constraint fabrics_delivery_zone_check
  check (delivery_zone in ('none', 'dakar', 'senegal', 'europe', 'world'));
