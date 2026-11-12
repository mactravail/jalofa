/**
 * Sélection JALOFA — phase actuelle de recrutement des pros (novembre 2026).
 *
 * JALOFA ne vend plus d'offre aux tailleurs et vendeurs de tissus : l'accès PRO
 * est **offert** (0 FCFA, aucune commission, sans durée affichée) aux
 * professionnels qui candidatent. L'équipe garde les meilleurs et désactive les
 * autres depuis l'admin (`setProActivation`). Une offre payante (abonnement
 * mensuel ou formule gratuite à commission) viendra plus tard ; chaque pro
 * pourra alors l'accepter ou non.
 *
 * Techniquement : un pro sélectionné a l'offre Pro **sans échéance**
 * (`plan_expires_at = null`) — `renewProFromSale` ne facture alors jamais rien
 * (cf. `grantSelectionAccess`). Le code des offres Gratuit / Pro payante est
 * conservé, simplement plus affiché.
 *
 * Client-safe : textes seulement.
 */

export const SELECTION_TITLE =
  "Rejoignez gratuitement les professionnels sélectionnés par JALOFA !";

export const SELECTION_SUBTITLE =
  "Bénéficiez gratuitement de l'accès PRO et rejoignez une marketplace qui valorise les meilleurs tailleurs et vendeurs de tissus, sélectionnés pour leur savoir-faire, leur sérieux et leur excellent rapport qualité-prix.";

export const SELECTION_CTA = "CANDIDATER À LA SÉLECTION";

/** Ce que JALOFA attend des pros retenus — phrases courtes, public peu lettré. */
export const SELECTION_CRITERIA = [
  "Des créations de qualité",
  "Des finitions soignées, un vrai savoir-faire",
  "Des prix justes pour la qualité",
  "Un service client sérieux",
  "Les engagements et les délais respectés",
];
