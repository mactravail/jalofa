import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and guards
 * authenticated areas of the app. Called from the root `middleware.ts`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Skip auth entirely until the Supabase project is provisioned, so the app
  // keeps rendering with placeholder env values during early development.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!key || key.startsWith("TODO")) {
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;

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
          supabaseResponse = NextResponse.next({ request });
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
    url.pathname = "/connexion";
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
    url.pathname = "/compte";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
