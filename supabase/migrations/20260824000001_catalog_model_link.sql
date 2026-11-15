-- Le catalogue JALOFA (`models.tailor_id` null) devient la liste des rubriques
-- du site : /modeles ne montre plus que lui, et chaque modèle du catalogue a sa
-- page où s'affichent les créations des tailleurs de ce type. Un tailleur range
-- donc chaque création sous un modèle du catalogue : `catalog_model_id`.
--
-- Seul l'administrateur ajoute des modèles au catalogue (écriture serveur via la
-- clé service, après contrôle du rôle admin) ; la policy `models_write_own`
-- empêche déjà tout client d'écrire une ligne sans propriétaire.
-- Idempotent.

alter table public.models
  add column if not exists catalog_model_id uuid references public.models(id) on delete set null;

create index if not exists models_catalog_model_id_idx on public.models(catalog_model_id);

-- Le rattachement vise forcément une ligne du catalogue, jamais la création d'un
-- autre tailleur, et un modèle du catalogue n'est rattaché à rien.
create or replace function public.models_check_catalog_link()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.catalog_model_id is null then
    return new;
  end if;
  if new.tailor_id is null then
    raise exception 'Un modèle du catalogue ne se rattache pas à un autre modèle.';
  end if;
  if not exists (
    select 1 from public.models m
    where m.id = new.catalog_model_id and m.tailor_id is null
  ) then
    raise exception 'Le modèle de rattachement doit appartenir au catalogue JALOFA.';
  end if;
  return new;
end;
$$;

drop trigger if exists models_check_catalog_link on public.models;
create trigger models_check_catalog_link
  before insert or update of catalog_model_id, tailor_id on public.models
  for each row execute function public.models_check_catalog_link();
