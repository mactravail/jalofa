import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { it } from "@/lib/i18n/dictionaries/it";

/**
 * Traduction « à la gettext » : la clé EST le texte français. Une phrase sans
 * traduction italienne retombe donc sur le français au lieu d'afficher une clé.
 *
 *   t("Ajouter au panier")             → "Aggiungi al carrello"
 *   t("Prêt dans {n} jours", { n: 5 }) → "Pronto in 5 giorni"
 */
export type TranslateVars = Record<string, string | number>;
export type Translate = (text: string, vars?: TranslateVars) => string;

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = {
  it,
};

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function translate(locale: Locale, text: string, vars?: TranslateVars): string {
  const dict = locale === DEFAULT_LOCALE ? null : DICTIONARIES[locale];
  return interpolate(dict?.[text] ?? text, vars);
}

export function makeTranslate(locale: Locale): Translate {
  return (text, vars) => translate(locale, text, vars);
}

/**
 * Traduction au moment d'un événement côté navigateur (toast, message
 * d'erreur après un clic) : lit la langue de la page sur `<html lang>`.
 * À ne PAS utiliser pendant le rendu (le serveur n'a pas de `document`).
 */
export function translateNow(text: string, vars?: TranslateVars): string {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
  return translate(lang === "it" ? "it" : DEFAULT_LOCALE, text, vars);
}
