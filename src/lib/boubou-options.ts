import type { BoubouIconName } from "@/components/men/boubou-icons";

// Catalogue for the men's three-piece grand boubou configurator ("Grand boubou
// sur mesure → Personnaliser"). Unlike the dress and shoe configurators — which
// personalise a single garment — a grand boubou is sold and sewn as THREE
// pieces, and each one is customised on its own:
//
//   1. `boubou`    — the wide ceremonial robe worn on top,
//   2. `interieur` — the kaftan worn underneath,
//   3. `pantalon`  — the matching trousers (tubay).
//
// Everything here is a client-side constant. Labels are French (Senegalese
// market); price deltas are in FCFA and add on top of the atelier base price
// and the chosen fabric(s).
//
// La personnalisation, elle, passe par le configurateur commun à tous les
// vêtements (cf. `style-options.ts`) : ce qui reste ici, c'est le chiffrage
// « pris tel quel » en trois pièces de /homme/grand-boubou-sur-mesure.

export type BoubouOption = {
  slug: string;
  name: string;
  icon: BoubouIconName;
  /** Surcharge in FCFA added to the atelier base price (0 / absent = included). */
  priceDelta?: number;
};

export type BoubouGroup = {
  slug: string;
  name: string;
  hint: string;
  options: BoubouOption[];
};

export type BoubouPiece = {
  slug: string;
  /** Full name, e.g. "Boubou intérieur". */
  name: string;
  /** Compact name for the piece tabs. */
  short: string;
  hint: string;
  /** Metres of fabric this piece consumes — used to price its fabric. */
  fabricMeters: number;
  groups: BoubouGroup[];
};

/** Atelier base price for the complete three-piece grand boubou, in FCFA. */
export const BOUBOU_BASE_PRICE = 45000;

// The stitching group is offered on all three pieces — same options, same
// prices — so it is built once and reused.
const coutureGroup = (hint: string): BoubouGroup => ({
  slug: "couture",
  name: "Type de couture",
  hint,
  options: [
    { slug: "machine", name: "Machine standard", icon: "cu-machine" },
    { slug: "anglaise", name: "Couture anglaise", icon: "cu-anglaise", priceDelta: 4000 },
    { slug: "surpiquee", name: "Surpiqûre contrastée", icon: "cu-surpiquee", priceDelta: 3000 },
    { slug: "main", name: "Cousu main", icon: "cu-main", priceDelta: 18000 },
  ],
});

