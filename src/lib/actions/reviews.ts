"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type ReviewFormState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "Mode démonstration — votre avis sera enregistré une fois la base de données connectée.";

/**
 * Publier un avis sur un tailleur.
 *
 * Le schéma rattache chaque avis à une commande (`reviews.order_id`, unique) :
 * on ne note donc pas un tailleur « dans le vide » mais une commande livrée chez
 * lui, une seule fois. L'action retrouve une commande livrée éligible du client
 * chez ce tailleur, puis insère l'avis (la policy RLS revérifie l'appartenance).
 */
export async function submitTailorReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const tailorId = String(formData.get("tailor_id") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!tailorId) return { ok: false, error: "Tailleur introuvable." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choisissez une note de 1 à 5 étoiles." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour laisser un avis." };

  // Commandes livrées du client chez ce tailleur, avec leurs avis éventuels :
  // la première sans avis est éligible.
  const { data: orders } = await supabase
    .from("orders")
    .select("id, reviews(id)")
    .eq("client_id", user.id)
    .eq("tailor_id", tailorId)
    .eq("status", "delivered");

  const eligible = ((orders as { id: string; reviews: unknown[] }[]) ?? []).find(
    (o) => !o.reviews || o.reviews.length === 0,
  );
  if (!eligible) {
    return {
      ok: false,
      error:
        "Vous pourrez laisser un avis une fois une commande livrée chez ce tailleur.",
    };
  }

  const { error } = await supabase.from("reviews").insert({
    order_id: eligible.id,
    client_id: user.id,
    tailor_id: tailorId,
    rating,
    comment,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/tailleurs/${tailorId}`);
  return { ok: true };
}
