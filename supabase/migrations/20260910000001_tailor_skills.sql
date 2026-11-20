-- ===========================================================================
-- « Spécialisation » + tailleur visible dès l'inscription (2026-11-20)
--
-- 1. Un tailleur qui s'inscrit apparaît tout de suite dans la liste publique
--    `/tailleurs`, même débutant, même sans modèle publié. Avant, sa boutique
--    (`tailors.is_active`) restait fermée jusqu'à sa première création.
--    Il peut toujours se cacher depuis « Ma visibilité ».
--
-- 2. « Spécialisation » : `tailors.specialty` (homme / femme / les deux) et
--    `tailors.skills` : les habits que le tailleur sait coudre, choisis dans le
--    catalogue JALOFA (slug du modèle, ou son id s'il n'a pas de slug).
--    Affichés sur sa fiche publique et sa carte. `tailors.custom_skills` : les
--    habits absents du catalogue, dont le tailleur écrit lui-même le nom.
--
-- Idempotent : peut être rejoué sans dommage.
-- ===========================================================================

begin;

alter table public.tailors
  add column if not exists skills text[] not null default '{}';

-- Les habits qui ne sont pas dans le catalogue : le tailleur écrit leur nom.
alter table public.tailors
  add column if not exists custom_skills text[] not null default '{}';

-- La spécialisation : couture homme, femme, ou les deux. Null = pas encore dit.
alter table public.tailors
  add column if not exists specialty text;

alter table public.tailors
  drop constraint if exists tailors_specialty_check;
alter table public.tailors
  add constraint tailors_specialty_check
  check (specialty is null or specialty in ('homme', 'femme', 'both'));

-- Les nouveaux tailleurs naissent visibles.
alter table public.tailors
  alter column is_active set default true;

-- Les tailleurs déjà inscrits, restés cachés seulement parce qu'ils n'avaient
-- encore rien publié, rejoignent la liste. Ceux qui ont des modèles et se sont
-- cachés eux-mêmes (« Ma visibilité ») restent cachés.
update public.tailors t
set is_active = true
where t.is_active = false
  and t.is_suspended = false
  and not exists (select 1 from public.models m where m.tailor_id = t.id);

commit;
