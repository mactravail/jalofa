"use client";

import { createContext, useContext, useMemo } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { makeTranslate, type Translate } from "@/lib/i18n/translate";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `const t = useT()` dans un composant client. */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => makeTranslate(locale), [locale]);
}
