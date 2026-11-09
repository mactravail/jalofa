import type { ModelStyleGroup, ModelStyleOption } from "@/lib/types";

// Le style qu'un tailleur publie avec son modèle : des groupes qu'il choisit
// lui-même (un thiaya n'a pas de col), et une vraie photo par choix. Ces règles
// tournent des deux côtés : le formulaire prévient, le serveur décide.

export const MAX_STYLE_GROUPS = 8;
export const MAX_STYLE_OPTIONS = 8;
export const MAX_CARE_TIPS_LENGTH = 1000;

const MAX_NAME_LENGTH = 40;
const MAX_EXTRA = 10_000_000;

/**
 * Ne garde que les choix qui ont leur photo : rien n'est obligatoire, le
 * tailleur met une seule photo s'il veut, et un détail sans aucune photo
 * (« Coupe » ajouté puis laissé vide) disparaît simplement.
 */
export function compactStyleGroups(groups: ModelStyleGroup[]): ModelStyleGroup[] {
  return groups
    .map((g) => ({
      ...g,
      name: g.name.trim(),
      options: g.options
        .map((o) => ({ ...o, name: o.name.trim() }))
        .filter((o) => o.photo),
    }))
    .filter((g) => g.options.length > 0);
}

/** Ce qui empêche de publier ce style, en mots simples. `null` : tout va bien. */
export function modelStyleProblem(groups: ModelStyleGroup[]): string | null {
  for (const group of compactStyleGroups(groups)) {
    if (!group.name) return "Donnez un nom à chaque détail (ex. Poches, Longueur).";
    for (const option of group.options) {
      if (!option.name) return `« ${group.name} » : donnez un nom à chaque photo.`;
    }
  }
  return null;
}

function cleanOption(raw: unknown, isAllowedPhoto: (url: string) => boolean): ModelStyleOption | null {
  if (!raw || typeof raw !== "object") return null;
  const { slug, name, photo, extra } = raw as Record<string, unknown>;
  if (typeof slug !== "string" || !slug) return null;
  const amount = Math.round(Number(extra));
  return {
    slug: slug.slice(0, 40),
    name: typeof name === "string" ? name.trim().slice(0, MAX_NAME_LENGTH) : "",
    photo: typeof photo === "string" && isAllowedPhoto(photo) ? photo : null,
    extra: Number.isFinite(amount) ? Math.min(Math.max(amount, 0), MAX_EXTRA) : 0,
  };
}

/**
 * Relit le style envoyé par le formulaire. Rien n'y est tenu pour acquis : la
 * forme, les plafonds, et surtout les photos, dont `isAllowedPhoto` vérifie
 * qu'elles sont bien chez nous. Le premier choix de chaque groupe est le modèle
 * tel que présenté : son prix est déjà compté, il n'a donc jamais de supplément.
 */
export function parseModelStyleGroups(
  raw: FormDataEntryValue | null,
  isAllowedPhoto: (url: string) => boolean,
): ModelStyleGroup[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const groups = parsed.slice(0, MAX_STYLE_GROUPS).flatMap((entry): ModelStyleGroup[] => {
    if (!entry || typeof entry !== "object") return [];
    const { slug, name, options } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || !slug || !Array.isArray(options)) return [];
    return [
      {
        slug: slug.slice(0, 40),
        name: typeof name === "string" ? name.trim().slice(0, MAX_NAME_LENGTH) : "",
        options: options
          .slice(0, MAX_STYLE_OPTIONS)
          .flatMap((o) => cleanOption(o, isAllowedPhoto) ?? []),
      },
    ];
  });

  return compactStyleGroups(groups).map((group) => ({
    ...group,
    options: group.options.map((o, i) => (i === 0 ? { ...o, extra: 0 } : o)),
  }));
}

/** Les photos utilisées par un style, pour nettoyer celles qui ne servent plus. */
export function styleGroupPhotos(groups: ModelStyleGroup[] | null | undefined): string[] {
  return (groups ?? []).flatMap((g) => g.options.flatMap((o) => o.photo ?? []));
}

/** Les recommandations du tailleur, une par ligne. */
export function careTipLines(text: string | null | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
