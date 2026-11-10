-- Offre Pro : le 1er mois se paie à l'inscription (PayDunya), les mois suivants
-- sont retenus sur les ventes. Quand un mois Pro est échu, la première commande
-- payée du pro ouvre un nouveau mois et ajoute son prix au frais différé
-- (subscription_payments, provider = 'sale', status = 'deferred'), retenu sur
-- le reversement. Un mois sans vente ne coûte rien.
--
-- `plan_auto_renew` = le pro n'a pas arrêté son offre (« Sans engagement »).
-- false : l'offre s'arrête à son échéance et le compte repasse sur Gratuit.
-- Idempotent.

begin;

alter table public.tailors
  add column if not exists plan_auto_renew boolean not null default true;

alter table public.vendors
  add column if not exists plan_auto_renew boolean not null default true;

commit;
