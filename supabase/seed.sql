-- =============================================================================
-- JALOFA — Seed reference data (idempotent)
-- Catalog data that does not depend on a user account.
-- =============================================================================

-- Fabric categories ---------------------------------------------------------
insert into public.fabric_categories (slug, name, sort_order) values
  ('laine', 'Laine', 1),
  ('coton', 'Coton', 2),
  ('lin', 'Lin', 3)
on conflict (slug) do nothing;

-- Model categories ----------------------------------------------------------
insert into public.model_categories (slug, name, gender, sort_order) values
  ('homme', 'Homme', 'homme', 1),
  ('femme', 'Femme', 'femme', 2),
  ('enfant', 'Enfant', 'enfant', 3)
on conflict (slug) do nothing;

-- Styles --------------------------------------------------------------------
insert into public.styles (slug, name, sort_order) values
  ('moderne', 'Moderne', 1),
  ('traditionnel', 'Traditionnel', 2),
  ('elegant', 'Élégant', 3),
  ('mariage', 'Mariage', 4),
  ('casual', 'Casual', 5),
  ('luxe', 'Luxe', 6)
on conflict (slug) do nothing;

-- Models (garment templates) ------------------------------------------------
insert into public.models (name, category_slug, description, difficulty, avg_days, image_url) values
  ('Grand Boubou', 'homme', 'Ample tenue traditionnelle en trois pièces, symbole d''élégance.', 'moyen', 10, '/models/grand-boubou.jpg'),
  ('Kaftan', 'homme', 'Tunique longue et fluide, confortable et raffinée.', 'facile', 7, '/models/kaftan.jpg'),
  ('Chemise Africaine', 'homme', 'Chemise à motifs, coupe moderne ou classique.', 'facile', 5, '/models/chemise.jpg'),
  ('Costume', 'homme', 'Costume sur mesure, veste et pantalon.', 'difficile', 14, '/models/costume.jpg'),
  ('Ensemble Bazin', 'homme', 'Ensemble deux-pièces en bazin riche : haut brodé et pantalon assorti, l''élégance sénégalaise du quotidien aux grandes occasions.', 'moyen', 9, '/collection%20homme/senegalais.jpg'),
  ('Agbada', 'homme', 'Grande robe d''apparat brodée, portée sur un boubou et un pantalon — la pièce maîtresse des cérémonies ouest-africaines.', 'difficile', 12, '/collection%20homme/nigerien.jpg'),
  ('Kaftan Brodé', 'homme', 'Kaftan tunique longue rehaussée de broderies au col et au plastron, raffiné pour les fêtes et le vendredi.', 'moyen', 8, '/collection%20homme/katan%20ghana.jpg'),
  ('Tenue de Cérémonie', 'homme', 'Grand ensemble de cérémonie, broderie riche et finitions soignées, pour mariages, baptêmes et grandes fêtes.', 'difficile', 12, '/collection%20homme/presi.jpg'),
  ('Costume Africain', 'homme', 'Costume à coupe africaine — veste col Mao ou Senghor et pantalon — l''allure business, en tissu local ou importé.', 'difficile', 12, '/collection%20homme/bureau.jpg'),
  ('Veste Africaine', 'homme', 'Veste-blazer d''inspiration africaine, à porter sur une chemise ou un tee-shirt pour un style habillé décontracté.', 'moyen', 8, '/collection%20homme/paxy.jpg'),
  ('Gilet', 'homme', 'Gilet sans manches, brodé ou uni, porté seul ou sur une chemise pour structurer la silhouette.', 'facile', 5, '/collection%20homme/gilet.avif'),
  ('Pantalon', 'homme', 'Pantalon sur mesure — droit, cintré ou large façon saroual — en tissu au choix, seul ou pour compléter un ensemble.', 'facile', 5, '/collection%20homme/pantalon.avif'),
  ('Dashiki', 'homme', 'Tunique ample à enfiler, col brodé et motifs colorés — l''esprit panafricain, décontracté et festif.', 'facile', 5, '/collection%20homme/e.jpg'),
  ('Baye Lahat', 'homme', 'Grand boubou traditionnel à la coupe Baye Lahat, ample et solennel, prisé pour les grandes cérémonies religieuses.', 'difficile', 12, '/collection%20homme/a3.avif'),
  ('Thiaya', 'homme', 'Pantalon traditionnel sénégalais, taille haute et coupe ample, porté sous le boubou ou le kaftan.', 'facile', 5, '/collection%20homme/d.avif'),
  ('Robe', 'femme', 'Robe sur mesure, du quotidien à la cérémonie.', 'moyen', 9, '/models/robe.jpg'),
  ('Ensemble', 'femme', 'Ensemble coordonné haut et bas.', 'moyen', 8, '/models/ensemble.jpg'),
  ('Jupe', 'femme', 'Jupe sur mesure, plusieurs longueurs et coupes.', 'facile', 5, '/models/jupe.jpg'),
  ('Boubou Femme', 'femme', 'Boubou féminin élégant, brodé ou uni.', 'moyen', 10, '/models/boubou-femme.jpg'),
  ('Boubou Enfant', 'enfant', 'Boubou pour enfant, coupe confortable.', 'facile', 5, '/models/boubou-enfant.jpg'),
  ('Ensemble Enfant', 'enfant', 'Ensemble assorti pour enfant.', 'facile', 5, '/models/ensemble-enfant.jpg')
