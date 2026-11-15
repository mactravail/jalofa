"use server";

import { revalidatePath } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { parseTailorBodyFits } from "@/lib/model-body-fit";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * « Mes métrages » : le tailleur écrit ses mètres de tissu une seule fois. Ils
 * valent pour tous ses modèles de la collection. Un tableau incomplet s'enregistre
 * quand même : c'est la publication d'un modèle qui exige qu'il soit complet.
 */
export async function saveMyBodyFits(raw: string): Promise<ActionResult> {
  return runAction(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error("La base de données n'est pas encore connectée.");
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Vous devez être connecté.");

    const fits = parseTailorBodyFits(raw);
    const { error } = await supabase.from("tailor_body_fits").upsert({
      tailor_id: user.id,
      fits,
      updated_at: new Date().toISOString(),
    });
    if (error?.code === "42P01" || error?.code === "PGRST205") {
      throw new Error("« Mes métrages » n'est pas encore disponible. Réessayez plus tard.");
    }
    if (error) throw new Error(error.message);

    revalidatePath("/tailleur/espace", "layout");
    revalidatePath("/modeles", "layout");
    revalidatePath("/commande/nouvelle", "layout");
  });
}
