import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_HEADER,
  localizeHref,
  PATH_HEADER,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Refreshes the Supabase auth session on every request and guards
 * authenticated areas of the app. Called from the root `middleware.ts`.
 */
export async function updateSession(
  request: NextRequest,
  options: { locale: Locale; rewritePath?: string },
) {
  const { locale, rewritePath } = options;

  // La langue passe aux pages par un en-tête de requête ; `/it/...` est en
  // plus réécrit vers le chemin sans préfixe (une seule arborescence de pages).
  // Fabriqué à la demande : Supabase peut mettre à jour les cookies entre-temps.
  const pass = () => {
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, isLocale(locale) ? locale : DEFAULT_LOCALE);
    headers.set(PATH_HEADER, rewritePath ?? request.nextUrl.pathname);
    if (rewritePath === undefined) return NextResponse.next({ request: { headers } });
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    return NextResponse.rewrite(url, { request: { headers } });
  };

  let supabaseResponse = pass();

  // Skip auth entirely until the Supabase project is provisioned, so the app
  // keeps rendering with placeholder env values during early development.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!key || key.startsWith("TODO")) {
    return supabaseResponse;
  }

  // Chemin réel de la page (sans `/it`), pour les gardes ci-dessous.
  const pathname = rewritePath ?? request.nextUrl.pathname;

  // Routes that require an authenticated user.
  const protectedPrefixes = [
    // `/commande` n'y est plus : personnaliser ne demande pas de s'inscrire
    // avant (le compte client est créé avec le devis, cf. `ensureClientAccount`).
    "/compte",
    "/tailleur/espace",
    "/vendeur/espace",
    "/admin",
  ];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  // Visiteur sans session sur une page publique : rien à rafraîchir ni à garder.
  // C'est le cas le plus courant, il ne doit rien coûter.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));
  if (!hasAuthCookie && !isProtected) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = pass();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getClaims().
  //
  // `getClaims` vérifie la signature du jeton sur place (clés ES256) et le
  // rafraîchit s'il expire, là où `getUser` fait un aller-retour réseau vers
  // Supabase Auth à CHAQUE requête — préchargements de liens compris.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = localizeHref("/connexion", locale);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Prevent logged-in users from seeing the auth screens. Un invité (session
  // anonyme) doit, lui, pouvoir se connecter ou créer un vrai compte.
  if (
    claims &&
    !claims.is_anonymous &&
    (pathname === "/connexion" || pathname === "/inscription")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = localizeHref("/compte", locale);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
