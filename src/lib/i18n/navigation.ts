"use client";

import { useMemo } from "react";
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
} from "next/navigation";

import { useLocale } from "@/components/i18n/locale-provider";
import { localizeHref, stripLocale } from "@/lib/i18n/config";

export {
  notFound,
  redirect,
  useParams,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from "next/navigation";

/** Chemin SANS préfixe de langue (`/it/modeles` → `/modeles`). */
export function usePathname(): string {
  return stripLocale(useNextPathname() ?? "/");
}

/** Routeur dont `push` / `replace` / `prefetch` gardent la langue courante. */
export function useRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => router.push(localizeHref(href, locale), options),
      replace: (href, options) => router.replace(localizeHref(href, locale), options),
      prefetch: (href, options) => router.prefetch(localizeHref(href, locale), options),
    }),
    [router, locale],
  );
}
