/**
 * Traduction « à la gettext » : la clé EST le texte français. Une phrase sans
 * traduction italienne retombe donc sur le français au lieu d'afficher une clé.
 *
 *   t("Ajouter au panier")             → "Aggiungi al carrello"
 *   t("Prêt dans {n} jours", { n: 5 }) → "Pronto in 5 giorni"
 *
 * Ce module n'importe AUCUN dictionnaire : il est partagé avec le navigateur, et
 * le dictionnaire italien (~200 Ko) partirait sinon dans le JavaScript de toutes
 * les pages, y compris pour les visiteurs français. Côté serveur, le dictionnaire
 * vient de `@/lib/i18n/server` ; côté navigateur, le layout le transmet au
 * `LocaleProvider` uniquement sur les pages /it.
 */
export type TranslateVars = Record<string, string | number>;
export type Translate = (text: string, vars?: TranslateVars) => string;
export type Dictionary = Record<string, string>;

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Traduit avec un dictionnaire donné (`null` = français, la langue source). */
export function translateWith(
  dict: Dictionary | null | undefined,
  text: string,
  vars?: TranslateVars,
): string {
  return interpolate(dict?.[text] ?? text, vars);
}

export function makeTranslateWith(dict: Dictionary | null | undefined): Translate {
  return (text, vars) => translateWith(dict, text, vars);
}

/**
 * Dictionnaire de la page en cours dans le navigateur, posé par le
 * `LocaleProvider`. Sert à `translateNow` (messages après un clic).
 */
let activeDictionary: Dictionary | null = null;

export function setActiveDictionary(dict: Dictionary | null): void {
  activeDictionary = dict;
}

/**
 * Traduction au moment d'un événement côté navigateur (toast, message
 * d'erreur après un clic) : utilise la langue de la page en cours.
 * À ne PAS utiliser pendant le rendu (le serveur n'a pas de `document`).
 */
export function translateNow(text: string, vars?: TranslateVars): string {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
  return translateWith(lang === "it" ? activeDictionary : null, text, vars);
}
