-- Statistiques de visite (2026-11-16)
--
-- Chaque page ouverte sur le site public = une ligne de `page_views`. Le
-- navigateur envoie l'ouverture, puis le temps passé quand le visiteur quitte
-- la page (cf. `src/app/api/track/route.ts` + `<PageTracker />`).
--
-- Aucune donnée personnelle : `visitor_id` est un identifiant aléatoire gardé
-- dans le navigateur, `session_id` change à chaque visite. Pas de nom, pas
-- d'IP, pas de compte.
--
-- Écrit et lu UNIQUEMENT avec la clé de service (route /api/track et
-- /admin/statistiques) : RLS activée sans aucune policy. Idempotent.

create table if not exists public.page_views (
  id uuid primary key,
  visitor_id uuid not null,
  session_id uuid not null,
  path text not null,
  referrer text,
  device text not null default 'mobile',  -- mobile | tablet | desktop
  country text,
  entered_at timestamptz not null default now(),
  duration_ms integer not null default 0
);

create index if not exists page_views_entered_at_idx on public.page_views (entered_at desc);
create index if not exists page_views_session_idx on public.page_views (session_id, entered_at);

alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;

-- Tout le tableau de bord en un appel : visiteurs, pages vues, pages où l'on
-- s'arrête (dernière page d'une visite), temps passé, appareils, pays, sources.
create or replace function public.site_stats(since timestamptz)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  with v as (
    select * from public.page_views where entered_at >= since
  ),
  last_view as (
    select distinct on (session_id) session_id, path, id
    from v
    order by session_id, entered_at desc
  ),
  session_size as (
    select session_id, count(*) as n from v group by session_id
  )
  select jsonb_build_object(
    'visitors', (select count(distinct visitor_id) from v),
    'sessions', (select count(distinct session_id) from v),
    'views', (select count(*) from v),
    'bounces', (select count(*) from session_size where n = 1),
    'avg_session_ms', (
      select coalesce(round(avg(total)), 0)
      from (select sum(duration_ms) as total from v group by session_id) s
    ),
    'pages', coalesce((
      select jsonb_agg(p order by p.views desc)
      from (
        select
          v.path,
          count(*) as views,
          count(distinct v.visitor_id) as visitors,
          coalesce(round(avg(nullif(v.duration_ms, 0))), 0) as avg_ms,
          count(lv.id) as exits
        from v
        left join last_view lv on lv.id = v.id
        group by v.path
        order by count(*) desc
        limit 100
      ) p
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select
          to_char(entered_at at time zone 'Africa/Dakar', 'YYYY-MM-DD') as day,
          count(distinct visitor_id) as visitors,
          count(*) as views
        from v
        group by 1
      ) d
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(x order by x.visitors desc)
      from (
        select device as label, count(distinct visitor_id) as visitors
        from v group by device
      ) x
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(x order by x.visitors desc)
      from (
        select coalesce(country, '??') as label, count(distinct visitor_id) as visitors
        from v group by 1 order by 2 desc limit 10
      ) x
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(x order by x.visitors desc)
      from (
        select coalesce(referrer, 'direct') as label, count(distinct visitor_id) as visitors
        from (
          -- La source d'une visite = le référent de sa première page.
          select distinct on (session_id) session_id, visitor_id, referrer
          from v order by session_id, entered_at
        ) first_view
        group by 1 order by 2 desc limit 10
      ) x
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.site_stats(timestamptz) from public, anon, authenticated;
