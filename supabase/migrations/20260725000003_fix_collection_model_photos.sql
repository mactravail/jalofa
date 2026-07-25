-- Réaligne la photo « portrait » de chaque modèle homme sur le fichier
-- correctement nommé dans /public/collection homme/style/ (chaque fichier y
-- porte le nom exact du vêtement, ex. « baye lahat.jpg », « thiaya.jpg »).
-- Corrige au passage les anciens chemins qui pointaient vers des fichiers
-- désormais absents (senegalais/nigerien/presi/bureau/paxy/katan/d/a3…).
-- À exécuter tel quel dans le SQL Editor Supabase (mise à jour de données, pas de DDL).

update public.models set image_url = '/collection%20homme/style/grand%20boubou.jpg'         where name = 'Grand Boubou'       and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/kaftan.avif'                where name = 'Kaftan'             and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/chemise.avif'               where name = 'Chemise Africaine'  and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/costume%20crois%C3%A9.jpg'  where name = 'Costume'            and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/grand%20boubou%20ghana.avif' where name = 'Ensemble Bazin'     and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/agbada.jpg'                 where name = 'Agbada'             and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/kaftan%20ghana.jpg'         where name = 'Kaftan Brodé'       and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/diomaye.jpg'                where name = 'Tenue de Cérémonie' and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/costume%20africain%20(2).jpg' where name = 'Costume Africain'  and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/pantalon%20veste.avif'      where name = 'Veste Africaine'    and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/gilet.avif'                 where name = 'Gilet'              and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/pantalon.avif'              where name = 'Pantalon'           and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/baye%20lahat.jpg'           where name = 'Baye Lahat'         and category_slug = 'homme';
update public.models set image_url = '/collection%20homme/style/thiaya.jpg'                 where name = 'Thiaya'             and category_slug = 'homme';

-- Galerie (model_photos) : retire / remplace les vignettes cassées.
update public.model_photos set image_url = '/collection%20homme/a3.avif'          where image_url = '/collection%20homme/a.avif';
delete from public.model_photos                                                   where image_url = '/collection%20homme/chemise.avif';
update public.model_photos set image_url = '/collection%20homme/style/pantalon.avif' where image_url = '/collection%20homme/pantalon.avif';
delete from public.model_photos                                                   where image_url = '/collection%20homme/panta.avif';


-- ---------------------------------------------------------------------------
-- Collection femme : un sous-dossier par type de vêtement (robe, jupe,
-- ceremonie…). Une lettre = un modèle ; lettre + chiffre = une variante.
-- Seuls Robe / Ensemble / Jupe / Boubou Femme existent en base (le reste du
-- catalogue femme est en fixtures uniquement). Les anciens chemins pointaient
-- vers la racine /collection femme, désormais vide.
-- ---------------------------------------------------------------------------
update public.models set image_url = '/collection%20femme/robe/w.avif'      where name = 'Robe'         and category_slug = 'femme';
update public.models set image_url = '/collection%20femme/robe/o.avif'      where name = 'Ensemble'     and category_slug = 'femme';
update public.models set image_url = '/collection%20femme/jupe/j.avif'      where name = 'Jupe'         and category_slug = 'femme';
update public.models set image_url = '/collection%20femme/ceremonie/k.avif' where name = 'Boubou Femme' and category_slug = 'femme';

-- Galerie femme : on repart proprement des sous-dossiers (le nombre de photos
-- change, donc suppression puis réinsertion).
delete from public.model_photos
where model_id in (
  select id from public.models
  where category_slug = 'femme' and name in ('Robe', 'Ensemble', 'Jupe', 'Boubou Femme')
);

insert into public.model_photos (model_id, image_url, sort_order)
select m.id, p.image_url, p.sort_order
from public.models m
join (values
  ('Robe', '/collection%20femme/robe/w.avif', 0),
  ('Robe', '/collection%20femme/robe/w1.avif', 1),
  ('Robe', '/collection%20femme/robe/w2.avif', 2),
  ('Ensemble', '/collection%20femme/robe/o.avif', 0),
  ('Ensemble', '/collection%20femme/robe/o1.avif', 1),
  ('Jupe', '/collection%20femme/jupe/j.avif', 0),
  ('Jupe', '/collection%20femme/jupe/j1.avif', 1),
  ('Jupe', '/collection%20femme/jupe/j2.avif', 2),
  ('Boubou Femme', '/collection%20femme/ceremonie/k.avif', 0),
  ('Boubou Femme', '/collection%20femme/ceremonie/k1.avif', 1),
  ('Boubou Femme', '/collection%20femme/ceremonie/k2.avif', 2)
) as p(model_name, image_url, sort_order)
  on p.model_name = m.name and m.category_slug = 'femme'
on conflict do nothing;
