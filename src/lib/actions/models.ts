"use server";

import { revalidatePath } from "next/cache";

import { removeImage, uploadImage } from "@/lib/actions/storage";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type ModelFormState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La gestion des modèles sera possible une fois Supabase configuré.";

const BUCKET = "model-images";
const MAX_PHOTOS = 5;
const DIFFICULTIES = ["facile", "moyen", "difficile"] as const;

/** Postgres `foreign_key_violation`. */
const FOREIGN_KEY_VIOLATION = "23503";

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

function difficulty(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return (DIFFICULTIES as readonly string[]).includes(s) ? s : null;
}

/** Confection time in days — the column is `not null default 7`. */
function avgDays(value: FormDataEntryValue | null): number {
  const n = Math.round(Number(String(value ?? "").trim()));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 7;
}

/**
 * Prix de confection de la création (FCFA). Vide = pas de tarif propre : la
 * colonne reste `null` et la caisse retombe sur le « dès… » du tailleur.
 */
function price(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Math.round(Number(s));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Create or update a model owned by the signed-in tailor.
 *
 * `tailor_id` is always the caller: a tailor can only ever publish under their
 * own name, and the platform catalogue (tailor_id null) is not reachable here.
 */
export async function saveModel(
  _prev: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const id = text(formData.get("id"));
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Le nom du modèle est requis." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  // Gallery photos arrive in display order under a repeated `photo` field:
  // freshly picked ones as files (to upload), already-saved ones as their URL
  // (to keep). The first is the cover, mirrored into `models.image_url` for the
  // list thumbnail and the `modelPhotos` fallback.
  const entries = formData.getAll("photo");
  const finalUrls: string[] = [];
  const uploaded: string[] = []; // this call's uploads, for rollback on failure

  const rollback = () =>
    Promise.all(uploaded.map((u) => removeImage(supabase, BUCKET, u)));

  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) {
      const upload = await uploadImage(supabase, BUCKET, user.id, entry);
      if ("error" in upload) {
        await rollback();
        return { ok: false, error: upload.error };
      }
      finalUrls.push(upload.url);
      uploaded.push(upload.url);
    } else if (typeof entry === "string" && entry.trim()) {
      finalUrls.push(entry.trim());
    }
  }

  if (finalUrls.length === 0) {
    return { ok: false, error: "La photo du modèle est requise." };
  }
  if (finalUrls.length > MAX_PHOTOS) {
    await rollback();
    return {
      ok: false,
      error: `Vous pouvez ajouter jusqu'à ${MAX_PHOTOS} photos.`,
    };
  }

  const payload = {
    name,
    category_slug: text(formData.get("category_slug")),
    description: text(formData.get("description")),
    difficulty: difficulty(formData.get("difficulty")),
    avg_days: avgDays(formData.get("avg_days")),
    price: price(formData.get("price")),
    image_url: finalUrls[0],
    is_active: formData.get("is_active") === "on",
  };

  const photoRows = (modelId: string) =>
    finalUrls.map((image_url, sort_order) => ({ model_id: modelId, image_url, sort_order }));

  if (id) {
    // Current gallery, kept to prune the storage objects the tailor dropped and
    // to swap rows without ever leaving the model photo-less mid-update.
    const { data: prev } = await supabase
      .from("models")
      .select("image_url, model_photos(id, image_url)")
      .eq("id", id)
      .eq("tailor_id", user.id)
      .single();
    const previous = prev as {
      image_url: string | null;
      model_photos: { id: string; image_url: string }[];
    } | null;

    // RLS also enforces ownership, but scope the query explicitly.
    const { error } = await supabase
      .from("models")
      .update(payload)
      .eq("id", id)
      .eq("tailor_id", user.id);
    if (error) {
      await rollback();
      return { ok: false, error: error.message };
    }

    const { error: photoError } = await supabase
      .from("model_photos")
      .insert(photoRows(id));
    if (photoError) {
      await rollback();
      return { ok: false, error: photoError.message };
    }

    // New rows are in; drop the old ones, then the storage objects no longer
    // referenced. Both are best-effort — a leftover never blocks the save.
    const oldIds = (previous?.model_photos ?? []).map((p) => p.id);
    if (oldIds.length) await supabase.from("model_photos").delete().in("id", oldIds);

    const kept = new Set(finalUrls);
    const orphaned = [
      ...(previous?.image_url ? [previous.image_url] : []),
      ...(previous?.model_photos ?? []).map((p) => p.image_url),
    ].filter((u) => !kept.has(u));
    await Promise.all(orphaned.map((u) => removeImage(supabase, BUCKET, u)));
  } else {
    const { data: created, error } = await supabase
      .from("models")
      .insert({ ...payload, tailor_id: user.id })
      .select("id")
      .single();
    if (error || !created) {
      await rollback();
      return { ok: false, error: error?.message ?? "Création impossible." };
    }
    const newId = (created as { id: string }).id;

    const { error: photoError } = await supabase
      .from("model_photos")
      .insert(photoRows(newId));
    if (photoError) {
      // Undo the whole create so a model never lists without its gallery.
      await supabase.from("models").delete().eq("id", newId).eq("tailor_id", user.id);
      await rollback();
      return { ok: false, error: photoError.message };
    }
  }

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
  return { ok: true };
}

/** Delete a model owned by the signed-in tailor. */
export async function deleteModel(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data } = await supabase
    .from("models")
    .select("image_url")
    .eq("id", id)
    .eq("tailor_id", user.id)
    .single();
  const model = data as { image_url: string | null } | null;

  // `model_photos` cascades with the row; only the storage objects are ours to
  // clean up, and the gallery is not editable here yet.
  const { error } = await supabase
    .from("models")
    .delete()
    .eq("id", id)
    .eq("tailor_id", user.id);
  // `orders.model_id` has no cascade — a model already ordered cannot leave,
  // or the client's order history would lose what was made for them.
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    throw new Error(
      "Ce modèle a déjà été commandé et ne peut pas être supprimé. Masquez-le pour le retirer du catalogue.",
    );
  }
  if (error) throw new Error(error.message);

  await removeImage(supabase, BUCKET, model?.image_url ?? null);

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
}
