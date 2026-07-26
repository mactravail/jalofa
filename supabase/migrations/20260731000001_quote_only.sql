-- ---------------------------------------------------------------------------
-- Prix sur demande / devis en privé (réservé aux abonnés payants).
--
-- Au Sénégal, les tailleurs montrent leurs modèles (TikTok…) mais donnent le
-- prix « en PV ». On en fait un avantage d'abonnement : un tailleur au forfait
-- payant (Standard / Premium) peut masquer ses prix publics et traiter ses
-- devis en privé ; un compte Gratuit doit, lui, afficher ses prix. Le respect
-- du forfait est vérifié côté serveur à l'enregistrement du profil.
--
--  * `tailors.quote_only`  — le tailleur masque ses prix : sa fiche et ses
--    créations affichent « Prix sur demande », et le client passe par une
--    demande de devis au lieu d'un achat au prix affiché.
--  * `orders.is_quote`     — la commande est née d'une demande de devis : elle
--    tombe dans « À traiter » sans prix ni paiement ; le tailleur la chiffre,
--    puis le client accepte et paie.
-- ---------------------------------------------------------------------------
alter table public.tailors
  add column if not exists quote_only boolean not null default false;

alter table public.orders
  add column if not exists is_quote boolean not null default false;