export const BOUBOU_PIECES: BoubouPiece[] = [
  // -------------------------------------------------------------------------
  // 1 — Grand boubou (the ceremonial robe worn on top)
  // -------------------------------------------------------------------------
  {
    slug: "boubou",
    name: "Grand boubou",
    short: "Grand boubou",
    hint: "La pièce d'apparat, portée par-dessus",
    fabricMeters: 6,
    groups: [
      {
        slug: "type",
        name: "Type de grand boubou",
        hint: "L'ampleur et l'allure générale",
        options: [
          { slug: "classique", name: "Classique (Mbubb)", icon: "gb-classique" },
          { slug: "royal", name: "Royal, très ample", icon: "gb-royal", priceDelta: 12000 },
          { slug: "moderne", name: "Moderne ajusté", icon: "gb-moderne", priceDelta: 6000 },
          { slug: "court", name: "Court (3/4)", icon: "gb-court" },
          { slug: "capuche", name: "À capuche", icon: "gb-capuche", priceDelta: 8000 },
        ],
      },
      {
        slug: "col",
        name: "Col",
        hint: "L'encolure du boubou",
        options: [
          { slug: "rond", name: "Col rond", icon: "col-rond" },
          { slug: "v", name: "Col V", icon: "col-v" },
          { slug: "mao", name: "Col Mao", icon: "col-mao", priceDelta: 2000 },
          { slug: "carre", name: "Col carré", icon: "col-carre" },
          { slug: "chale", name: "Col châle", icon: "col-chale", priceDelta: 4000 },
        ],
      },
      {
        slug: "broderie",
        name: "Broderie",
        hint: "Le sfifa qui signe la pièce",
        options: [
          { slug: "sans", name: "Sans broderie", icon: "br-sans" },
          { slug: "simple", name: "Sfifa simple", icon: "br-simple", priceDelta: 5000 },
          { slug: "riche", name: "Broderie riche", icon: "br-riche", priceDelta: 15000 },
          { slug: "doree", name: "Fils dorés", icon: "br-doree", priceDelta: 25000 },
          { slug: "complete", name: "Brodé main intégral", icon: "br-complete", priceDelta: 45000 },
        ],
      },
      coutureGroup("La finition des assemblages"),
      {
        slug: "longueur",
        name: "Longueur",
        hint: "Où tombe le boubou",
        options: [
          { slug: "cheville", name: "Cheville", icon: "lo-cheville" },
          { slug: "mollet", name: "Mi-mollet", icon: "lo-mollet" },
          { slug: "genou", name: "Au genou", icon: "lo-genou" },
        ],
      },
      {
        slug: "poches",
        name: "Poches",
        hint: "La grande poche poitrine est la plus traditionnelle",
        options: [
          { slug: "poitrine", name: "Poche poitrine", icon: "po-poitrine" },
          { slug: "laterales", name: "Poches latérales", icon: "po-laterales", priceDelta: 2000 },
          { slug: "sans", name: "Sans poche", icon: "po-sans" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2 — Boubou intérieur (the kaftan worn underneath)
  // -------------------------------------------------------------------------
  {
    slug: "interieur",
    name: "Boubou intérieur",
    short: "Intérieur",
    hint: "Le kaftan porté dessous, visible aux manches et au col",
    fabricMeters: 3,
    groups: [
      {
        slug: "type",
        name: "Type de kaftan",
        hint: "La coupe de la pièce intérieure",
        options: [
          { slug: "droit", name: "Kaftan droit", icon: "in-droit" },
          { slug: "cintre", name: "Kaftan cintré", icon: "in-cintre", priceDelta: 4000 },
          { slug: "chemise", name: "Chemise longue", icon: "in-chemise" },
          { slug: "tunique", name: "Tunique courte", icon: "in-tunique" },
        ],
      },
      {
        slug: "col",
        name: "Col",
        hint: "Il dépasse du grand boubou : soignez-le",
        options: [
          { slug: "mao", name: "Col Mao", icon: "col-mao" },
          { slug: "rond", name: "Col rond", icon: "col-rond" },
          { slug: "v", name: "Col V", icon: "col-v" },
          { slug: "officier", name: "Col officier", icon: "col-officier", priceDelta: 2500 },
        ],
      },
      {
        slug: "manches",
        name: "Manches",
        hint: "Longueur des manches sous le boubou",
        options: [
          { slug: "longues", name: "Longues", icon: "ma-longues" },
          { slug: "troisquarts", name: "Trois-quarts", icon: "ma-troisquarts" },
          { slug: "courtes", name: "Courtes", icon: "ma-courtes" },
        ],
      },
      {
        slug: "broderie",
        name: "Broderie",
        hint: "Sur les parties qui restent visibles",
        options: [
          { slug: "sans", name: "Sans broderie", icon: "br-sans" },
          { slug: "col", name: "Col brodé", icon: "br-col", priceDelta: 4000 },
          { slug: "poignets", name: "Col + poignets", icon: "br-poignets", priceDelta: 7000 },
          { slug: "riche", name: "Broderie riche", icon: "br-riche", priceDelta: 12000 },
        ],
      },
      coutureGroup("La finition des assemblages du kaftan"),
      {
        slug: "fermeture",
        name: "Fermeture",
        hint: "Comment il s'enfile",
        options: [
          { slug: "boutons", name: "Boutons", icon: "fe-boutons" },
          { slug: "sans", name: "À enfiler", icon: "fe-sans" },
          { slug: "zip", name: "Zip dissimulé", icon: "fe-zip", priceDelta: 2500 },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3 — Pantalon (tubay)
  // -------------------------------------------------------------------------
  {
    slug: "pantalon",
    name: "Pantalon (tubay)",
    short: "Pantalon",
    hint: "Le pantalon assorti, coupé dans le même esprit",
    fabricMeters: 2.5,
    groups: [
      {
        slug: "coupe",
        name: "Coupe du pantalon",
        hint: "L'ampleur de la jambe",
        options: [
          { slug: "tubay", name: "Tubay traditionnel", icon: "pa-tubay" },
          { slug: "droit", name: "Droit", icon: "pa-droit" },
          { slug: "ajuste", name: "Ajusté moderne", icon: "pa-ajuste", priceDelta: 3000 },
          { slug: "sarouel", name: "Sarouel", icon: "pa-sarouel", priceDelta: 5000 },
        ],
      },
      {
        slug: "taille",
        name: "Ceinture",
        hint: "Le maintien à la taille",
        options: [
          { slug: "cordon", name: "Cordon coulissant", icon: "ta-cordon" },
          { slug: "elastique", name: "Élastique", icon: "ta-elastique" },
          { slug: "boutonnee", name: "Boutonnée + passants", icon: "ta-boutonnee", priceDelta: 3500 },
        ],
      },
      {
        slug: "bas",
        name: "Bas de jambe",
        hint: "La finition sur la chaussure",
        options: [
          { slug: "simple", name: "Ourlet simple", icon: "ba-simple" },
          { slug: "resserre", name: "Resserré cheville", icon: "ba-resserre", priceDelta: 2000 },
          { slug: "ouvert", name: "Ouvert évasé", icon: "ba-ouvert" },
        ],
      },
      {
        slug: "broderie",
        name: "Broderie",
        hint: "Un rappel du motif du boubou",
        options: [
          { slug: "sans", name: "Sans broderie", icon: "br-sans" },
          { slug: "bas", name: "Bas de jambe brodé", icon: "br-bas", priceDelta: 5000 },
          { slug: "poches", name: "Poches brodées", icon: "br-poches", priceDelta: 4000 },
        ],
      },
      coutureGroup("La finition des assemblages du pantalon"),
      {
        slug: "poches",
        name: "Poches",
        hint: "Où ranger l'essentiel",
        options: [
          { slug: "laterales", name: "Latérales", icon: "pp-laterales" },
          { slug: "arriere", name: "Latérales + arrière", icon: "pp-arriere", priceDelta: 2000 },
          { slug: "sans", name: "Sans poche", icon: "pp-sans" },
        ],
      },
    ],
  },
];

/** Total metres of fabric for the three pieces — used for the recap. */
export const BOUBOU_FABRIC_METERS = BOUBOU_PIECES.reduce(
  (m, p) => m + p.fabricMeters,
  0,
);

/** Selected option slug per group, per piece: `{ boubou: { col: "v" }, … }`. */
export type BoubouDetails = Record<string, Record<string, string>>;

/** First option of each group — the pre-selected default (Hockerty-style). */
export const BOUBOU_DETAIL_DEFAULTS: BoubouDetails = Object.fromEntries(
  BOUBOU_PIECES.map((p) => [
    p.slug,
    Object.fromEntries(p.groups.map((g) => [g.slug, g.options[0].slug])),
  ]),
);

// `piece:group:option` → option, so surcharges stay O(1) per lookup even though
// several pieces share group slugs ("broderie", "couture", "poches"…).
const OPTION_INDEX = new Map<string, BoubouOption>(
  BOUBOU_PIECES.flatMap((p) =>
    p.groups.flatMap((g) =>
      g.options.map((o) => [`${p.slug}:${g.slug}:${o.slug}`, o] as const),
    ),
  ),
);

/** FCFA surcharge from the options selected on one piece. */
export function boubouPieceSurcharge(
  pieceSlug: string,
  details: Record<string, string> | undefined,
): number {
  if (!details) return 0;
  let sum = 0;
  for (const [group, option] of Object.entries(details)) {
    sum += OPTION_INDEX.get(`${pieceSlug}:${group}:${option}`)?.priceDelta ?? 0;
  }
  return sum;
}

/** Total FCFA surcharge across the three pieces. */
export function boubouOptionsSurcharge(details: BoubouDetails): number {
  return BOUBOU_PIECES.reduce(
    (sum, p) => sum + boubouPieceSurcharge(p.slug, details[p.slug]),
    0,
  );
}

/** The chosen option of every group of a piece, in catalogue order. */
export function boubouPieceChoices(
  piece: BoubouPiece,
  details: Record<string, string> | undefined,
): { group: BoubouGroup; option: BoubouOption }[] {
  return piece.groups.map((group) => ({
    group,
    option:
      group.options.find((o) => o.slug === details?.[group.slug]) ?? group.options[0],
  }));
}

/**
 * Flat "Grand boubou · Col : Col V" rows for the recap, the cart line and the
 * tailor notes. The piece name is folded into `group` so the three pieces stay
 * distinguishable in a flat list.
 */
export function boubouDetailSummary(
  details: BoubouDetails,
): { group: string; option: string; priceDelta: number }[] {
  return BOUBOU_PIECES.flatMap((piece) =>
    boubouPieceChoices(piece, details[piece.slug]).map(({ group, option }) => ({
      group: `${piece.name} · ${group.name}`,
      option: option.name,
      priceDelta: option.priceDelta ?? 0,
    })),
  );
}
