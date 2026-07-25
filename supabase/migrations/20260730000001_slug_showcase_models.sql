-- Tuiles « Collection » de la home : slugs manquants & vêtements absents.
--
-- Les tuiles de la home (src/components/home/*-collection.tsx) pointent chaque
-- vêtement par son `slug` stable via /modeles/[slug]. Or seuls 5 modèles avaient
-- un slug en prod (cf. 20260722000001) et 4 vêtements présentés n'existaient pas
-- du tout en base — d'où des 404 sur /modeles/chemise, /modeles/costume, etc.
--
-- Ici on : (1) pose le slug sur les modèles présentés déjà seedés ; (2) insère
-- les 4 vêtements manquants (Relax, Cérémonie femme, Tailleur Pantalon, Thiaya
-- femme) avec leur slug, image et galerie. Idempotent : slugs posés seulement
-- s'ils manquent, inserts gardés par `not exists`.

-- 1. Slugs des modèles présentés déjà en base (name + category pour éviter les
--    collisions homme/femme de même nom).
update public.models set slug = 'kaftan'   where name = 'Kaftan'            and category_slug = 'homme' and slug is null;
update public.models set slug = 'chemise'  where name = 'Chemise Africaine' and category_slug = 'homme' and slug is null;
update public.models set slug = 'costume'  where name = 'Costume'           and category_slug = 'homme' and slug is null;
update public.models set slug = 'ensemble' where name = 'Ensemble'          and category_slug = 'femme' and slug is null;

-- 2. Vêtements présentés absents de la base.
insert into public.models (name, category_slug, description, difficulty, avg_days, image_url, slug)
select 'Relax', 'homme',
  'Tenue décontractée : tunique fluide et pantalon confort, coupe ample facile à vivre, du week-end aux moments détente.',
  'facile', 6, '/collection%20homme/e.jpg', 'relax'
where not exists (select 1 from public.models where slug = 'relax');

insert into public.models (name, category_slug, description, difficulty, avg_days, image_url, slug)
select 'Tenue de Cérémonie', 'femme',
  'Grande tenue de cérémonie, broderie riche et finitions soignées, pour mariages, baptêmes et grandes fêtes.',
  'difficile', 12, '/collection%20femme/ceremonie/f.avif', 'ceremonie-femme'
where not exists (select 1 from public.models where slug = 'ceremonie-femme');

insert into public.models (name, category_slug, description, difficulty, avg_days, image_url, slug)
select 'Tailleur Pantalon', 'femme',
  'Tailleur deux-pièces — veste ajustée et pantalon assorti — l''allure business au féminin.',
  'difficile', 12, '/collection%20femme/pantalon/v.avif', 'tailleur-pantalon'
where not exists (select 1 from public.models where slug = 'tailleur-pantalon');

insert into public.models (name, category_slug, description, difficulty, avg_days, image_url, slug)
select 'Thiaya', 'femme',
  'Thiaya — tenue traditionnelle africaine deux-pièces : haut ajusté et jupe droite taille basse, brodée, élégante du quotidien aux fêtes.',
  'moyen', 9, '/collection%20femme/thiaya/thiaya%20femme.jpg', 'thiaya-femme'
where not exists (select 1 from public.models where slug = 'thiaya-femme');

-- 3. Galeries des nouveaux vêtements (le vêtement seul, puis les variantes).
--    `model_photos` n'a pas de contrainte d'unicité : on garde l'insert par
--    `not exists` (le modèle n'a encore aucune photo) pour rester idempotent.
insert into public.model_photos (model_id, image_url, sort_order)
select m.id, p.image_url, p.sort_order
from public.models m
join (values
  ('ceremonie-femme', '/collection%20femme/ceremonie/f.avif', 0),
  ('ceremonie-femme', '/collection%20femme/ceremonie/f1.avif', 1),
  ('ceremonie-femme', '/collection%20femme/ceremonie/f3.avif', 2),
  ('tailleur-pantalon', '/collection%20femme/pantalon/v.avif', 0),
  ('tailleur-pantalon', '/collection%20femme/pantalon/v1.avif', 1),
  ('tailleur-pantalon', '/collection%20femme/pantalon/v2.avif', 2),
  ('tailleur-pantalon', '/collection%20femme/pantalon/v3.avif', 3),
  ('thiaya-femme', '/collection%20femme/thiaya/thiaya%20femme.jpg', 0)
) as p(model_slug, image_url, sort_order) on p.model_slug = m.slug
where not exists (select 1 from public.model_photos mp where mp.model_id = m.id);

-- 4. Chaque nouveau modèle disponible dans tous les styles (comme le seed MVP).
insert into public.model_styles (model_id, style_slug)
select m.id, s.slug
from public.models m cross join public.styles s
where m.slug in ('relax', 'ceremonie-femme', 'tailleur-pantalon', 'thiaya-femme')
on conflict do nothing;
