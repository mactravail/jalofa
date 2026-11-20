"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * « Ma visibilité » : le tailleur choisit s'il apparaît dans l'annuaire public
 * /tailleurs, ou s'il reste caché le temps de compléter sa fiche. C'est le seul
 * endroit qui règle `tailors.is_active`.
 *
 * Il n'y a plus de boutique de tissus côté pro (2026-11-20) : JALOFA est le
 * seul vendeur de tissus.
 */
export type ProVisibility = "tailor" | "none";

type ShopRow = {
  is_activated: boolean;
  is_suspended: boolean;
  hidden_by_admin?: boolean;
} | null;

export async function setProVisibility(choice: ProVisibility): Promise<ActionResult> {
  if (choice !== "tailor" && choice !== "none") {
    return { ok: false, error: "Choix inconnu." };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Mode démonstration — votre choix sera enregistré une fois la base de données connectée.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data } = await supabase.from("tailors").select("*").eq("id", user.id).maybeSingle();
  const row = data as ShopRow;
  if (!row?.is_activated) return { ok: false, error: "Votre espace pro n'est pas encore ouvert." };
  if (row.is_suspended) {
    return { ok: false, error: "Votre boutique est suspendue. Contactez JALOFA sur WhatsApp au 77 500 85 83 ou à mactravail23@gmail.com." };
  }

  if (choice === "tailor" && row.hidden_by_admin) {
    return {
      ok: false,
      error:
        "JALOFA a masqué votre boutique. Contactez JALOFA sur WhatsApp au 77 500 85 83 pour la rouvrir.",
    };
  }

  const { error } = await supabase
    .from("tailors")
    .update({ is_active: choice === "tailor" })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tailleurs");
  return { ok: true };
}
