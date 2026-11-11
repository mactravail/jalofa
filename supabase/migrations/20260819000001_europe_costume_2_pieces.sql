-- JALOFA EUROPE : le Costume 2 pièces homme (veste + pantalon) remplace la
-- tuile « Tenues de travail » sur /europe. Sa fiche : /modeles/europe-costume-2p-homme
-- (Tel quel ou Sur mesure, planches du costume 3 pièces sans le gilet).
--
-- Idempotent. À lancer APRÈS 20260818000001_europe_showcase_models.sql.

-- 1. La nouvelle catégorie (on garde 'travail-femme' : des fiches peuvent l'utiliser).
alter table public.models drop constraint if exists models_europe_type_check;
alter table public.models
  add constraint models_europe_type_check
  check (europe_type is null or europe_type in (
    'robe-mariage', 'costume-homme', 'costume-femme', 'chemise-homme', 'chemise-femme',
    'smoking-homme', 'robe', 'robe-soiree', 'travail-femme', 'detente-femme',
    'costume-2p-homme'
  ));

-- 2. La fiche vêtement de la plateforme.
insert into public.models
  (name, category_slug, description, difficulty, avg_days, image_url, slug, europe_type, making_type)
select 'Costume 2 pièces', 'homme',
  'Veste et pantalon assortis, coupés à vos mesures dans un beau tissu européen. Net au bureau, élégant le soir.',
  'difficile', 12, '/europe%20collection/2-pieces.jpg', 'europe-costume-2p-homme', 'costume-2p-homme', 'les_deux'
where not exists (select 1 from public.models m where m.slug = 'europe-costume-2p-homme');

-- 3. Sa photo et ses styles, comme les autres fiches Europe.
insert into public.model_photos (model_id, image_url, sort_order)
select m.id, m.image_url, 0
from public.models m
where m.slug = 'europe-costume-2p-homme'
  and not exists (select 1 from public.model_photos mp where mp.model_id = m.id);

insert into public.model_styles (model_id, style_slug)
select m.id, s.slug
from public.models m cross join public.styles s
where m.slug = 'europe-costume-2p-homme'
on conflict do nothing;
