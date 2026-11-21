-- Vues des tailleurs (2026-11-21)
--
-- Le tailleur voit combien de personnes ont ouvert sa page publique
-- (`/tailleurs/<id>`) et chacun de ses modèles (`/modeles/<id ou slug>`).
-- L'admin voit les mêmes chiffres pour tous les tailleurs.
--
-- Aucune nouvelle table : on lit `page_views` (cf. 20260906000001), qui reste
-- sans policy. Les deux fonctions sont SECURITY DEFINER :
--   - `tailor_view_stats` : le tailleur lui-même ou un admin ;
--   - `tailors_view_ranking` : clé de service uniquement (page admin).
-- Idempotent.

create index if not exists page_views_path_idx on public.page_views (path, entered_at);

create or replace function public.tailor_view_stats(p_tailor uuid, since timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if auth.role() <> 'service_role'
     and p_tailor is distinct from auth.uid()
     and not coalesce(public.is_admin(), false) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with v as (
    select pv.*, substring(pv.path from '^(?:/it)?/modeles/([^/?#]+)') as model_key
    from public.page_views pv
    where pv.entered_at >= since
  ),
  shop as (
    select * from v
    where v.path in ('/tailleurs/' || p_tailor::text, '/it/tailleurs/' || p_tailor::text)
  ),
  mine as (
    select m.id, m.name, m.slug, m.image_url from public.models m where m.tailor_id = p_tailor
  ),
  model_views as (
    select mine.id as model_id, v.*
    from v join mine on v.model_key = mine.id::text or (mine.slug is not null and v.model_key = mine.slug)
  )
  select jsonb_build_object(
    'page_views', (select count(*) from shop),
    'page_visitors', (select count(distinct visitor_id) from shop),
    'model_views', (select count(*) from model_views),
    'model_visitors', (select count(distinct visitor_id) from model_views),
    'models', coalesce((
      select jsonb_agg(x order by x.views desc, x.name)
      from (
        select mine.id, mine.name, mine.image_url,
               count(mv.id) as views,
               count(distinct mv.visitor_id) as visitors
        from mine left join model_views mv on mv.model_id = mine.id
        group by mine.id, mine.name, mine.image_url
      ) x
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select to_char(entered_at at time zone 'Africa/Dakar', 'YYYY-MM-DD') as day,
               count(*) filter (where kind = 'page') as page_views,
               count(*) filter (where kind = 'model') as model_views
        from (
          select entered_at, 'page' as kind from shop
          union all
          select entered_at, 'model' from model_views
        ) all_views
        group by 1
      ) d
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.tailor_view_stats(uuid, timestamptz) from public, anon;
grant execute on function public.tailor_view_stats(uuid, timestamptz) to authenticated;

-- Classement de tous les tailleurs pour l'admin.
create or replace function public.tailors_view_ranking(since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with v as (
    select pv.id, pv.visitor_id, pv.path,
           substring(pv.path from '^(?:/it)?/tailleurs/([0-9a-f-]{36})$') as tailor_key,
           substring(pv.path from '^(?:/it)?/modeles/([^/?#]+)') as model_key
    from public.page_views pv
    where pv.entered_at >= since
  ),
  shop as (
    select t.id as tailor_id, count(v.id) as views, count(distinct v.visitor_id) as visitors
    from public.tailors t join v on v.tailor_key = t.id::text
    group by t.id
  ),
  models as (
    select m.tailor_id, count(v.id) as views, count(distinct v.visitor_id) as visitors
    from public.models m
    join v on v.model_key = m.id::text or (m.slug is not null and v.model_key = m.slug)
    where m.tailor_id is not null
    group by m.tailor_id
  )
  select coalesce(jsonb_agg(x order by x.total desc, x.shop_name), '[]'::jsonb)
  from (
    select t.id,
           coalesce(nullif(t.shop_name, ''), p.full_name, 'Tailleur') as shop_name,
           t.city,
           coalesce(s.views, 0) as page_views,
           coalesce(s.visitors, 0) as page_visitors,
           coalesce(m.views, 0) as model_views,
           coalesce(m.visitors, 0) as model_visitors,
           coalesce(s.views, 0) + coalesce(m.views, 0) as total
    from public.tailors t
    left join public.profiles p on p.id = t.id
    left join shop s on s.tailor_id = t.id
    left join models m on m.tailor_id = t.id
  ) x;
$$;

revoke all on function public.tailors_view_ranking(timestamptz) from public, anon, authenticated;
