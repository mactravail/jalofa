import type { BodyFigureKind, BodyFigureShape } from "@/lib/body-figure";
import type { StandardSize } from "@/lib/constants";
import { METERS_STEP, metrageFor, type Metrage } from "@/lib/fabric-metrage";
import type { GarmentModel, HeightBand, ModelBodyFit } from "@/lib/types";

// Le corps et la taille du client : deux choix indépendants, on peut être mince
// et faire 1,30 m comme 2 m. Ensemble, ils décident du métrage. Un modèle de
// tailleur porte ses propres métrages (`body_fits`). Pour le catalogue de la
// plateforme et les modèles publiés avant cette règle, des coefficients adaptent
// le tissu d'une personne moyenne (`fabric-metrage.ts`).

export type BodyType = BodyFigureShape;

export type BodyTypeOption = {
  slug: BodyType;
  /** Le mot affiché au client — il choisit son propre corps : jamais de mot blessant. */
  label: string;
  /** Coefficient appliqué au métrage d'une personne moyenne. */
  factor: number;
  /** Taille de vêtement probable (S, M…) : présélection discrète de l'étape Mesures. */
  size: StandardSize;
};

export const BODY_TYPES: BodyTypeOption[] = [
  { slug: "mince", label: "Mince", factor: 0.9, size: "S" },
  { slug: "moyen", label: "Moyen", factor: 1, size: "M" },
  { slug: "muscle", label: "Musclé", factor: 1.1, size: "L" },
  { slug: "fort", label: "Fort", factor: 1.2, size: "XL" },
  { slug: "tres_fort", label: "Très fort", factor: 1.35, size: "XXL" },
];

/** Ce qui se propose pour ce vêtement : un enfant n'a ni « musclé » ni « très fort ». */
export function bodyTypesFor(categorySlug: string | null | undefined): BodyTypeOption[] {
  if (categorySlug === "enfant") {
    return BODY_TYPES.filter(
      (b) => b.slug === "mince" || b.slug === "moyen" || b.slug === "fort",
    ).map((b) => (b.slug === "fort" ? { ...b, size: "L" } : b));
  }
  return BODY_TYPES;
}

/** La silhouette dessinée : celle d'une femme pour la collection femme, sinon d'un homme. */
export function bodyFigureKindFor(categorySlug: string | null | undefined): BodyFigureKind {
  return categorySlug === "femme" ? "femme" : "homme";
}

export function bodyTypeLabel(slug: BodyType | null): string | null {
  return BODY_TYPES.find((b) => b.slug === slug)?.label ?? null;
}

export type HeightBandOption = {
  slug: HeightBand;
  label: string;
  /** Version courte, pour les colonnes étroites du formulaire du tailleur. */
  short: string;
  /** Coefficient appliqué au métrage d'une personne moyenne. */
  factor: number;
};

const FACTORS: Record<HeightBand, number> = {
  petite: 0.9,
  moyenne: 1,
  grande: 1.15,
  tres_grande: 1.3,
};

const band = (slug: HeightBand, label: string, short: string): HeightBandOption => ({
  slug,
  label,
  short,
  factor: FACTORS[slug],
});

const ADULT_BANDS: HeightBandOption[] = [
  band("petite", "Moins de 1,60 m", "- de 1,60"),
  band("moyenne", "1,60 à 1,75 m", "1,60-1,75"),
  band("grande", "1,75 à 1,90 m", "1,75-1,90"),
  band("tres_grande", "Plus de 1,90 m", "+ de 1,90"),
];

const CHILD_BANDS: HeightBandOption[] = [
  band("petite", "Moins de 1,10 m", "- de 1,10"),
  band("moyenne", "1,10 à 1,25 m", "1,10-1,25"),
  band("grande", "1,25 à 1,40 m", "1,25-1,40"),
  band("tres_grande", "Plus de 1,40 m", "+ de 1,40"),
];

/** Les tailles estimées proposées pour ce vêtement. */
export function heightBandsFor(categorySlug: string | null | undefined): HeightBandOption[] {
  return categorySlug === "enfant" ? CHILD_BANDS : ADULT_BANDS;
}

export function heightBandLabel(
  categorySlug: string | null | undefined,
  slug: HeightBand | null,
): string | null {
  return heightBandsFor(categorySlug).find((b) => b.slug === slug)?.label ?? null;
}

/** Arrondi au demi-mètre SUPÉRIEUR : mieux vaut une chute qu'une pièce trop courte. */
function ceilToCut(meters: number): number {
  // toFixed : 5 × 1,1 vaut 5,500000000000001 en flottant, et monterait à 6 m.
  return Math.ceil(Number((meters / METERS_STEP).toFixed(6))) * METERS_STEP;
}

/** Ce que le tailleur a indiqué pour ce corps, s'il a bien donné des métrages. */
export function bodyFitFor(
  model: GarmentModel | null | undefined,
  body: BodyType | null,
): ModelBodyFit | null {
  const fit = model?.body_fits?.find((f) => f.body === body);
  return fit && Object.values(fit.meters ?? {}).some(Boolean) ? fit : null;
}

/**
 * Les silhouettes proposées sur ce modèle, avec ce que le tailleur en dit. Sans
 * indication de sa part : toutes celles du vêtement.
 */
export function bodyOptionsFor(
  model: GarmentModel | null | undefined,
): (BodyTypeOption & { fit: ModelBodyFit | null })[] {
  const options = bodyTypesFor(model?.category_slug).map((b) => ({
    ...b,
    fit: bodyFitFor(model, b.slug),
  }));
  const filled = options.filter((o) => o.fit);
  return filled.length > 0 ? filled : options;
}

/** Les mètres écrits par le tailleur pour ce corps et cette taille, s'il les a donnés. */
export function tailorMeters(
  model: GarmentModel | null | undefined,
  body: BodyType | null,
  height: HeightBand | null,
): number | null {
  if (!height) return null;
  return bodyFitFor(model, body)?.meters?.[height] ?? null;
}

/**
 * Le métrage de ce modèle pour ce corps et cette taille : celui du tailleur, qui
 * est aussi le minimum puisque c'est ce qu'il faut pour coudre la pièce. À défaut,
 * une estimation : le minimum grandit avec la personne (la pièce d'un corps fort
 * ne sort pas de la coupe minimale d'un corps moyen) mais ne descend jamais, c'est
 * la limite de l'atelier, même pour un corps mince.
 */
export function metrageForModelBody(
  model: GarmentModel | null,
  body: BodyType | null,
  height: HeightBand | null,
): Metrage {
  const meters = tailorMeters(model, body, height);
  if (meters) return { recommended: meters, minimum: meters };

  const metrage = metrageFor(model);
  const bodyFactor = BODY_TYPES.find((b) => b.slug === body)?.factor ?? 1;
  const heightFactor = height ? FACTORS[height] : 1;
  const factor = bodyFactor * heightFactor;
  const minimum = ceilToCut(metrage.minimum * Math.max(1, factor));
  return {
    minimum,
    recommended: Math.max(minimum, ceilToCut(metrage.recommended * factor)),
  };
}
