-- Modèles : slug stable et lisible, indépendant de l'`id` UUID généré.
--
-- Les pages dédiées (« /homme/grand-boubou-sur-mesure », « /femme/robe-sur-mesure »)
-- et leurs familles résolvent leurs modèles par ce slug — pas par l'`id`, qui est
-- un UUID aléatoire en base et ne peut donc pas être codé en dur côté front.
-- Sans slug, ces pages ne trouvaient aucun modèle en prod et renvoyaient une 404.
--
-- Idempotent : rejouable sans effet de bord (la colonne, l'index et le backfill
-- se protègent tous d'une exécution répétée).

alter table public.models add column if not exists slug text;

-- Unicité du slug, mais plusieurs modèles peuvent rester sans slug (null).
create unique index if not exists models_slug_key
  on public.models(slug)
  where slug is not null;

-- Backfill des ancres qui ont une page dédiée. Ces noms sont uniques dans le
-- catalogue seedé (cf. supabase/seed.sql).
update public.models set slug = 'grand-boubou' where name = 'Grand Boubou' and slug is null;
update public.models set slug = 'agbada'       where name = 'Agbada'       and slug is null;
update public.models set slug = 'baye-lahat'   where name = 'Baye Lahat'   and slug is null;
update public.models set slug = 'robe'         where name = 'Robe'         and slug is null;
update public.models set slug = 'boubou-femme' where name = 'Boubou Femme' and slug is null;
