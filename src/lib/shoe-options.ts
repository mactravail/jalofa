import type { ShoeIconName } from "@/components/shoes/shoe-icons";

// Catalogue for the men's made-to-measure shoe configurator ("Chaussures sur
// mesure → Personnaliser"), modelled on Hockerty's split-screen shoe designer.
// Everything here is a client-side constant — there are no shoe photos or
// leather rows in the demo database, so the live preview is a parametric SVG
// (`shoe-preview.tsx`) driven by these options. Labels are French (Senegalese
// market); price deltas are in FCFA and add on top of the atelier base price.

// ---------------------------------------------------------------------------
// Base model (silhouette) — the first, biggest choice
// ---------------------------------------------------------------------------

/** How the instep of the preview shoe is drawn. */
export type ShoeVamp = "lace" | "buckle" | "strap" | "plain";

export type ShoeModel = {
  slug: string;
  name: string;
  hint: string;
  icon: ShoeIconName;
  /** Ankle-high boot vs. low shoe — drives the preview outline. */
  shape: "low" | "boot";
  /** Instep treatment drawn on the preview. */
  vamp: ShoeVamp;
  /** Whether the lace-colour section applies to this model. */
  laced: boolean;
  /** Surcharge in FCFA added to the atelier base price (0 = included). */
  priceDelta?: number;
};

export const SHOE_MODELS: ShoeModel[] = [
  {
    slug: "oxford",
    name: "Oxford",
    hint: "Laçage fermé, l'élégance classique",
    icon: "m-oxford",
    shape: "low",
    vamp: "lace",
    laced: true,
  },
  {
    slug: "derby",
    name: "Derby",
    hint: "Laçage ouvert, plus polyvalent",
    icon: "m-derby",
    shape: "low",
    vamp: "lace",
    laced: true,
  },
  {
    slug: "monk",
    name: "Double boucle",
    hint: "Fermeture à boucles, sans lacets",
    icon: "m-monk",
    shape: "low",
    vamp: "buckle",
    laced: false,
    priceDelta: 8000,
  },
  {
    slug: "mocassin",
    name: "Mocassin",
    hint: "À enfiler, tablier cousu main",
    icon: "m-mocassin",
    shape: "low",
    vamp: "strap",
    laced: false,
  },
  {
    slug: "brogue",
    name: "Full brogue",
    hint: "Bout fleuri et perforations",
    icon: "m-brogue",
    shape: "low",
    vamp: "lace",
    laced: true,
    priceDelta: 6000,
  },
  {
    slug: "bottine",
    name: "Bottine Chelsea",
    hint: "Montante, à élastiques",
    icon: "m-bottine",
    shape: "boot",
    vamp: "plain",
    laced: false,
    priceDelta: 12000,
  },
];

// ---------------------------------------------------------------------------
// Leather + colour — CSS swatches (no images), filterable by material
// ---------------------------------------------------------------------------

export type LeatherMaterial = { slug: string; name: string };

export const LEATHER_MATERIALS: LeatherMaterial[] = [
  { slug: "lisse", name: "Veau lisse" },
  { slug: "graine", name: "Cuir grainé" },
  { slug: "daim", name: "Daim" },
];

export type ShoeLeather = {
  slug: string;
  name: string;
  materialSlug: string;
  /** Body fill colour used by the preview. */
  color: string;
  /** Suede = matte, no glossy highlight in the preview. */
  suede?: boolean;
  priceDelta?: number;
};

export const SHOE_LEATHERS: ShoeLeather[] = [
  { slug: "noir", name: "Noir", materialSlug: "lisse", color: "#1c1c1e" },
  { slug: "brun-fonce", name: "Brun foncé", materialSlug: "lisse", color: "#3c2418" },
  { slug: "acajou", name: "Acajou", materialSlug: "lisse", color: "#5a2d20" },
  { slug: "marron", name: "Marron", materialSlug: "lisse", color: "#7c4a26" },
  { slug: "cognac", name: "Cognac", materialSlug: "lisse", color: "#a75f2e" },
  { slug: "bordeaux", name: "Bordeaux", materialSlug: "lisse", color: "#5c1f2a" },
  { slug: "marine", name: "Bleu marine", materialSlug: "lisse", color: "#28324e" },
  {
    slug: "graine-noir",
    name: "Grainé noir",
    materialSlug: "graine",
    color: "#232120",
    priceDelta: 4000,
  },
  {
    slug: "graine-brun",
    name: "Grainé brun",
    materialSlug: "graine",
    color: "#4a3527",
    priceDelta: 4000,
  },
  {
    slug: "daim-taupe",
    name: "Daim taupe",
    materialSlug: "daim",
    color: "#8b7458",
    suede: true,
    priceDelta: 6000,
  },
  {
    slug: "daim-bleu",
    name: "Daim bleu nuit",
    materialSlug: "daim",
    color: "#3f4f68",
    suede: true,
    priceDelta: 6000,
  },
  {
    slug: "daim-vert",
    name: "Daim vert forêt",
    materialSlug: "daim",
    color: "#485440",
    suede: true,
    priceDelta: 6000,
  },
];

