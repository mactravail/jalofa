// « Tel quel » = prêt-à-porter : un modèle qu'un tailleur a déjà cousu, prêt à
// partir. Seul le tailleur qui publie le modèle peut l'ouvrir, en disant dans
// quelles couleurs il l'a. Le catalogue JALOFA (sans tailleur) n'est jamais
// vendu « tel quel » : il ne se commande que sur mesure.

import { STANDARD_SIZES } from "@/lib/constants";
import type { GarmentModel } from "@/lib/types";

export const MAX_READY_COLORS = 12;

/** Couleurs proposées d'un toucher au tailleur ; il peut en écrire d'autres. */
export const READY_COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: "Blanc", hex: "#f5f5f4" },
  { name: "Noir", hex: "#111111" },
  { name: "Gris", hex: "#8a8a8a" },
  { name: "Beige", hex: "#d8c3a0" },
  { name: "Marron", hex: "#6b4226" },
  { name: "Bleu", hex: "#1d4ed8" },
  { name: "Bleu ciel", hex: "#7dd3fc" },
  { name: "Bleu marine", hex: "#1e2a4a" },
  { name: "Vert", hex: "#15803d" },
  { name: "Rouge", hex: "#b91c1c" },
  { name: "Bordeaux", hex: "#6d1a2c" },
  { name: "Rose", hex: "#f472b6" },
  { name: "Violet", hex: "#7e22ce" },
  { name: "Jaune", hex: "#facc15" },
  { name: "Orange", hex: "#f97316" },
  { name: "Doré", hex: "#c9a227" },
];

/** La pastille d'une couleur connue ; `null` pour une couleur écrite à la main. */
export function readyColorHex(name: string): string | null {
  return READY_COLOR_SWATCHES.find((s) => s.name.toLowerCase() === name.toLowerCase())?.hex ?? null;
}

/** Nettoie la liste envoyée par le formulaire : sans doublon, bornée. */
export function parseReadyColors(values: unknown[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const name = String(v ?? "").trim().slice(0, 40);
    if (name && !out.some((c) => c.toLowerCase() === name.toLowerCase())) out.push(name);
    if (out.length >= MAX_READY_COLORS) break;
  }
  return out;
}

/** Tailles cochées par le tailleur : seulement les tailles standard, dans l'ordre XS → XXXL. */
export function parseReadySizes(values: unknown[]): string[] {
  const picked = new Set(values.map((v) => String(v ?? "").trim().toUpperCase()));
  return STANDARD_SIZES.filter((s) => picked.has(s));
}

/** Tailles proposées au client : celles du tailleur ; aucune cochée (ancien modèle) = toutes. */
export function readySizesFor(model: Pick<GarmentModel, "ready_sizes"> | null | undefined): string[] {
  const sizes = model?.ready_sizes ?? [];
  return sizes.length > 0 ? sizes : [...STANDARD_SIZES];
}

/** Ce modèle se vend-il « tel quel » ? Seulement s'il a un auteur, « Oui » et au moins une couleur. */
export function isReadyToWear(model: Pick<GarmentModel, "tailor_id" | "ready_to_wear" | "ready_colors">): boolean {
  return Boolean(model.tailor_id && model.ready_to_wear && (model.ready_colors?.length ?? 0) > 0);
}

/** Plafond d'un prix par couleur (FCFA) — évite une faute de frappe à 9 zéros. */
const MAX_COLOR_PRICE = 10_000_000;

/**
 * Prix par couleur, envoyé en JSON `{ "Blanc": 15000 }` par le formulaire.
 * Seules les couleurs cochées gardent un prix ; une case vide = prix du modèle.
 */
export function parseReadyColorPrices(raw: unknown, colors: string[]): Record<string, number> {
  let obj: unknown;
  try {
    obj = typeof raw === "string" && raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, number> = {};
  for (const color of colors) {
    const v = (obj as Record<string, unknown>)[color];
    if (v === null || v === undefined || v === "") continue;
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n > 0 && n <= MAX_COLOR_PRICE) out[color] = n;
  }
  return out;
}

/**
 * Photo par couleur, envoyée en JSON `{ "Blanc": "https://…" }`. Seules les
 * couleurs cochées gardent leur photo, et seulement une photo de notre stockage
 * (`isOwn`), jamais une adresse venue d'ailleurs.
 */
export function parseReadyColorImages(
  raw: unknown,
  colors: string[],
  isOwn: (url: string) => boolean,
): Record<string, string> {
  let obj: unknown;
  try {
    obj = typeof raw === "string" && raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, string> = {};
  for (const color of colors) {
    const v = (obj as Record<string, unknown>)[color];
    if (typeof v === "string" && isOwn(v)) out[color] = v;
  }
  return out;
}

/** Photo « tel quel » d'une couleur, s'il y en a une. */
export function readyImageFor(
  model: Pick<GarmentModel, "ready_color_images">,
  color: string | null | undefined,
): string | null {
  return (color && model.ready_color_images?.[color]) || null;
}

/** Prix « tel quel » d'une couleur : son prix à elle, sinon celui du modèle. */
export function readyPriceFor(
  model: Pick<GarmentModel, "ready_colors" | "ready_color_prices">,
  color: string | null | undefined,
  modelPrice: number,
): number {
  if (!color || !(model.ready_colors ?? []).includes(color)) return modelPrice;
  const p = model.ready_color_prices?.[color];
  return typeof p === "number" && p > 0 ? p : modelPrice;
}

/** Plus bas et plus haut prix « tel quel », toutes couleurs confondues. */
export function readyPriceRange(
  model: Pick<GarmentModel, "ready_colors" | "ready_color_prices">,
  modelPrice: number,
): { min: number; max: number } {
  const prices = (model.ready_colors ?? []).map((c) => readyPriceFor(model, c, modelPrice));
  if (prices.length === 0) return { min: modelPrice, max: modelPrice };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
