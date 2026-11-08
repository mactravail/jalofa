import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import type { Database } from "@/lib/database.types";

/**
 * Supabase client for use in Server Components, Route Handlers and Server Actions.
 * Reads and writes the session cookies through Next.js `cookies()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // The session refresh is handled by the middleware instead.
          }
        },
      },
    },
  );
}

/** Ce que les lectures savent de la personne connectée, tiré de son jeton. */
export type AuthUser = {
  id: string;
  email: string | null;
  is_anonymous: boolean;
};

/**
 * La personne connectée, pour AFFICHER des données. Le jeton est vérifié sur
 * place (clés ES256) : pas d'appel réseau, et `cache` n'exécute la vérification
 * qu'une fois par rendu, même si l'en-tête, la barre du bas et la page la demandent.
 *
 * Pour une écriture, un paiement ou une garde d'administration, garder
 * `supabase.auth.getUser()` : lui seul voit un compte supprimé ou banni avant
 * l'expiration de son jeton.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    is_anonymous: claims.is_anonymous === true,
  };
});
