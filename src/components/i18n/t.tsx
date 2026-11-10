"use client";

import { useLocale, useT } from "@/components/i18n/locale-provider";
import { intlLocale } from "@/lib/i18n/config";
import type { TranslateVars } from "@/lib/i18n/translate";

/**
 * Texte traduit, utilisable partout — y compris dans un composant partagé par
 * des pages serveur et des composants client : `<T>Certifié</T>`.
 */
export function T({ children, vars }: { children: string; vars?: TranslateVars }) {
  const t = useT();
  return <>{t(children, vars)}</>;
}

/** Une date affichée dans la langue de la page (fr-FR / it-IT). */
export function LocalDate({
  iso,
  options,
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const locale = intlLocale(useLocale());
  const date = new Date(iso);
  return <>{options ? new Intl.DateTimeFormat(locale, options).format(date) : date.toLocaleDateString(locale)}</>;
}
