import type { DressIconName } from "@/components/women/dress-icons";

// Catalogue for the women's made-to-measure dress configurator ("Robe sur
// mesure → Personnaliser"), modelled on Sumissura's illustrated, grouped
// picker. Groups are client-side constants; labels are French (Senegalese
// market), price deltas are in FCFA and add on top of the atelier base price
// and the chosen fabric. See `src/lib/style-options.ts` for the menswear
// counterpart used by the main order flow.

export type DressOption = {
  slug: string;
  name: string;
  icon: DressIconName;
  /** Surcharge in FCFA added to the atelier base price (0 = included). */
  priceDelta?: number;
};

export type DressGroup = {
  slug: string;
  name: string;
  hint: string;
  options: DressOption[];
};

/** Atelier base price for a made-to-measure dress, in FCFA (fabric excluded). */
export const DRESS_BASE_PRICE = 28000;

/** Metres of fabric a dress consumes — used to price the selected fabric. */
export const DRESS_FABRIC_METERS = 3;

export const DRESS_GROUPS: DressGroup[] = [
  {
    slug: "encolure",
    name: "Encolure",
    hint: "La ligne du décolleté",
    options: [
      { slug: "rond", name: "Ras-du-cou", icon: "nl-rond" },
      { slug: "v", name: "Col V", icon: "nl-v" },
      { slug: "bateau", name: "Bateau", icon: "nl-bateau" },
      { slug: "coeur", name: "Cœur", icon: "nl-coeur", priceDelta: 2000 },
      { slug: "carre", name: "Carré", icon: "nl-carre" },
    ],
  },
  {
    slug: "manches",
    name: "Manches",
    hint: "Longueur et volume des manches",
    options: [
      { slug: "sans", name: "Sans manches", icon: "sl-sans" },
      { slug: "courtes", name: "Courtes", icon: "sl-courtes" },
      { slug: "trois-quarts", name: "Trois-quarts", icon: "sl-troisquarts" },
      { slug: "longues", name: "Longues", icon: "sl-longues" },
      { slug: "ballon", name: "Ballon", icon: "sl-ballon", priceDelta: 3000 },
      { slug: "volantees", name: "Volantées", icon: "sl-volantees", priceDelta: 3500 },
    ],
  },
  {
    slug: "silhouette",
    name: "Silhouette",
    hint: "La coupe générale de la robe",
    options: [
      { slug: "ajustee", name: "Ajustée", icon: "si-ajustee" },
      { slug: "evasee", name: "Évasée (A)", icon: "si-evasee" },
      { slug: "trapeze", name: "Trapèze", icon: "si-trapeze" },
      { slug: "empire", name: "Empire", icon: "si-empire", priceDelta: 2000 },
      { slug: "fourreau", name: "Fourreau", icon: "si-fourreau", priceDelta: 4000 },
      { slug: "patineuse", name: "Patineuse", icon: "si-patineuse", priceDelta: 5000 },
    ],
  },
  {
    slug: "longueur",
    name: "Longueur",
    hint: "Où tombe l'ourlet",
    options: [
      { slug: "mini", name: "Mini", icon: "lg-mini" },
      { slug: "genou", name: "Au genou", icon: "lg-genou" },
      { slug: "midi", name: "Midi", icon: "lg-midi" },
      { slug: "cheville", name: "Cheville", icon: "lg-cheville", priceDelta: 2000 },
      { slug: "longue", name: "Longue", icon: "lg-longue", priceDelta: 4000 },
    ],
  },
  {
    slug: "fermeture",
    name: "Fermeture",
    hint: "La manière de fermer la robe",
    options: [
      { slug: "zip-dos", name: "Zip dos", icon: "cl-zip-dos" },
      { slug: "zip-cote", name: "Zip côté invisible", icon: "cl-zip-cote", priceDelta: 1500 },
      { slug: "boutons", name: "Boutons dos", icon: "cl-boutons", priceDelta: 2500 },
      { slug: "lacage", name: "Laçage", icon: "cl-lacage", priceDelta: 5000 },
    ],
  },
  {
    slug: "doublure",
    name: "Doublure",
    hint: "L'intérieur de la robe",
    options: [
      { slug: "sans", name: "Sans doublure", icon: "dl-sans" },
      { slug: "coton", name: "Coton", icon: "dl-coton", priceDelta: 4000 },
      { slug: "soie", name: "Soie", icon: "dl-soie", priceDelta: 9000 },
    ],
  },
  {
    slug: "finitions",
    name: "Finitions",
    hint: "Les détails qui font la différence",
    options: [
      { slug: "sans", name: "Aucune", icon: "fn-sans" },
      { slug: "ceinture", name: "Ceinture", icon: "fn-ceinture", priceDelta: 3000 },
      { slug: "poches", name: "Poches", icon: "fn-poches", priceDelta: 2500 },
      { slug: "fente", name: "Fente", icon: "fn-fente", priceDelta: 2000 },
      { slug: "volant", name: "Volant", icon: "fn-volant", priceDelta: 4500 },
    ],
  },
];

/** First option of each group — the pre-selected default (Sumissura-style). */
export const DRESS_DETAIL_DEFAULTS: Record<string, string> = Object.fromEntries(
  DRESS_GROUPS.map((g) => [g.slug, g.options[0].slug]),
);

const OPTION_INDEX = new Map<string, DressOption>(
  DRESS_GROUPS.flatMap((g) => g.options.map((o) => [`${g.slug}:${o.slug}`, o])),
);

/** Total FCFA surcharge from the selected personalisation options. */
export function dressOptionsSurcharge(details: Record<string, string>): number {
  let sum = 0;
  for (const [group, option] of Object.entries(details)) {
    sum += OPTION_INDEX.get(`${group}:${option}`)?.priceDelta ?? 0;
  }
  return sum;
}

/** Human-readable "Encolure : Col V · Manches : Longues · …" for recap / notes. */
export function dressDetailSummary(
  details: Record<string, string>,
): { group: string; option: string; priceDelta: number }[] {
  return DRESS_GROUPS.flatMap((g) => {
    const opt = g.options.find((o) => o.slug === details[g.slug]);
    return opt ? [{ group: g.name, option: opt.name, priceDelta: opt.priceDelta ?? 0 }] : [];
  });
}
