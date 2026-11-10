"use client";

import { useSearchParams } from "next/navigation";

import { useLocale } from "@/components/i18n/locale-provider";
import { LOCALES, localizeHref, type Locale } from "@/lib/i18n/config";
import { usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * FR | IT. Un vrai lien (rechargement complet) : le proxy mémorise le choix
 * dans un cookie — `/it/...` pour l'italien, `?lang=fr` pour revenir au français.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (target: Locale) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("lang");
    if (target === "fr") params.set("lang", "fr");
    const qs = params.toString();
    return `${localizeHref(pathname, target)}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className={cn("flex items-center gap-1 text-xs tracking-[0.1em] uppercase", className)}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className="opacity-40">|</span>}
          {l === locale ? (
            <span aria-current="true" className="font-semibold">
              {l}
            </span>
          ) : (
            <a
              href={hrefFor(l)}
              hrefLang={l}
              lang={l}
              className="opacity-60 transition-opacity hover:opacity-100"
            >
              {l}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
