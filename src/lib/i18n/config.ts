/**
 * Langues du site. Le français est la langue de base : ses URL n'ont pas de
 * préfixe (/modeles). L'italien vit sous /it (/it/modeles) — le proxy retire ce
 * préfixe avant d'atteindre les pages, il n'existe donc qu'UNE arborescence de
 * pages, rendue dans la langue transmise par l'en-tête `x-jalofa-locale`.
 */
export const LOCALES = ["fr", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** Cookie qui retient la langue choisie (pour les liens non préfixés). */
export const LOCALE_COOKIE = "jalofa_lang";
/** En-tête posé par le proxy, lu par les composants serveur. */
export const LOCALE_HEADER = "x-jalofa-locale";
/** Chemin de la page sans préfixe de langue (pour les balises hreflang). */
export const PATH_HEADER = "x-jalofa-path";

/** Langues préfixées dans l'URL (toutes sauf la langue de base). */
const PREFIXED: readonly Locale[] = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Langue portée par le chemin (`/it/...` → "it"), sinon null. */
export function localeFromPath(pathname: string): Locale | null {
  for (const l of PREFIXED) {
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) return l;
  }
  return null;
}

/** `/it/modeles` → `/modeles` ; un chemin sans préfixe est rendu tel quel. */
export function stripLocale(pathname: string): string {
  const l = localeFromPath(pathname);
  if (!l) return pathname;
  const rest = pathname.slice(l.length + 1);
  return rest === "" ? "/" : rest;
}

/**
 * Préfixe un lien interne pour la langue donnée : `/modeles` → `/it/modeles`.
 * Les liens externes, les ancres, `mailto:` / `tel:` et les fichiers d'API
 * passent sans changement.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href.startsWith("/api/") || href.startsWith("/auth/")) return href;
  if (localeFromPath(href.split(/[?#]/)[0])) return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

/** Balise BCP 47 pour `toLocaleDateString` / `Intl.NumberFormat`. */
export function intlLocale(locale: Locale): string {
  return locale === "it" ? "it-IT" : "fr-FR";
}
