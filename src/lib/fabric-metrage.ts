import type { GarmentModel } from "@/lib/types";

// « Combien de mètres ? » — la seule question de la commande à laquelle le
// client ne sait pas répondre, et que l'atelier tranche tous les jours. Cette
// table porte cette expertise : l'étape Quantité ne demande plus un nombre à
// l'aveugle, elle conseille un métrage, le justifie, et laisse ajuster.
//
// Clé : le `slug` du modèle — stable en démo comme en base (cf.
// `garment-routes.ts`), là où l'`id` est un UUID aléatoire en prod. Repli par
// mots-clés du nom, puis par catégorie, pour les créations de tailleurs que
// cette table ne connaît pas encore.

/** Pas de coupe : un vendeur taille au demi-mètre, jamais au centimètre. */
export const METERS_STEP = 0.5;
/** Garde-fou haut : au-delà, c'est un rouleau, il se commande auprès du vendeur. */
export const MAX_METERS = 30;
/** Coupe minimale vendable pour un tissu acheté seul. */
export const MIN_CUT_METERS = 1;

/** Marge d'ourlets et de retouche future, en mètres. */
export const MARGIN_METERS = 1;
/** De quoi tailler un foulard (moussor) ou une ceinture assortis. */
export const MATCHING_PIECE_METERS = 2.5;

export type Metrage = {
  /** Ce que l'atelier taille pour cette pièce, dans une largeur standard. */
  recommended: number;
  /** En dessous, la pièce ne sort pas du tissu — la coupe est refusée. */
  minimum: number;
};

const m = (recommended: number, minimum: number): Metrage => ({ recommended, minimum });

/** Le catalogue connu, pièce par pièce. */
const BY_SLUG: Record<string, Metrage> = {
  // Grands boubous & tenues de cérémonie — trois pièces, beaucoup d'ampleur.
  "grand-boubou": m(6, 5),
  agbada: m(6, 5),
  "baye-lahat": m(6, 5),
  "tenue-ceremonie": m(6, 5),
  "fatou-boubou-ceremonie": m(6.5, 5.5),
  "ibrahima-boubou": m(6, 5),
  "ensemble-bazin": m(5, 4),
  "fatou-bazin-brode": m(5, 4),
  "ceremonie-femme": m(6, 5),
  "fatou-ceremonie-femme": m(6, 5),

  // Kaftans & pièces amples d'un seul tenant.
  kaftan: m(3.5, 3),
  "kaftan-brode": m(3.5, 3),
  "ibrahima-kaftan": m(3.5, 3),
  dashiki: m(3, 2.5),
  relax: m(3, 2.5),

  // Costumes, vestes, gilets.
  costume: m(3.5, 3),
  "costume-africain": m(3.5, 3),
  "modou-costume-africain": m(3.5, 3),
  "tailleur-pantalon": m(3.5, 3),
  "veste-africaine": m(2, 1.5),
  "veste-femme": m(2, 1.5),
  gilet: m(1.5, 1),
  "gilet-femme": m(1.5, 1),

  // Hauts & bas.
  chemise: m(2, 1.5),
  "chemise-femme": m(2, 1.5),
  "modou-chemise": m(2, 1.5),
  pantalon: m(2.5, 2),
  "pantalon-large": m(3, 2.5),
  thiaya: m(2.5, 2),
  "thiaya-femme": m(4, 3),
  jupe: m(2, 1.5),

  // Robes & boubous femme.
  robe: m(4, 3),
  "robe-coupee": m(4, 3),
  "grande-robe": m(5, 4),
  "robe-soiree": m(5, 4),
  "boubou-femme": m(5, 4),
  "awa-boubou-femme": m(5, 4),

  // Ensembles.
  ensemble: m(4, 3),
  "bureau-femme": m(4, 3),
  "awa-ensemble-femme": m(4, 3),

  // Enfant.
  "boubou-enfant": m(2.5, 2),
  "ensemble-enfant": m(2, 1.5),
};

/**
 * Repli pour un modèle absent de la table : on lit le nom. L'ordre compte —
 * « Boubou Enfant » doit tomber sur la règle enfant, pas sur celle du boubou.
 */
const BY_KEYWORD: [RegExp, Metrage][] = [
  [/enfant|b[ée]b[ée]/, m(2.5, 2)],
  [/boubou|agbada|c[ée]r[ée]monie|mariage/, m(6, 5)],
  [/grande robe|robe de soir/, m(5, 4)],
  [/robe/, m(4, 3)],
  [/kaftan|caftan|dashiki/, m(3.5, 3)],
  [/costume|tailleur/, m(3.5, 3)],
  [/veste|blazer/, m(2, 1.5)],
  [/gilet/, m(1.5, 1)],
  [/chemise|tunique/, m(2, 1.5)],
  [/pantalon|thiaya|saroual/, m(2.5, 2)],
  [/jupe/, m(2, 1.5)],
  [/ensemble/, m(4, 3)],
];

