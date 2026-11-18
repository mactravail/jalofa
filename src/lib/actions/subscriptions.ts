"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/queries";
import type { SubscriptionPlanId } from "@/lib/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Validation des abonnements pros, réservée à l'administration. Les abonnements
 * se règlent par Wave hors plateforme : après réception du paiement, l'admin
 * ouvre l'espace du pro ici (cf. `/admin/abonnements` et l'écran `pro-pending`).
 *
 * Comme le reste de l'espace admin, on écrit avec la clé de service, TOUJOURS
 * derrière un contrôle de rôle explicite (`adminClient`).
 */

type Result = { ok: true } | { ok: false; error: string };

const NOT_CONNECTED = "La base de données n'est pas encore connectée.";
const FORBIDDEN = "Action réservée à l'administration.";

/** Un client service-role — seulement si l'appelant est bien administrateur. */
async function adminClient() {
  const rls = await createClient();
  const {
    data: { user },
  } = await rls.auth.getUser();
  if (!user) return null;
  const { data } = await rls
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "admin") return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function revalidatePros() {
  revalidatePath("/admin/abonnements");
  revalidatePath("/admin/tailleurs");
  revalidatePath("/admin/vendeurs");
  revalidatePath("/tailleurs");
  revalidatePath("/vendeurs");
  revalidatePath("/modeles");
}

/**
 * Ouvre ou referme l'espace d'un pro — le geste de validation après paiement
 * Wave. On agit sur les DEUX boutiques du compte (un Premium en a deux) : le
 * compte s'ouvre d'un bloc, jamais un métier sans l'autre.
 */
export async function setProActivation(
  userId: string,
  activated: boolean,
): Promise<Result> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: FORBIDDEN };

  const [t, v] = await Promise.all([
    supabase.from("tailors").update({ is_activated: activated }).eq("id", userId),
    supabase.from("vendors").update({ is_activated: activated }).eq("id", userId),
  ]);
  const error = t.error ?? v.error;
  if (error) return { ok: false, error: error.message };

  revalidatePros();
  return { ok: true };
}

/**
 * Corrige le plan d'un pro (ex. il a réglé le Standard). Le plan décide de la
 * commission JALOFA ; on le met à jour sur les boutiques existantes du compte.
 * Note : passer au Premium ne crée pas à lui seul la seconde boutique manquante.
 */
export async function setProPlan(
  userId: string,
  plan: SubscriptionPlanId,
): Promise<Result> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: FORBIDDEN };

  const [t, v] = await Promise.all([
    supabase.from("tailors").update({ plan }).eq("id", userId),
    supabase.from("vendors").update({ plan }).eq("id", userId),
  ]);
  const error = t.error ?? v.error;
  if (error) return { ok: false, error: error.message };

  revalidatePros();
  return { ok: true };
}

/**
 * Valide (ou retire) les VENTES d'un pro — la garde anti-arnaque de la
 * Sélection (cf. `@/lib/sales-approval`). Un pro non validé publie et reste
 * visible, mais aucun client ne peut lui acheter. Comme l'activation, la
 * décision vaut pour tout le compte : les deux boutiques d'un coup.
 */
export async function setProSalesApproval(
  userId: string,
  approved: boolean,
): Promise<Result> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: FORBIDDEN };

  const patch = {
    sales_approved: approved,
    sales_approved_at: approved ? new Date().toISOString() : null,
  };
  const [t, v] = await Promise.all([
    supabase.from("tailors").update(patch).eq("id", userId),
    supabase.from("vendors").update(patch).eq("id", userId),
  ]);
  const error = t.error ?? v.error;
  if (error) {
    return {
      ok: false,
      error: /sales_approved/.test(error.message)
        ? "La migration 20260904000001 (ventes validées) n'est pas encore appliquée en base."
        : error.message,
    };
  }

  await supabase.from("notifications").insert({
    user_id: userId,
    type: approved ? "sales_approved" : "sales_suspended",
    title: approved ? "Votre boutique est validée !" : "Vos ventes sont en pause",
    body: approved
      ? "Les clients peuvent maintenant acheter vos articles et commander chez vous."
      : "JALOFA a mis vos ventes en pause. Vos articles restent visibles. Contactez-nous sur WhatsApp au 77 500 85 83 ou à mactravail23@gmail.com.",
    link: "/tailleur/espace",
  });

  revalidatePros();
  revalidatePath("/admin/validations");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tissus");
  return { ok: true };
}
