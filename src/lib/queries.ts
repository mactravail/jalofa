import "server-only";

import type { ProRole } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * True once real Supabase credentials are present. Lets the UI render in a
 * logged-out state while the database is still being provisioned.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return Boolean(url && key && !key.startsWith("TODO") && !url.includes("YOUR"));
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}

/**
 * Les espaces pro accessibles à l'utilisateur : c'est ce qui décide si le
 * sélecteur d'espace apparaît (deux métiers) ou non (un seul).
 *
 * Tant que Supabase n'est pas provisionné, on ouvre les deux pour prévisualiser
 * le sélecteur en développement. Une fois la DB en place, ce sera dérivé de
 * l'abonnement (`planRoles` : Standard = le métier choisi ; Gratuit/Premium =
 * les deux) — pour l'instant on retombe sur le rôle unique du profil.
 */
export function proCapabilities(profile: Profile | null): ProRole[] {
  if (!isSupabaseConfigured()) return ["tailor", "vendor"];
  const role = profile?.role;
  if (role === "tailor" || role === "vendor") return [role];
  return [];
}
