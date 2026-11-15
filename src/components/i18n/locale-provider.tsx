"use client";

import { createContext, useContext, useMemo } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import {
  makeTranslateWith,
  setActiveDictionary,
  type Dictionary,
  type Translate,
} from "@/lib/i18n/translate";

type LocaleValue = { locale: Locale; dict: Dictionary | null };

const LocaleContext = createContext<LocaleValue>({ locale: DEFAULT_LOCALE, dict: null });

/**
 * `dict` n'est fourni que sur les pages italiennes : les visiteurs français ne
 * téléchargent jamais le dictionnaire.
 */
export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary | null;
  children: React.ReactNode;
}) {
  // Pour `translateNow` (toasts après un clic). Uniquement dans le navigateur :
  // côté serveur, une variable de module serait partagée entre requêtes.
  if (typeof window !== "undefined") setActiveDictionary(dict);
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

/** `const t = useT()` dans un composant client. */
export function useT(): Translate {
  const { dict } = useContext(LocaleContext);
  return useMemo(() => makeTranslateWith(dict), [dict]);
}
