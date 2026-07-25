"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Métier noté — décide de la table d'avis et de sa table de photos. */
export type ReviewKind = "tailor" | "vendor";

type ModerationResult = { ok: true } | { ok: false; error: string };

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La modération sera possible une fois Supabase configuré.";

const TABLES: Record<ReviewKind, { review: string; photos: string }> = {
  tailor: { review: "reviews", photos: "review_photos" },
  vendor: { review: "fabric_reviews", photos: "fabric_review_photos" },
};

// Toutes les photos d'avis (tailleur comme vendeur) vivent dans ce bucket public.
const BUCKET = "review-photos";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

/** Chemin de stockage derrière une de nos URLs publiques, ou `null` sinon. */
function storagePath(url: string): string | null {
  const at = url.indexOf(PUBLIC_MARKER);
  return at === -1 ? null : decodeURIComponent(url.slice(at + PUBLIC_MARKER.length));
}

/**
 * Supprimer un avis (tailleur ou vendeur) — réservé à l'administration.
 *
 * La RLS ne prévoit aucune policy de suppression pour un admin (chaque client ne
 * gère que ses propres avis), donc on passe par le client « service role »,
 * TOUJOURS derrière un contrôle de rôle explicite — même garde que les lectures
 * d'administration (cf. `adminDb` dans `admin-data.ts`).
 *
 * La ligne supprimée entraîne ses photos (`on delete cascade`) et rafraîchit la
 * note agrégée de la boutique (trigger). On nettoie en plus les fichiers du
 * Storage, que la cascade SQL ne touche pas.
 */
export async function deleteReview(
  kind: ReviewKind,
  id: string,
): Promise<ModerationResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  // Garde « administrateur » via la session RLS, avant toute écriture privilégiée.
  const rls = await createClient();
  const {
    data: { user },
  } = await rls.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous." };
  const { data: profile } = await rls
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    return { ok: false, error: "Action réservée à l'administration." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "Clé de service manquante : la suppression est indisponible.",
    };
  }

  const { review, photos } = TABLES[kind];

  // On récupère les photos AVANT de supprimer la ligne (la cascade effacerait
  // sinon leurs URLs), pour pouvoir nettoyer le Storage ensuite.
  const { data: photoRows } = await admin
    .from(photos)
    .select("image_url")
    .eq("review_id", id);

  const { error } = await admin.from(review).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Nettoyage best-effort des fichiers : ne fait jamais échouer la suppression.
  const paths = ((photoRows as { image_url: string }[]) ?? [])
    .map((p) => storagePath(p.image_url))
    .filter((p): p is string => p !== null);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);

  revalidatePath("/admin/avis");
  return { ok: true };
}
