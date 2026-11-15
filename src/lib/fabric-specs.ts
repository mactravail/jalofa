// Fiche produit « Tissu » : unités de vente, propriétés physiques, entretien et
// usages. Les clés sont stockées telles quelles en base (cf. migration
// 20260901000001_fabric_product_specs.sql) ; les libellés FR passent par t().

export type SalesUnit = "METER" | "YARD" | "PAGNE_2_YARDS" | "COMPLET_6_YARDS";
export type FabricWeight = "LIGHT" | "MEDIUM" | "HEAVY";
export type FabricOpacity = "OPAQUE" | "SEMI_SHEER" | "SHEER";
export type FabricDrape = "FLUID" | "SEMI_STRUCTURED" | "RIGID";
export type FabricStretch = "NONE" | "SLIGHT" | "HIGH";
export type FabricPattern =
  | "SOLID"
  | "GEOMETRIC"
  | "FLORAL"
  | "STRIPED"
  | "EMBROIDERED"
  | "DAMASK";
export type CareInstruction =
  | "HAND_WASH"
  | "MACHINE_30"
  | "DRY_CLEAN_ONLY"
  | "NO_BLEACH"
  | "LOW_IRON";
export type RecommendedUsage =
  | "EVENING_DRESS"
  | "GRAND_BOUBOU"
  | "SHIRT_TOP"
  | "PANTS_SKIRT"
  | "SUIT"
  | "ACCESSORIES";

const YARD_M = 0.9144;

type UnitDef = {
  /** Ce que le vendeur choisit dans le formulaire. */
  label: string;
  /** Après le prix : « 3 500 FCFA / mètre ». */
  per: string;
  /** Une unité, plusieurs unités — pour le sélecteur de quantité. */
  one: string;
  many: string;
  /** Longueur réelle d'une unité, pour le métrage de l'atelier. */
  meters: number;
  /** Pas du sélecteur : au demi pour le mètre / yard, à la pièce sinon. */
  step: number;
};

export const SALES_UNITS: Record<SalesUnit, UnitDef> = {
  METER: { label: "Au mètre", per: "mètre", one: "mètre", many: "mètres", meters: 1, step: 0.5 },
  YARD: { label: "Au yard", per: "yard", one: "yard", many: "yards", meters: YARD_M, step: 0.5 },
  PAGNE_2_YARDS: {
    label: "Pagne (2 yards)",
    per: "pagne de 2 yards",
    one: "pagne",
    many: "pagnes",
    meters: 2 * YARD_M,
    step: 1,
  },
  COMPLET_6_YARDS: {
    label: "Complet (6 yards)",
    per: "complet de 6 yards",
    one: "complet",
    many: "complets",
    meters: 6 * YARD_M,
    step: 1,
  },
};

export const SALES_UNIT_KEYS = Object.keys(SALES_UNITS) as SalesUnit[];

export function parseSalesUnit(value: unknown): SalesUnit {
  return typeof value === "string" && value in SALES_UNITS ? (value as SalesUnit) : "METER";
}

type Priced = {
  sales_unit?: string | null;
  price_per_unit?: number | null;
  price_per_meter: number;
  min_order_qty?: number | null;
  color_variants?: Record<string, { price?: number | null; image_url?: string | null }> | null;
};

/** Le prix propre d'une couleur, s'il a été fixé par le vendeur. */
export function colorUnitPrice(fabric: Priced, color: string | null | undefined): number | null {
  if (!color) return null;
  const p = Number(fabric.color_variants?.[color]?.price ?? 0);
  return Number.isFinite(p) && p > 0 ? p : null;
}

/** La photo propre d'une couleur, sinon null (on garde la photo du tissu). */
export function colorImage(
  fabric: { color_variants?: Priced["color_variants"] },
  color: string | null | undefined,
): string | null {
  return (color && fabric.color_variants?.[color]?.image_url) || null;
}

export function fabricUnit(fabric: { sales_unit?: string | null }): UnitDef & { key: SalesUnit } {
  const key = parseSalesUnit(fabric.sales_unit);
  return { key, ...SALES_UNITS[key] };
}