on conflict do nothing;

-- Slugs des ancres à page dédiée (grand boubou, robe & co.). C'est ce slug —
-- pas l'`id` UUID — que le front utilise pour résoudre un modèle et rediriger
-- /modeles/[id] vers sa famille (cf. src/lib/garment-routes.ts).
update public.models set slug = 'grand-boubou' where name = 'Grand Boubou' and slug is null;
update public.models set slug = 'agbada'       where name = 'Agbada'       and slug is null;
update public.models set slug = 'baye-lahat'   where name = 'Baye Lahat'   and slug is null;
update public.models set slug = 'robe'         where name = 'Robe'         and slug is null;
update public.models set slug = 'boubou-femme' where name = 'Boubou Femme' and slug is null;

-- Model galleries -----------------------------------------------------------
-- Ordre d'affichage : le vêtement seul, puis porté (devant, dos), puis les
-- détails. Photos servies depuis /public/collection homme|femme — l'espace du
-- dossier est encodé dans l'URL. Les modèles absents n'ont pas encore de
-- galerie et retombent sur `models.image_url`.
insert into public.model_photos (model_id, image_url, sort_order)
select m.id, p.image_url, p.sort_order
from public.models m
join (values
  ('Grand Boubou', '/collection%20homme/a1.avif', 0),
  ('Grand Boubou', '/collection%20homme/a.avif', 1),
  ('Grand Boubou', '/collection%20homme/a2.avif', 2),
  ('Grand Boubou', '/collection%20homme/a4.avif', 3),
  ('Kaftan', '/collection%20homme/c1.avif', 0),
  ('Kaftan', '/collection%20homme/c.avif', 1),
  ('Kaftan', '/collection%20homme/c2.avif', 2),
  ('Chemise Africaine', '/collection%20homme/b1.avif', 0),
  ('Chemise Africaine', '/collection%20homme/b.avif', 1),
  ('Chemise Africaine', '/collection%20homme/b2.avif', 2),
  ('Chemise Africaine', '/collection%20homme/b3.avif', 3),
  ('Chemise Africaine', '/collection%20homme/chemise.avif', 4),
  ('Costume', '/collection%20homme/k1.avif', 0),
  ('Costume', '/collection%20homme/k.avif', 1),
  ('Costume', '/collection%20homme/k2.avif', 2),
  ('Pantalon', '/collection%20homme/pantalon.avif', 0),
  ('Pantalon', '/collection%20homme/panta.avif', 1),
  ('Robe', '/collection%20femme/w.avif', 0),
  ('Robe', '/collection%20femme/w1.avif', 1),
  ('Robe', '/collection%20femme/w2.avif', 2),
  ('Ensemble', '/collection%20femme/o.avif', 0),
  ('Ensemble', '/collection%20femme/o1.avif', 1),
  ('Jupe', '/collection%20femme/q.avif', 0),
  ('Jupe', '/collection%20femme/q1.avif', 1),
  ('Boubou Femme', '/collection%20femme/f2.avif', 0),
  ('Boubou Femme', '/collection%20femme/f1.avif', 1),
  ('Boubou Femme', '/collection%20femme/f3.avif', 2)
) as p(model_name, image_url, sort_order) on p.model_name = m.name
on conflict do nothing;

