"use client";

import NextLink from "next/link";
import { forwardRef, type ComponentProps } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { localizeHref } from "@/lib/i18n/config";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * `next/link` qui garde la langue : sur la version italienne, `/modeles`
 * devient `/it/modeles`. À importer à la place de `next/link` partout.
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...props }, ref) {
  const locale = useLocale();
  const localized =
    typeof href === "string"
      ? localizeHref(href, locale)
      : href.pathname
        ? { ...href, pathname: localizeHref(href.pathname, locale) }
        : href;
  return <NextLink ref={ref} href={localized} {...props} />;
});

export default Link;
