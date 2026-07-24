import "server-only";

import type { ProRole } from "@/lib/dashboard-nav";
import type { SubscriptionPlanId } from "@/lib/subscriptions";
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

/** L'état d'un métier pour le pro connecté : le plan de sa boutique et si l'administration l'a activée. */
export type ProAccessRow = { plan: SubscriptionPlanId; is_activated: boolean };

/**
 * L'accès pro de l'utilisateur connecté, métier par métier : sa boutique
 * existe-t-elle (`null` sinon) et l'administration l'a-t-elle ouverte
 * (`is_activated`) ? C'est la source unique dont dépendent les gardes des espaces
 * (tailleur/vendeur), l'écran d'attente et le sélecteur d'espace.
 *
 * Standard n'a qu'une boutique (l'autre métier est `null`) ; Gratuit/Premium en
 * ont deux. En mode démo (Supabase non branché) on ouvre les deux, activés, pour
 * prévisualiser les espaces.
 */
export type ProAccess = { tailor: ProAccessRow | null; vendor: ProAccessRow | null };

export async function getProAccess(): Promise<ProAccess> {
  if (!isSupabaseConfigured()) {
    const demo: ProAccessRow = { plan: "premium", is_activated: true };
    return { tailor: demo, vendor: demo };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tailor: null, vendor: null };

  const [tailor, vendor] = await Promise.all([
    supabase
      .from("tailors")
      .select("plan, is_activated")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("vendors")
      .select("plan, is_activated")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  return {
    tailor: (tailor.data as ProAccessRow | null) ?? null,
    vendor: (vendor.data as ProAccessRow | null) ?? null,
  };
}

/** Les espaces activés du pro — au-delà d'un, le châssis affiche le sélecteur d'espace. */
export function activatedCapabilities(access: ProAccess): ProRole[] {
  const caps: ProRole[] = [];
  if (access.tailor?.is_activated) caps.push("tailor");
  if (access.vendor?.is_activated) caps.push("vendor");
  return caps;
}