const BY_CATEGORY: Record<string, Metrage> = {
  homme: m(4, 3),
  femme: m(4, 3),
  enfant: m(2.5, 2),
};

/** Vêtement inconnu : le métrage passe-partout du catalogue. */
export const DEFAULT_METRAGE = m(3, 2);

/** Le métrage conseillé pour ce vêtement. */
export function metrageFor(model: GarmentModel | null): Metrage {
  if (!model) return DEFAULT_METRAGE;
  if (model.slug && BY_SLUG[model.slug]) return BY_SLUG[model.slug];

  const haystack = `${model.slug ?? ""} ${model.name}`.toLowerCase();
  const matched = BY_KEYWORD.find(([re]) => re.test(haystack));
  if (matched) return matched[1];

  return BY_CATEGORY[model.category_slug ?? ""] ?? DEFAULT_METRAGE;
}

/**
 * Le métrage d'une pièce désignée par son seul slug — pour les usages proposés
 * sur la fiche d'un tissu (« Grand boubou · 6 m »), où l'on parle d'un type de
 * vêtement avant qu'un modèle précis ne soit choisi.
 */
export function metrageForSlug(slug: string): Metrage {
  return (
    BY_SLUG[slug] ?? BY_KEYWORD.find(([re]) => re.test(slug))?.[1] ?? DEFAULT_METRAGE
  );
}

/** « 4,5 m » — le métrage se lit à la française. */
export function formatMeters(meters: number): string {
  return `${meters.toLocaleString("fr-FR")} m`;
}

/** Ramène une saisie libre sur le pas de coupe, dans les bornes du vendeur. */
export function clampMeters(value: number, min: number, max: number): number {
  const stepped = Math.round(value / METERS_STEP) * METERS_STEP;
  return Math.min(max, Math.max(min, Number(stepped.toFixed(1))));
}

// ---------------------------------------------------------------------------
// Métrages proposés — trois intentions d'achat, pas trois nombres.
// ---------------------------------------------------------------------------

export type MetragePreset = {
  meters: number;
  title: string;
  desc: string;
  badge?: string;
};

export function garmentPresets(metrage: Metrage): MetragePreset[] {
  return [
    {
      meters: metrage.recommended,
      title: "Le métrage juste",
      desc: "Exactement ce que la coupe demande.",
      badge: "Conseillé",
    },
    {
      meters: metrage.recommended + MARGIN_METERS,
      title: "Avec marge",
      desc: "+1 m pour les ourlets et une retouche plus tard.",
      badge: "Le plus choisi",
    },
    {
      meters: metrage.recommended + MATCHING_PIECE_METERS,
      title: "Tenue assortie",
      desc: "+2,5 m pour un foulard ou une ceinture dans le même tissu.",
    },
  ];
}

/** Tissu acheté seul : le client sait ce qu'il veut en faire, pas combien il faut. */
export const FABRIC_ONLY_PRESETS: MetragePreset[] = [
  { meters: 3, title: "Une pièce simple", desc: "Chemise, jupe, pantalon." },
  {
    meters: 6,
    title: "Une grande tenue",
    desc: "Grand boubou, robe longue, ensemble.",
    badge: "Le plus choisi",
  },
  {
    meters: 12,
    title: "Tenue de famille",
    desc: "Plusieurs tenues dans le même tissu, pour une cérémonie.",
  },
];

/** Ce que le métrage couvre, palier par palier — coché en direct. */
export function coverageFor(
  metrage: Metrage,
  isFabricOnly: boolean,
): { at: number; label: string }[] {
  if (isFabricOnly) {
    return [
      { at: 3, label: "Une pièce simple — chemise, jupe, pantalon" },
      { at: 6, label: "Une grande tenue — boubou, robe longue" },
      { at: 12, label: "Plusieurs tenues dans le même tissu" },
    ];
  }
  return [
    { at: metrage.recommended, label: "Le vêtement, coupé à vos mesures" },
    {
      at: metrage.recommended + MARGIN_METERS,
      label: "La marge d'ourlets et de retouche",
    },
    {
      at: metrage.recommended + MATCHING_PIECE_METERS,
      label: "Un foulard ou une ceinture assortis",
    },
  ];
}