/** Le prix affiché : celui de l'unité du vendeur (ou de la couleur choisie). */
export function fabricUnitPrice(fabric: Priced, color?: string | null): number {
  const own = colorUnitPrice(fabric, color);
  if (own != null) return own;
  const unit = fabricUnit(fabric);
  if (fabric.price_per_unit != null && Number(fabric.price_per_unit) > 0) {
    return Number(fabric.price_per_unit);
  }
  return Math.round(Number(fabric.price_per_meter) * unit.meters);
}

/** Prix au mètre dérivé — la colonne de calcul du configurateur. */
export function pricePerMeterFor(unit: SalesUnit, unitPrice: number): number {
  return Math.round((unitPrice / SALES_UNITS[unit].meters) * 100) / 100;
}

/** Quantité minimum : jamais sous un pas de l'unité. */
export function fabricMinQty(fabric: Priced): number {
  const unit = fabricUnit(fabric);
  const min = Number(fabric.min_order_qty ?? 1);
  return Math.max(unit.step, Number.isFinite(min) && min > 0 ? min : 1);
}

/** Nombre d'unités → mètres réels (ce que l'atelier coupe). */
export function unitsToMeters(fabric: { sales_unit?: string | null }, qty: number): number {
  return Math.round(qty * fabricUnit(fabric).meters * 100) / 100;
}

/** Mètres (stockés sur la commande) → nombre d'unités, arrondi au pas. */
export function metersToUnits(fabric: { sales_unit?: string | null }, meters: number): number {
  const unit = fabricUnit(fabric);
  const raw = meters / unit.meters;
  return Math.max(unit.step, Math.round(raw / unit.step) * unit.step);
}

/**
 * Prix d'un tissu acheté seul pour `meters` mètres. Au mètre, c'est le calcul
 * historique ; pour une autre unité, on repasse au nombre d'unités pour que le
 * total soit exactement N × prix de l'unité (pas d'arrondi de conversion).
 */
export function fabricLinePrice(fabric: Priced, meters: number, color?: string | null): number {
  const unit = fabricUnit(fabric);
  const own = colorUnitPrice(fabric, color);
  if (unit.key === "METER") return Math.round((own ?? Number(fabric.price_per_meter)) * meters);
  return Math.round(fabricUnitPrice(fabric, color) * metersToUnits(fabric, meters));
}

/**
 * Stock restant, dans l'unité de vente (colonne historique `stock_meters`).
 * `null` = stock non suivi (ancien tissu publié sans quantité) : il reste en
 * vente tant que le vendeur ne le déclare pas épuisé. La base décompte chaque
 * vente payée et passe le tissu « épuisé » à zéro (migration 20260902000001).
 */
