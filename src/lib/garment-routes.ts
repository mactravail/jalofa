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
 */

/** Model → dedicated landing page. Shared by every member of a family. */
export const DEDICATED_HREF: Record<string, string> = {
  "demo-grand-boubou": "/homme/grand-boubou-sur-mesure",
  "demo-agbada": "/homme/grand-boubou-sur-mesure",
  "demo-baye-lahat": "/homme/grand-boubou-sur-mesure",
  "demo-fatou-boubou-ceremonie": "/homme/grand-boubou-sur-mesure",
  "demo-ibrahima-boubou": "/homme/grand-boubou-sur-mesure",
  "demo-robe": "/femme/robe-sur-mesure",
  "demo-grande-robe": "/femme/robe-sur-mesure",
  "demo-robe-soiree": "/femme/robe-sur-mesure",
  "demo-robe-coupee": "/femme/robe-sur-mesure",
  "demo-boubou-femme": "/femme/robe-sur-mesure",
};

/**
 * Models with a detailed step-by-step configurator (vs. the generic order
 * flow). Selecting « Le personnaliser » goes here instead of /commande/nouvelle.
 */
export const PERSONALISER_HREF: Record<string, string> = {
  "demo-grand-boubou": "/homme/grand-boubou-sur-mesure/personnaliser",
  "demo-robe": "/femme/robe-sur-mesure/personnaliser",
  "demo-boubou-femme": "/femme/robe-sur-mesure/personnaliser",
};

/** The grand boubou family, in display order for the type switcher. */
export const GRAND_BOUBOU_TYPES = [
  "demo-grand-boubou",
  "demo-agbada",
  "demo-baye-lahat",
  "demo-fatou-boubou-ceremonie",
  "demo-ibrahima-boubou",
];

/** The robe family, in display order for the type switcher. */
export const ROBE_TYPES = [
  "demo-robe",
  "demo-grande-robe",
  "demo-robe-soiree",
  "demo-robe-coupee",
  "demo-boubou-femme",
];
