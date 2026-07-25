"use server";

import { revalidatePath } from "next/cache";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import {
  INSPIRATION_MAKER_KINDS,
  type InspirationMakerKind,
} from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InspirationFormState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const NOT_CONNECTED =
  "Mode démonstration — votre inspiration sera publiée une fois la base de données connectée.";

/** Une publication porte au moins une photo, au plus trois. */
const MAX_PHOTOS = 3;
const BUCKET = "inspiration-photos";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

/** Prénom d'affichage : premier mot du nom complet, sinon « Client ». */
function displayName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || "Client";
}

/**
 * Publier une tenue dans la galerie « Inspiration ».
 *
 * L'auteur joint 1 à 3 photos, décrit la tenue, dit qui l'a confectionnée et où
 * le tissu a été acheté (texte libre + lien facultatif vers un tissu du
 * catalogue). Le nom d'affichage est figé sur la publication (la RLL de
 * `profiles` interdit sa lecture publique). Les photos sont téléversées sous le
 * préfixe de l'uid — ce que vérifie la policy Storage — puis rattachées.
 */
export async function createInspirationPost(
  _prev: InspirationFormState,
  formData: FormData,
): Promise<InspirationFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const caption = String(formData.get("caption") ?? "").trim() || null;
  const garmentLabel = String(formData.get("garment_label") ?? "").trim() || null;
  const makerKindRaw = String(formData.get("maker_kind") ?? "").trim();
  const makerName = String(formData.get("maker_name") ?? "").trim() || null;
  const fabricNote = String(formData.get("fabric_note") ?? "").trim() || null;
  const fabricId = String(formData.get("fabric_id") ?? "").trim() || null;

  const makerKind = (
    INSPIRATION_MAKER_KINDS as readonly string[]
  ).includes(makerKindRaw)
    ? (makerKindRaw as InspirationMakerKind)
    : "tailleur_quartier";

  const files = formData
    .getAll("photos")
    .map(toFile)
    .filter((f): f is File => f !== null)
    .slice(0, MAX_PHOTOS);

  if (files.length === 0) {
    return { ok: false, error: "Ajoutez au moins une photo de votre tenue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour publier." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: inserted, error } = await supabase
    .from("inspiration_posts")
    .insert({
      author_id: user.id,
      author_name: displayName((profile as { full_name: string | null } | null)?.full_name),
      caption,
      garment_label: garmentLabel,
      maker_kind: makerKind,
      maker_name: makerName,
      fabric_note: fabricNote,
      fabric_id: fabricId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Photos : téléversées sous le préfixe de l'uid, rattachées dans l'ordre. Une
  // photo qui échoue est ignorée — la publication garde les autres.
  const postId = (inserted as { id: string }).id;
  let sort = 0;
  for (const file of files) {
    const upload = await uploadImage(supabase, BUCKET, user.id, file);
    if ("error" in upload) continue;
    const { error: photoError } = await supabase
      .from("inspiration_photos")
      .insert({ post_id: postId, image_url: upload.url, sort_order: sort });
    if (photoError) {
      await removeImage(supabase, BUCKET, upload.url);
      continue;
    }
    sort += 1;
  }

  // Aucune photo n'a pu être enregistrée : on retire la publication vide plutôt
  // que de laisser une carte sans image dans la galerie.
  if (sort === 0) {
    await supabase.from("inspiration_posts").delete().eq("id", postId);
    return {
      ok: false,
      error: "Vos photos n'ont pas pu être envoyées. Réessayez.",
    };
  }

  revalidatePath("/inspiration");
  revalidatePath("/compte/inspiration");
  return { ok: true };
}

/** Chemin de stockage derrière une de nos URLs publiques, ou `null` sinon. */
function storagePath(url: string): string | null {
  const at = url.indexOf(PUBLIC_MARKER);
  return at === -1 ? null : decodeURIComponent(url.slice(at + PUBLIC_MARKER.length));
}

type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Supprimer une publication — par son auteur (depuis son espace) ou par
 * l'administration (modération).
 *
 * L'auteur passe par la RLS (policy de suppression sur ses propres lignes) ;
 * l'admin, qui n'est pas l'auteur, passe par la clé de service, TOUJOURS derrière
 * un contrôle de rôle. Dans les deux cas on nettoie ensuite les fichiers du
 * Storage, que la cascade SQL ne touche pas.
 */
export async function deleteInspirationPost(id: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: NOT_CONNECTED };
  }

  const rls = await createClient();
  const {
    data: { user },
  } = await rls.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous." };

  const { data: post } = await rls
    .from("inspiration_posts")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (!post) return { ok: false, error: "Publication introuvable." };

  const isAuthor = (post as { author_id: string }).author_id === user.id;

  let isAdmin = false;
  if (!isAuthor) {
    const { data: profile } = await rls
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = (profile as { role?: string } | null)?.role === "admin";
    if (!isAdmin) {
      return { ok: false, error: "Action non autorisée." };
    }
  }

  // L'admin a besoin de la clé de service (il n'est pas l'auteur) ; l'auteur
  // reste sur son client RLS.
  let db = rls;
  if (isAdmin) {
    try {
      db = createAdminClient();
    } catch {
      return {
        ok: false,
        error: "Clé de service manquante : la suppression est indisponible.",
      };
    }
  }

  // Photos récupérées AVANT la suppression (la cascade effacerait leurs URLs).
  const { data: photoRows } = await db
    .from("inspiration_photos")
    .select("image_url")
    .eq("post_id", id);

  const { error } = await db.from("inspiration_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  const paths = ((photoRows as { image_url: string }[]) ?? [])
    .map((p) => storagePath(p.image_url))
    .filter((p): p is string => p !== null);
  if (paths.length > 0) await db.storage.from(BUCKET).remove(paths);

  revalidatePath("/inspiration");
  revalidatePath("/compte/inspiration");
  revalidatePath("/admin/inspiration");
  return { ok: true };
}
