import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Client Supabase « service role » — réservé au serveur, il court-circuite la
 * RLS et voit donc toute la place de marché.
 *
 * Il n'existe que pour l'administration : la RLS ne prévoit aucune policy qui
 * laisse un admin lire *toutes* les commandes ou *tous* les profils (chaque
 * partie ne voit que les siens). Plutôt que d'ouvrir ces tables par policy, on
 * lit avec la clé de service, TOUJOURS derrière un contrôle de rôle explicite
 * (cf. `adminDb` dans `src/lib/admin-data.ts`). La clé n'est jamais exposée au
 * navigateur : ce module est `server-only`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante : l'espace d'administration en a besoin.",
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
