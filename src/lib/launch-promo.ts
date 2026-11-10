/**
 * Offre de lancement — novembre 2026 : les 100 premiers pros qui choisissent
 * l'offre Pro l'ont **offerte jusqu'au 1er décembre**, sans rien payer à
 * l'inscription. Ensuite, le renouvellement habituel s'applique (cf.
 * `renewProFromSale`) : le mois Pro n'est facturé, sur le reversement, qu'à
 * la première vente — pas de vente, rien à payer.
 *
 * Client-safe (pas de serveur ici) : le pop-up et le formulaire lisent ces
 * constantes, l'attribution se fait dans `grantLaunchPromo`.
 */

/** Nombre de places de l'offre de lancement. */
export const LAUNCH_PROMO_SLOTS = 100;

/**
 * Fin de la promo et échéance de l'offre Pro offerte. Dakar = UTC toute
 * l'année : minuit au Sénégal. Sert aussi à compter les places prises (les pros
 * dont l'offre Pro expire exactement à cette date).
 */
export const LAUNCH_PROMO_END = "2026-12-01T00:00:00.000Z";

/** La promo est-elle encore ouverte (avant le 1er décembre) ? */
export function isLaunchPromoOpen(now: Date = new Date()): boolean {
  return now.getTime() < new Date(LAUNCH_PROMO_END).getTime();
}
