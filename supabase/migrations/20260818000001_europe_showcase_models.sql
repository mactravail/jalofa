-- JALOFA EUROPE : une fiche vêtement par tuile de /europe.
--
-- Chaque photo de la page /europe mène à /modeles/europe-<catégorie> : la fiche
-- où le client prend le vêtement tel quel (prêt-à-porter, taille seulement) ou
-- le personnalise sur mesure. Ce sont des modèles de la plateforme
-- (`tailor_id` null), comme le Grand Boubou ou le Kaftan.
--
-- Idempotent : chaque insert est gardé par `not exists` sur le slug.
-- Prérequis : 20260817000001_jalofa_europe.sql (colonnes europe_type, making_type).

insert into public.models
  (name, category_slug, description, difficulty, avg_days, image_url, slug, europe_type, making_type)
select v.name, v.category_slug, v.description, v.difficulty, v.avg_days, v.image_url, v.slug, v.europe_type, 'les_deux'
from (values
  ('Robe de mariage', 'femme',
   'La robe du plus beau jour : coupée pour votre corps, dans la dentelle et la soie de votre choix. Tous les regards seront pour vous.',
   'difficile', 21, '/europe%20collection/robe-mariee.jpg', 'europe-robe-mariage', 'robe-mariage'),
  ('Robe', 'femme',
   'Une robe qui épouse votre silhouette et vous rend sûre de vous, du matin au soir.',
   'moyen', 10, '/europe%20collection/robe.jpg', 'europe-robe', 'robe'),
  ('Robe de soirée', 'femme',
   'La robe qui fait tourner les têtes : longue, élégante, ajustée à vos mesures pour vos grandes soirées.',
   'difficile', 14, '/europe%20collection/abito-da-sera.jpg', 'europe-robe-soiree', 'robe-soiree'),
  ('Costume', 'homme',
   'Le costume qui inspire confiance dès la poignée de main. Coupé à vos mesures dans un beau tissu européen.',
   'difficile', 14, '/europe%20collection/costume-h.jpg', 'europe-costume-homme', 'costume-homme'),
  ('Smoking', 'homme',
   'Le smoking des grandes soirées : col satiné, coupe impeccable, taillé pour vous.',
   'difficile', 14, '/europe%20collection/smoking.jpg', 'europe-smoking-homme', 'smoking-homme'),
  ('Ensemble tailleur', 'femme',
   'Veste ajustée et pantalon assorti : l''allure des femmes qui dirigent.',
   'difficile', 12, '/europe%20collection/tay.jpg', 'europe-costume-femme', 'costume-femme'),
  ('Chemise homme', 'homme',
   'Une chemise qui tombe parfaitement, au col et aux poignets. Pour le bureau comme pour le week-end.',
   'facile', 7, '/europe%20collection/chemise-h.jpg', 'europe-chemise-homme', 'chemise-homme'),
  ('Chemise femme', 'femme',
   'Une chemise fluide et nette, coupée à vos mesures, qui se porte partout.',
   'facile', 7, '/europe%20collection/chemise-f.jpg', 'europe-chemise-femme', 'chemise-femme'),
  ('Tenue détente', 'femme',
   'Confort et allure pour l''after-work et le week-end, dans une matière douce.',
   'facile', 7, '/europe%20collection/afterwork.jpg', 'europe-detente-femme', 'detente-femme')
) as v(name, category_slug, description, difficulty, avg_days, image_url, slug, europe_type)
where not exists (select 1 from public.models m where m.slug = v.slug);

-- La photo de la tuile devient la première photo de la fiche.
insert into public.model_photos (model_id, image_url, sort_order)
select m.id, m.image_url, 0
from public.models m
where m.slug like 'europe-%'
  and not exists (select 1 from public.model_photos mp where mp.model_id = m.id);

-- Disponibles dans tous les styles, comme les autres modèles de la plateforme.
insert into public.model_styles (model_id, style_slug)
select m.id, s.slug
from public.models m cross join public.styles s
where m.slug like 'europe-%'
on conflict do nothing;