export function fabricStock(fabric: { stock_meters?: number | null }): number | null {
  const n = Number(fabric.stock_meters ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** « 3 mètres », « 1 complet », « 2,5 yards ». */
export function formatUnits(fabric: { sales_unit?: string | null }, qty: number, locale = "fr-FR"): string {
  const unit = fabricUnit(fabric);
  const n = qty.toLocaleString(locale, { maximumFractionDigits: 1 });
  return `${n} ${qty > 1 ? unit.many : unit.one}`;
}

// --- Propriétés physiques ---------------------------------------------------

export const WEIGHTS: Record<FabricWeight, { label: string; hint: string }> = {
  LIGHT: { label: "Léger", hint: "moins de 130 g/m²" },
  MEDIUM: { label: "Moyen", hint: "130 à 220 g/m²" },
  HEAVY: { label: "Épais", hint: "plus de 220 g/m²" },
};

export const OPACITIES: Record<FabricOpacity, { label: string; hint?: string }> = {
  OPAQUE: { label: "Opaque" },
  SEMI_SHEER: { label: "Légèrement transparent" },
  SHEER: { label: "Transparent", hint: "doublure requise" },
};

export const DRAPES: Record<FabricDrape, { label: string }> = {
  FLUID: { label: "Fluide" },
  SEMI_STRUCTURED: { label: "Semi-rigide" },
  RIGID: { label: "Rigide / Amidonné" },
};

export const STRETCHES: Record<FabricStretch, { label: string }> = {
  NONE: { label: "Non extensible" },
  SLIGHT: { label: "Légèrement extensible" },
  HIGH: { label: "Stretch" },
};

export const PATTERNS: Record<FabricPattern, { label: string }> = {
  SOLID: { label: "Uni" },
  GEOMETRIC: { label: "Géométrique" },
  FLORAL: { label: "Fleuri" },
  STRIPED: { label: "Rayé" },
  EMBROIDERED: { label: "Brodé" },
  DAMASK: { label: "Damassé" },
};

export const CARE_INSTRUCTIONS: Record<CareInstruction, { label: string }> = {
  HAND_WASH: { label: "Lavage à la main" },
  MACHINE_30: { label: "Machine 30 °C" },
  DRY_CLEAN_ONLY: { label: "Nettoyage à sec uniquement" },
  NO_BLEACH: { label: "Pas d'eau de Javel" },
  LOW_IRON: { label: "Repassage doux" },
};

export const USAGES: Record<RecommendedUsage, { label: string; filter: UsageFilter }> = {
  EVENING_DRESS: { label: "Robe de soirée", filter: "soiree" },
  GRAND_BOUBOU: { label: "Grand boubou", filter: "ceremonie" },
  SHIRT_TOP: { label: "Chemise / Haut", filter: "quotidien" },
  PANTS_SKIRT: { label: "Pantalon / Jupe", filter: "quotidien" },
  SUIT: { label: "Costume", filter: "costume" },
  ACCESSORIES: { label: "Accessoires", filter: "quotidien" },
};

/** Les 4 familles du filtre catalogue — chacune regroupe des usages. */
export type UsageFilter = "ceremonie" | "quotidien" | "soiree" | "costume";
export const USAGE_FILTERS: { slug: UsageFilter; name: string }[] = [
  { slug: "ceremonie", name: "Cérémonie" },
  { slug: "quotidien", name: "Quotidien" },
  { slug: "soiree", name: "Soirée" },
  { slug: "costume", name: "Costume" },
];
export function usagesForFilter(filter: string): RecommendedUsage[] {
  return (Object.keys(USAGES) as RecommendedUsage[]).filter((u) => USAGES[u].filter === filter);
}

/** Suggestions du champ « Marque / Origine ». */
export const BRAND_SUGGESTIONS = ["Vlisco", "Uniwax", "Hitarget", "Getzner", "Artisanal local"];

/** Fourchettes du filtre prix (FCFA, prix de l'unité de vente). */
export const PRICE_RANGES: { slug: string; name: string; min?: number; max?: number }[] = [
  { slug: "0-5000", name: "Moins de 5 000 FCFA", max: 5000 },
  { slug: "5000-15000", name: "5 000 à 15 000 FCFA", min: 5000, max: 15000 },
  { slug: "15000-50000", name: "15 000 à 50 000 FCFA", min: 15000, max: 50000 },
  { slug: "50000-", name: "Plus de 50 000 FCFA", min: 50000 },
];

/** Le guide « Combien de mètres commander ? ». */
export const METRAGE_GUIDE: { label: string; meters: string }[] = [
  { label: "Chemise manches courtes / Haut", meters: "1,5 à 2 m" },
  { label: "Robe simple ou Jupe", meters: "2 à 3 m" },
  { label: "Ensemble complet (Haut + Pantalon/Jupe)", meters: "3,5 à 4 m" },
  { label: "Grand Boubou complet", meters: "5 à 6 m (ou 1 complet de 6 yards)" },
];

/** Garde une clé connue d'un dictionnaire, sinon null. */
export function pickKey<K extends string>(dict: Record<K, unknown>, value: unknown): K | null {
  return typeof value === "string" && value in dict ? (value as K) : null;
}
