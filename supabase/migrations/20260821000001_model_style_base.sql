-- Le modèle d'un tailleur peut porter le nom qu'il veut (« Ahmadou Tidiane
-- Diouf ») : c'est `style_base` qui dit de quel vêtement du catalogue il s'agit,
-- pour que le client le personnalise avec nos planches dessinées (col, manches,
-- broderie…). Valeurs : une clé de `STYLE_GROUPS_BY_SLUG` (« robe »,
-- « grand-boubou »…), ou « sur-demande » quand le tailleur a demandé à JALOFA de
-- dessiner la personnalisation d'un modèle absent du catalogue.
-- Pas de contrainte CHECK : la liste des vêtements vit dans le code et grandit.
-- Idempotent.
alter table public.models add column if not exists style_base text;