-- Every model is available in every style for the MVP catalog.
insert into public.model_styles (model_id, style_slug)
select m.id, s.slug from public.models m cross join public.styles s
on conflict do nothing;

-- Demo fabrics (no vendor yet — replaced by real vendor listings later) ------
-- Swatch photos are served from /public/fabrics.
insert into public.fabrics (name, category_slug, color, material, price_per_meter, description, stock_meters, image_url) values
  ('Laine Mérinos Vert Forêt', 'laine', 'Vert forêt', 'Laine mérinos', 12000, 'Laine mérinos au tissage serré, teinte vert forêt profonde.', 60, '/fabrics/1.jpg'),
  ('Tweed Gris Chiné', 'laine', 'Gris chiné', 'Laine (tweed)', 11000, 'Tweed de laine gris chiné, texture chaude et structurée.', 45, '/fabrics/2.jpg'),
  ('Coton Sergé Bleu Marine', 'coton', 'Bleu marine', 'Coton sergé', 4500, 'Sergé de coton bleu marine, mat et résistant, coupe nette.', 130, '/fabrics/3.jpg'),
  ('Tweed à Carreaux Beige', 'laine', 'Beige', 'Laine (tweed)', 12500, 'Tweed à carreaux beige et bleu clair, esprit sport chic.', 40, '/fabrics/4.jpg'),
  ('Laine Bleu Royal', 'laine', 'Bleu royal', 'Laine', 13000, 'Laine bleu royal au micro-motif œil-de-perdrix, éclat discret.', 50, '/fabrics/5.jpg'),
  ('Flanelle Bleu Ardoise', 'laine', 'Bleu ardoise', 'Laine (flanelle)', 11500, 'Flanelle de laine bleu ardoise, toucher doux et fine rayure ton sur ton.', 55, '/fabrics/6.jpg'),
  ('Popeline Blanche', 'coton', 'Blanc', 'Coton', 3800, 'Popeline de coton blanche, indispensable pour chemises habillées.', 160, '/fabrics/7.jpg'),
  ('Popeline Gris Perle', 'coton', 'Gris perle', 'Coton', 3800, 'Popeline de coton gris perle, lumineuse et facile à porter.', 140, '/fabrics/8.jpg'),
  ('Sergé Bordeaux', 'laine', 'Bordeaux', 'Laine sergé', 10500, 'Sergé de laine bordeaux au tissage diagonal, profond et élégant.', 50, '/fabrics/9.jpg'),
  ('Seersucker Rayé Vert', 'coton', 'Vert', 'Coton (seersucker)', 5000, 'Seersucker de coton à rayures vertes, gaufré et respirant pour la chaleur.', 90, '/fabrics/10.jpg'),
  ('Lin Terracotta', 'lin', 'Terracotta', 'Lin', 6500, 'Lin terracotta au grain naturel, léger et respirant.', 80, '/fabrics/11.jpg'),
  ('Laine Prune', 'laine', 'Prune', 'Laine', 12000, 'Laine unie couleur prune, tombé souple et raffiné.', 45, '/fabrics/12.jpg'),
  ('Lin Vert Olive', 'lin', 'Vert olive', 'Lin', 6500, 'Lin vert olive au grain naturel, idéal pour les tenues d''été.', 75, '/fabrics/13.jpg'),
  ('Popeline Rose Poudré', 'coton', 'Rose', 'Coton', 3800, 'Popeline de coton rose poudré, douce et lumineuse.', 120, '/fabrics/14.jpg')
on conflict do nothing;
