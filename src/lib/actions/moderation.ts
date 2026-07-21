"use server";

import { revalidatePath } from "next/cache";

import type { SuspensionReason } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Modération des prestataires, réservée à l'administration : suspendre /
 * réactiver un pro, et le certifier. Distinct de l'édition de vitrine du pro
 * (`saveTailorProfile`) : ici c'est la plateforme qui décide, via les policies
 * `*_update_admin` (cf. migration `pro_moderation`) et la garde `is_admin()`.
 *
 * Tant que Supabase n'est pas branché, l'espace admin fonctionne en mode démo :
 * ces actions ne sont pas appelées (l'état vit dans le navigateur, cf.
 * `moderation-store`). Elles prennent le relais une fois la base en place.
 */

export type ProKind = "tailor" | "vendor";

const TABLE: Record<ProKind, "tailors" | "vendors"> = {
  tailor: "tailors",
  vendor: "vendors",
};

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La modération sera possible une fois Supabase configuré.";

/** Rafraîchit l'espace admin et le catalogue public après une modération. */
function revalidatePro(kind: ProKind, id: string) {
  revalidatePath(kind === "tailor" ? "/admin/tailleurs" : "/admin/vendeurs");
  if (kind === "tailor") {
    revalidatePath("/tailleurs");
    revalidatePath(`/tailleurs/${id}`);
    revalidatePath("/modeles");
  }
}

/**
 * Suspend ou réactive un prestataire. Suspendre exige un motif (impayé / faute
 * grave) ; réactiver l'efface. Un pro suspendu quitte le catalogue public et ne
 * peut plus recevoir de commande, quel que soit son propre `is_active`.
 */
export async function setProSuspension(
  kind: ProKind,
  id: string,
  suspended: boolean,
  reason: SuspensionReason | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  if (suspended && !reason) {
    return { ok: false, error: "Un motif de suspension est requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE[kind])
    .update({
      is_suspended: suspended,
      suspension_reason: suspended ? reason : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePro(kind, id);
  return { ok: true };
}

/** Attribue ou retire la certification d'un prestataire. */
export async function setProCertification(
  kind: ProKind,
  id: string,
  certified: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE[kind])
    .update({ is_certified: certified })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePro(kind, id);
  return { ok: true };
}
