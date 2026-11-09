import { bodyTypesFor, heightBandsFor, type BodyType } from "@/lib/body-types";
import { MAX_METERS, METERS_STEP } from "@/lib/fabric-metrage";
import type { BodyRange, BodyRangeKey, HeightBand, ModelBodyFit } from "@/lib/types";

// Le tableau qu'un tailleur publie avec son modèle : pour chaque silhouette, les
// mètres de tissu qu'il faut selon la taille de la personne, et les intervalles de
// mesures du corps (en cm). Ces règles tournent des deux côtés : le formulaire
// prévient, le serveur décide.

export const BODY_RANGE_FIELDS: { key: BodyRangeKey; label: string }[] = [
  { key: "chest", label: "Poitrine" },
  { key: "waist", label: "Tour de taille" },
  { key: "hips", label: "Hanches" },
  { key: "shoulders", label: "Épaules" },
];

/** Poitrine · taille · hanches · épaules : [min, max] en cm. */
type RangeRow = [[number, number], [number, number], [number, number], [number, number]];

// Des points de départ pour éviter 40 chiffres à taper sur un téléphone. Ils
// viennent d'une estimation et le tailleur les corrige : seuls les mètres de
// tissu restent à écrire de sa main, ils ne sont jamais pré-remplis.
const HOMME: Record<BodyType, RangeRow> = {
  mince: [[82, 92], [68, 78], [84, 92], [40, 44]],
  moyen: [[92, 102], [78, 88], [92, 100], [43, 47]],
  muscle: [[102, 114], [78, 90], [96, 104], [47, 52]],
  fort: [[104, 118], [92, 108], [104, 116], [46, 51]],
  tres_fort: [[118, 140], [108, 135], [116, 135], [49, 55]],
};
const FEMME: Record<BodyType, RangeRow> = {
  mince: [[78, 86], [60, 68], [84, 92], [36, 39]],
  moyen: [[86, 96], [68, 78], [92, 102], [38, 41]],
  muscle: [[92, 100], [70, 80], [94, 102], [41, 45]],
  fort: [[98, 112], [82, 98], [104, 118], [41, 45]],
  tres_fort: [[112, 135], [98, 125], [118, 140], [44, 50]],
};
const ENFANT: Partial<Record<BodyType, RangeRow>> = {
  mince: [[56, 64], [52, 58], [58, 66], [28, 32]],
  moyen: [[62, 70], [56, 62], [64, 72], [30, 34]],
  fort: [[68, 80], [62, 74], [72, 84], [32, 37]],
};

/** Les intervalles proposés au départ pour cette silhouette. */
export function defaultBodyRanges(
  categorySlug: string | null | undefined,
  body: BodyType,
): Record<BodyRangeKey, BodyRange> {
  const table =
    categorySlug === "enfant" ? ENFANT : categorySlug === "femme" ? FEMME : HOMME;
  const row = table[body] ?? HOMME[body];
  return Object.fromEntries(
    BODY_RANGE_FIELDS.map((f, i) => [f.key, { min: row[i][0], max: row[i][1] }]),
  ) as Record<BodyRangeKey, BodyRange>;
}

/** Ce qui empêche de publier ce tableau, en mots simples. `null` : tout va bien. */
export function modelBodyFitProblem(
  fits: ModelBodyFit[],
  categorySlug: string | null | undefined,
): string | null {
  for (const option of bodyTypesFor(categorySlug)) {
    const fit = fits.find((f) => f.body === option.slug);
    for (const band of heightBandsFor(categorySlug)) {
      if (!fit?.meters?.[band.slug]) {
        return `Silhouette « ${option.label} », taille ${band.label} : indiquez les mètres de tissu.`;
      }
    }
    for (const field of BODY_RANGE_FIELDS) {
      const range = fit?.ranges?.[field.key];
      if (range?.min == null || range.max == null) {
        return `Silhouette « ${option.label} » : complétez « ${field.label} ».`;
      }
      if (range.min > range.max) {
        return `Silhouette « ${option.label} » : pour « ${field.label} », le premier chiffre doit être le plus petit.`;
      }
    }
  }
  return null;
}

function cleanLength(raw: unknown): number | null {
  const value = Number(raw);
  if (raw === null || raw === "" || !Number.isFinite(value)) return null;
  if (value <= 0 || value > 300) return null;
  return Math.round(value * 10) / 10;
}

/** Le tissu se coupe au demi-mètre : on arrondit au-dessus, jamais trop court. */
function cleanMeters(raw: unknown): number | null {
  const value = Number(raw);
  if (raw === null || raw === "" || !Number.isFinite(value) || value <= 0) return null;
  // toFixed : 0,1 + 0,2 et consorts ne doivent pas ajouter un demi-mètre fantôme.
  const steps = Math.ceil(Number((value / METERS_STEP).toFixed(6)));
  return Math.min(MAX_METERS, steps * METERS_STEP);
}

/**
 * Relit le tableau envoyé par le formulaire, sans rien tenir pour acquis. Seules
 * les silhouettes de ce vêtement sont gardées ; un brouillon peut rester incomplet.
 */
export function parseModelBodyFits(
  raw: FormDataEntryValue | null,
  categorySlug: string | null | undefined,
): ModelBodyFit[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const entries = parsed as unknown[];

  return bodyTypesFor(categorySlug).flatMap((option): ModelBodyFit[] => {
    const entry = entries.find(
      (e) => e && typeof e === "object" && (e as { body?: unknown }).body === option.slug,
    ) as { meters?: unknown; ranges?: unknown } | undefined;
    if (!entry) return [];

    const meters = (entry.meters ?? {}) as Record<string, unknown>;
    const ranges = (entry.ranges ?? {}) as Record<string, { min?: unknown; max?: unknown } | undefined>;
    return [
      {
        body: option.slug,
        meters: Object.fromEntries(
          heightBandsFor(categorySlug).map((b) => [b.slug, cleanMeters(meters[b.slug])]),
        ) as Record<HeightBand, number | null>,
        ranges: Object.fromEntries(
          BODY_RANGE_FIELDS.map((f) => [
            f.key,
            { min: cleanLength(ranges[f.key]?.min), max: cleanLength(ranges[f.key]?.max) },
          ]),
        ) as Record<BodyRangeKey, BodyRange>,
      },
    ];
  });
}

/**
 * Un tableau complet, tel qu'un tailleur le publierait : pour les modèles de démo.
 * Mètres par taille, de la plus petite à la plus grande.
 */
export function demoBodyFits(
  categorySlug: string,
  meters: Partial<Record<BodyType, [number, number, number, number]>>,
): ModelBodyFit[] {
  return bodyTypesFor(categorySlug).map((option) => ({
    body: option.slug,
    meters: Object.fromEntries(
      heightBandsFor(categorySlug).map((b, i) => [b.slug, meters[option.slug]?.[i] ?? null]),
    ) as Record<HeightBand, number | null>,
    ranges: defaultBodyRanges(categorySlug, option.slug),
  }));
}
