-- Réduction par tissu, réglée par l'admin JALOFA (boutique) : le prix plein
-- s'affiche barré et le client paie le prix réduit (calcul côté serveur dans
-- fabricLinePrice). 0 = pas de promo. Idempotent.

alter table public.fabrics
  add column if not exists discount_percent integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fabrics_discount_percent_range'
  ) then
    alter table public.fabrics
      add constraint fabrics_discount_percent_range
      check (discount_percent between 0 and 90);
  end if;
end $$;

-- Lancement : −20 % sur tous les tissus en ligne (modifiable fiche par fiche).
update public.fabrics set discount_percent = 20 where discount_percent = 0;
