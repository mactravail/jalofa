/**
 * Central routing table for garments with a bespoke experience beyond the
 * generic /modeles/[id] page: a dedicated landing page (own "type" family,
 * own pricing) and/or a dedicated step-by-step configurator.
 *
 * Every member of a family shares ONE dedicated page — /modeles/[id] redirects
 * any of them there, deep-linked to its own type via `?type=`. The dedicated
 * page then renders a type switcher across the whole family (see
 * `GarmentTypeSwitcher`) so the silhouette can be changed without leaving the
 * page. This is a pre-configurator choice only: once « Personnaliser » is
 * pressed, the model is locked in — cf. the "un configurateur = un vêtement"
 * rule.
 *
 * Ces tables sont clés par `slug` (l'identifiant stable et lisible d'un
 * modèle), PAS par son `id` UUID : le slug existe à l'identique en démo et en
 * base, alors que l'`id` est aléatoire en prod. Un membre de famille absent de
 * la base (création tailleur seedée nulle part) ne se résout tout simplement
 * pas en prod — la page affiche les membres qui existent, sans planter.
 */

/** Model slug → dedicated landing page. Shared by every member of a family. */
export const DEDICATED_HREF: Record<string, string> = {
  "grand-boubou": "/homme/grand-boubou-sur-mesure",
  agbada: "/homme/grand-boubou-sur-mesure",
  "baye-lahat": "/homme/grand-boubou-sur-mesure",
  "fatou-boubou-ceremonie": "/homme/grand-boubou-sur-mesure",
  "ibrahima-boubou": "/homme/grand-boubou-sur-mesure",
  robe: "/femme/robe-sur-mesure",
  "grande-robe": "/femme/robe-sur-mesure",
  "robe-soiree": "/femme/robe-sur-mesure",
  "robe-coupee": "/femme/robe-sur-mesure",
  "boubou-femme": "/femme/robe-sur-mesure",
};

// Il n'y a plus de configurateur « maison » par vêtement : TOUS les habits se
// personnalisent dans le même configurateur (/commande/nouvelle — Style,
// Quantité, Tailleur, Mesures, Récapitulatif). Ce qui distingue un vêtement
// d'un autre, ce sont ses groupes de style (cf. `style-options.ts`), pas une
// page à part. Les anciennes routes `…/personnaliser` redirigent vers la page
// dédiée du vêtement, où le tissu se choisit avant d'entrer.

/** The grand boubou family, in display order for the type switcher (by slug). */
export const GRAND_BOUBOU_TYPES = [
  "grand-boubou",
  "agbada",
  "baye-lahat",
  "fatou-boubou-ceremonie",
  "ibrahima-boubou",
];

/** The robe family, in display order for the type switcher (by slug). */
export const ROBE_TYPES = [
  "robe",
  "grande-robe",
  "robe-soiree",
  "robe-coupee",
  "boubou-femme",
];
