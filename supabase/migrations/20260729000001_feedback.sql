-- =============================================================================
-- JALOFA — Retours : ce que les utilisateurs veulent voir amélioré
--
-- Depuis leur espace (client, tailleur ou vendeur), les utilisateurs disposent
-- d'un bouton bien visible pour signaler un problème ou proposer une idée. Leur
-- message arrive à l'administration, qui le lit et le marque « traité ».
--
--   • `feedback` — un retour : sa catégorie (idée d'amélioration / problème /
--     autre), le message libre, et le contexte (`space` = l'espace d'où il a été
--     envoyé). L'auteur est dénormalisé (`author_name`, `author_role`) pour que
--     le retour survive à la suppression du compte et reste lisible côté admin
--     sans join (la RLS de `profiles` interdit à l'admin de lire tous les noms).
--
-- Modération : lecture / triage réservés à l'administration via la clé de service
-- (comme les avis et l'inspiration) — aucune policy admin ici. RLS activée.
-- Idempotent (rejouable).
-- =============================================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- `set null` : le retour survit au départ de son auteur (le nom reste figé).
  author_id uuid references public.profiles(id) on delete set null,
  -- Identité figée à l'envoi (la RLS de `profiles` interdit sa lecture côté admin).
  author_name text,
  author_role text,
  -- L'espace d'où le retour a été envoyé — un pro aux deux métiers peut écrire
  -- depuis l'un ou l'autre.
  space text not null default 'client'
    check (space in ('client', 'tailor', 'vendor')),
  -- La nature du retour : ce que l'utilisateur veut améliorer, ou un problème.
  category text not null default 'amelioration'
    check (category in ('amelioration', 'probleme', 'autre')),
  message text not null,
  -- Triage de l'administration : nouveau tant qu'il n'a pas été traité.
  status text not null default 'new'
    check (status in ('new', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback(created_at desc);
create index if not exists feedback_status_idx on public.feedback(status);
create index if not exists feedback_author_idx on public.feedback(author_id);

-- RLS : un utilisateur connecté écrit un retour en son nom et peut relire les
-- siens ; l'administration lit et trie l'ensemble via la clé de service.
alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (author_id = (select auth.uid()));

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback
  for select using (author_id = (select auth.uid()));
