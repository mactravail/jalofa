import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  localeFromPath,
  localizeHref,
  stripLocale,
  type Locale,
} from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Langue + session.
 *
 * - `/it/...` : version italienne. Le préfixe est retiré (réécriture interne)
 *   et la langue passe aux pages par l'en-tête `x-jalofa-locale`.
 * - `?lang=fr` : retour au français (cookie mis à jour, URL nettoyée).
 * - Page sans préfixe ouverte par un visiteur qui a choisi l'italien : on le
 *   renvoie vers `/it/...` (navigation complète uniquement ; les requêtes
 *   internes de Next sont simplement servies en italien).
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const pathLocale = localeFromPath(pathname);
  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  const cookieLocale: Locale | null = isLocale(cookieValue) ? cookieValue : null;

  // Retour explicite au français.
  if (searchParams.get("lang") === "fr") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    url.pathname = stripLocale(pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, "fr", { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
    return res;
  }

  const isApi = pathname.startsWith("/api/") || pathname.startsWith("/auth/");

  // Visiteur italien sur un lien non préfixé : on garde l'URL honnête.
  if (
    !pathLocale &&
    !isApi &&
    cookieLocale &&
    cookieLocale !== DEFAULT_LOCALE &&
    request.method === "GET" &&
    !request.headers.has("rsc") &&
    !request.headers.has("next-router-prefetch") &&
    (request.headers.get("accept") ?? "").includes("text/html")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = localizeHref(pathname, cookieLocale);
    return NextResponse.redirect(url);
  }

  const locale: Locale = pathLocale ?? (isApi ? DEFAULT_LOCALE : (cookieLocale ?? DEFAULT_LOCALE));

  // Les pages vivent sans préfixe : la session et les gardes voient le vrai chemin.
  const response = await updateSession(request, {
    locale,
    rewritePath: pathLocale ? stripLocale(pathname) : undefined,
  });

  if (pathLocale && cookieLocale !== pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image, video and font files (never need a session)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|woff2?)$).*)",
  ],
};