// ---------------------------------------------------------------------------
// Illustrated design groups (toe / sole / lining / finish)
// ---------------------------------------------------------------------------

export type ShoeOption = {
  slug: string;
  name: string;
  icon: ShoeIconName;
  priceDelta?: number;
};

export type ShoeGroup = {
  slug: string;
  name: string;
  hint: string;
  options: ShoeOption[];
};

export const SHOE_GROUPS: ShoeGroup[] = [
  {
    slug: "bout",
    name: "Bout",
    hint: "Le dessin de la pointe",
    options: [
      { slug: "uni", name: "Bout uni", icon: "t-droit" },
      { slug: "golf", name: "Bout golf", icon: "t-cap", priceDelta: 3000 },
      { slug: "fleuri", name: "Bout fleuri", icon: "t-fleuri", priceDelta: 6000 },
    ],
  },
  {
    slug: "semelle",
    name: "Semelle",
    hint: "Ce qui vous porte au quotidien",
    options: [
      { slug: "cuir", name: "Cuir cousu", icon: "s-cuir" },
      { slug: "gomme", name: "Gomme City", icon: "s-gomme", priceDelta: 2000 },
      { slug: "goodyear", name: "Cousu Goodyear", icon: "s-goodyear", priceDelta: 9000 },
    ],
  },
  {
    slug: "doublure",
    name: "Doublure",
    hint: "L'intérieur de la chaussure",
    options: [
      { slug: "veau", name: "Cuir de veau", icon: "d-cuir" },
      { slug: "agneau", name: "Peau d'agneau", icon: "d-agneau", priceDelta: 5000 },
      { slug: "textile", name: "Toile respirante", icon: "d-textile" },
    ],
  },
  {
    slug: "finition",
    name: "Finition",
    hint: "Le rendu du cuir",
    options: [
      { slug: "naturelle", name: "Naturelle", icon: "f-naturelle" },
      { slug: "patine", name: "Patine main", icon: "f-patine", priceDelta: 12000 },
      { slug: "vernis", name: "Glaçage verni", icon: "f-vernis", priceDelta: 8000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Laces + monogram
// ---------------------------------------------------------------------------

export type LaceColor = {
  slug: string;
  name: string;
  /** null = match the leather colour ("ton sur ton"). */
  color: string | null;
  priceDelta?: number;
};

export const LACE_COLORS: LaceColor[] = [
  { slug: "ton", name: "Ton sur ton", color: null },
  { slug: "noir", name: "Noir", color: "#1c1c1e" },
  { slug: "brun", name: "Brun", color: "#5a3620" },
  { slug: "ecru", name: "Écru", color: "#d9c9a3" },
  { slug: "rouge", name: "Rouge", color: "#7a1f24", priceDelta: 1000 },
];

/** Surcharge in FCFA for an engraved monogram (heel counter). */
export const MONOGRAM_PRICE = 5000;

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/** Atelier base price for a pair of made-to-measure shoes, in FCFA. */
export const SHOE_BASE_PRICE = 55000;

/** First option of each illustrated group — the pre-selected default. */
export const SHOE_DETAIL_DEFAULTS: Record<string, string> = Object.fromEntries(
  SHOE_GROUPS.map((g) => [g.slug, g.options[0].slug]),
);

const OPTION_INDEX = new Map<string, ShoeOption>(
  SHOE_GROUPS.flatMap((g) => g.options.map((o) => [`${g.slug}:${o.slug}`, o])),
);

/** Total FCFA surcharge from the selected illustrated options. */
export function shoeOptionsSurcharge(details: Record<string, string>): number {
  let sum = 0;
  for (const [group, option] of Object.entries(details)) {
    sum += OPTION_INDEX.get(`${group}:${option}`)?.priceDelta ?? 0;
  }
  return sum;
}

/** Human-readable "Bout : Bout golf · Semelle : Cuir cousu · …" for recap. */
export function shoeDetailSummary(
  details: Record<string, string>,
): { group: string; option: string; priceDelta: number }[] {
  return SHOE_GROUPS.flatMap((g) => {
    const opt = g.options.find((o) => o.slug === details[g.slug]);
    return opt ? [{ group: g.name, option: opt.name, priceDelta: opt.priceDelta ?? 0 }] : [];
  });
}
