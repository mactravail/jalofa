/**
 * Palette proposée au vendeur pour décrire les couleurs d'un tissu. Le choix est
 * multiple et stocké tel quel dans `fabrics.color`, séparé par des virgules
 * (« Bleu royal, Or ») : aucune migration, et l'ancien texte libre reste lisible.
 */
export type FabricColor = { name: string; hex: string };

export const FABRIC_COLORS: FabricColor[] = [
  { name: "Blanc", hex: "#ffffff" },
  { name: "Écru", hex: "#efe6d2" },
  { name: "Beige", hex: "#d8c3a0" },
  { name: "Jaune", hex: "#f5d01e" },
  { name: "Or", hex: "#c9a227" },
  { name: "Orange", hex: "#f07f1d" },
  { name: "Terracotta", hex: "#c2582f" },
  { name: "Rouge", hex: "#d32626" },
  { name: "Bordeaux", hex: "#6d1a2a" },
  { name: "Rose", hex: "#f08bb4" },
  { name: "Fuchsia", hex: "#d6247f" },
  { name: "Violet", hex: "#7b3fa0" },
  { name: "Prune", hex: "#5b2a4a" },
  { name: "Bleu ciel", hex: "#7cc3ef" },
  { name: "Bleu", hex: "#2f6fd6" },
  { name: "Bleu royal", hex: "#1f3fae" },
  { name: "Bleu marine", hex: "#1c2a4f" },
  { name: "Turquoise", hex: "#1fb5ad" },
  { name: "Vert", hex: "#2e9e4a" },
  { name: "Vert olive", hex: "#6b7a2e" },
  { name: "Vert forêt", hex: "#1f4d30" },
  { name: "Marron", hex: "#6e4325" },
  { name: "Gris", hex: "#9a9a9a" },
  { name: "Gris perle", hex: "#c9cbcf" },
  { name: "Noir", hex: "#111111" },
  { name: "Argent", hex: "#bfc3c8" },
];

const BY_NAME = new Map(FABRIC_COLORS.map((c) => [c.name.toLowerCase(), c]));

/** « Bleu, Or » → ["Bleu", "Or"]. */
export function parseFabricColors(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pastille d'une couleur : connue de la palette, ou devinée par son premier mot. */
export function fabricColorHex(name: string): string | null {
  const key = name.toLowerCase();
  const exact = BY_NAME.get(key);
  if (exact) return exact.hex;
  const first = key.split(/\s+/)[0];
  return BY_NAME.get(first)?.hex ?? null;
}
