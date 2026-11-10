import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_HEADER,
  LOCALES,
  localizeHref,
  PATH_HEADER,
  type Locale,
} from "@/lib/i18n/config";
import { makeTranslate, type Translate } from "@/lib/i18n/translate";

/** Langue de la requête en cours (posée par le proxy). */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/** `const t = await getT()` dans un composant serveur. */
export async function getT(): Promise<Translate> {
  return makeTranslate(await getLocale());
}

/** Lien interne dans la langue courante (pour `redirect()` côté serveur). */
export async function localizedPath(href: string): Promise<string> {
  return localizeHref(href, await getLocale());
}

/** Les versions de la page courante dans chaque langue (balises hreflang). */
export async function languageAlternates(): Promise<Record<string, string>> {
  const path = (await headers()).get(PATH_HEADER) ?? "/";
  const entries = LOCALES.map((l) => [l, localizeHref(path, l)] as const);
  return { ...Object.fromEntries(entries), "x-default": path };
}
