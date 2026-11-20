-- ===========================================================================
-- Tailleurs affichés ou masqués par l'administration (2026-11-20)
--
-- `tailors.hidden_by_admin` : depuis la page « Tailleurs » de l'admin, JALOFA
-- choisit les tailleurs affichés ou non sur le site. Masqué = hors de la liste
-- publique, fiche introuvable, modèles retirés du catalogue — sans suspendre
-- son compte (il garde son espace). Le tailleur ne peut ni lever ce masquage,
-- ni se rendre visible depuis « Ma visibilité ».
--
-- Idempotent : peut être rejoué sans dommage.
-- ===========================================================================

begin;

-- Les tailleurs masqués par l'administration ----------------------------------
alter table public.tailors
  add column if not exists hidden_by_admin boolean not null default false;

-- Même garde-fou qu'en 20260904000001, avec `hidden_by_admin` en plus : seul un
-- administrateur le change, et un tailleur masqué ne peut pas se rouvrir.
create or replace function public.guard_pro_privileged_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  protected constant text[] := array[
    'rating', 'rating_count',
    'is_certified', 'is_activated', 'is_suspended', 'suspension_reason',
    'plan', 'plan_expires_at',
    'is_founding_member', 'verified_photos',
    'completed_orders', 'accepted_orders', 'rejected_orders', 'on_time_orders',
    'sales_approved', 'sales_approved_at',
    'hidden_by_admin'
  ];
  before_row jsonb;
  after_row  jsonb;
  col text;
begin
  if pg_trigger_depth() > 1
     or current_user not in ('authenticated', 'anon')
     or public.is_admin()
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.rating := 0;
    new.rating_count := 0;
    new.is_certified := false;
    new.is_activated := false;
    new.is_suspended := false;
    new.suspension_reason := null;
    new.plan := 'free';
    new.plan_expires_at := null;
    new.is_founding_member := false;
    new.verified_photos := 0;
    new.completed_orders := 0;
    new.accepted_orders := 0;
    new.rejected_orders := 0;
    new.on_time_orders := 0;
    new.sales_approved := false;
    new.sales_approved_at := null;
    return new;
  end if;

  before_row := to_jsonb(old);
  after_row := to_jsonb(new);

  -- Masqué par l'administration : le pro ne peut pas se rendre visible.
  if after_row ? 'hidden_by_admin'
     and coalesce((after_row ->> 'hidden_by_admin')::boolean, false)
     and coalesce((after_row ->> 'is_active')::boolean, false)
     and not coalesce((before_row ->> 'is_active')::boolean, false)
  then
    raise exception
      'Votre boutique a été masquée par l''administration'
      using errcode = '42501';
  end if;

  foreach col in array protected loop
    if before_row ? col
       and (after_row -> col) is distinct from (before_row -> col)
    then
      raise exception
        'La colonne « % » est attribuée par l''administration et ne peut pas être modifiée', col
        using errcode = '42501';
    end if;
  end loop;

  return new;
end;
$$;

commit;
