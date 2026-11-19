-- Prêt-à-porter (« Tel quel ») : les tailles que le tailleur a en stock
-- (XS, S, M, L, XL…). Vide = toutes les tailles standard (modèles d'avant).
alter table public.models
  add column if not exists ready_sizes text[] not null default '{}';
