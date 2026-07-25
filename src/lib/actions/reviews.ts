"use server";

import { revalidatePath } from "next/cache";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type ReviewFormState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "Mode démonstration — votre avis sera enregistré une fois la base de données connectée.";

/** Un client peut joindre au plus trois photos à son avis. */
const MAX_REVIEW_PHOTOS = 3;
const REVIEW_PHOTOS_BUCKET = "review-photos";

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

  const { data: inserted, error } = await supabase
    .from("reviews")
    .insert({
      order_id: eligible.id,
      client_id: user.id,
      tailor_id: tailorId,
      rating,
      comment,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Photos jointes (facultatif, 3 max) : on les téléverse sous le préfixe de
  // l'uid — c'est ce que vérifie la policy storage — puis on rattache chaque
  // URL publique à l'avis. Une photo qui échoue est ignorée : l'avis reste
  // publié, il n'a simplement pas cette image.
  const reviewId = (inserted as { id: string }).id;
  const files = formData
    .getAll("photos")
    .map(toFile)
    .filter((f): f is File => f !== null)
    .slice(0, MAX_REVIEW_PHOTOS);

  for (const file of files) {
    const upload = await uploadImage(supabase, REVIEW_PHOTOS_BUCKET, user.id, file);
    if ("error" in upload) continue;
    const { error: photoError } = await supabase
      .from("review_photos")
      .insert({ review_id: reviewId, image_url: upload.url });
    if (photoError) await removeImage(supabase, REVIEW_PHOTOS_BUCKET, upload.url);
  }

  revalidatePath(`/tailleurs/${tailorId}`);
  return { ok: true };
}

/**
 * Publier un avis sur un vendeur de tissu — pendant de {@link submitTailorReview}
 * côté boutique.
 *
 * Comme pour les tailleurs, l'avis est rattaché à une commande de tissu livrée
 * (`fabric_reviews.order_id`, unique) : on retrouve une commande éligible du
 * client chez ce vendeur (livrée, pas encore notée), on récupère au passage le
 * tissu concerné, puis on insère l'avis et ses photos éventuelles.
 */
export async function submitVendorReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const vendorId = String(formData.get("vendor_id") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!vendorId) return { ok: false, error: "Vendeur introuvable." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choisissez une note de 1 à 5 étoiles." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour laisser un avis." };

  // Commandes de tissu livrées du client chez ce vendeur, avec leur avis
  // éventuel : la première sans avis est éligible.
  const { data: orders } = await supabase
    .from("orders")
    .select("id, fabric_id, fabric_reviews(id)")
    .eq("client_id", user.id)
    .eq("vendor_id", vendorId)
    .eq("status", "delivered");

  const eligible = (
    (orders as { id: string; fabric_id: string | null; fabric_reviews: unknown[] }[]) ?? []
  ).find((o) => !o.fabric_reviews || o.fabric_reviews.length === 0);
  if (!eligible) {
    return {
      ok: false,
      error:
        "Vous pourrez laisser un avis une fois une commande de tissu livrée par ce vendeur.",
    };
  }

  const { data: inserted, error } = await supabase
    .from("fabric_reviews")
    .insert({
      order_id: eligible.id,
      client_id: user.id,
      vendor_id: vendorId,
      fabric_id: eligible.fabric_id,
      rating,
      comment,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Photos jointes (facultatif, 3 max) — même mécanique que les avis tailleurs,
  // et même bucket Storage `review-photos`.
  const reviewId = (inserted as { id: string }).id;
  const files = formData
    .getAll("photos")
    .map(toFile)
    .filter((f): f is File => f !== null)
    .slice(0, MAX_REVIEW_PHOTOS);

  for (const file of files) {
    const upload = await uploadImage(supabase, REVIEW_PHOTOS_BUCKET, user.id, file);
    if ("error" in upload) continue;
    const { error: photoError } = await supabase
      .from("fabric_review_photos")
      .insert({ review_id: reviewId, image_url: upload.url });
    if (photoError) await removeImage(supabase, REVIEW_PHOTOS_BUCKET, upload.url);
  }

  revalidatePath(`/vendeurs/${vendorId}`);
  if (eligible.fabric_id) revalidatePath(`/tissus/${eligible.fabric_id}`);
  return { ok: true };
}
