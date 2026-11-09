"use server";

import { revalidatePath } from "next/cache";

import { parseDeliveryZone } from "@/lib/delivery";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { modelBodyFitProblem, parseModelBodyFits } from "@/lib/model-body-fit";
import {
  MAX_CARE_TIPS_LENGTH,
  modelStyleProblem,
  parseModelStyleGroups,
  styleGroupPhotos,
} from "@/lib/model-style";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { ModelBodyFit, ModelStyleGroup } from "@/lib/types";

export type ModelFormState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La gestion des modèles sera possible une fois Supabase configuré.";

const BUCKET = "model-images";
const MAX_PHOTOS = 5;
const DIFFICULTIES = ["facile", "moyen", "difficile"] as const;

/** Postgres `foreign_key_violation`. */
const FOREIGN_KEY_VIOLATION = "23503";

/**
 * Publier une création, c'est vouloir être vu : on ouvre la boutique du
 * tailleur (`tailors.is_active`, fermée par défaut à l'inscription). Sinon le
 * catalogue, qui ne sert que les boutiques ouvertes, cache la création sans
 * prévenir. Best-effort : un échec ne bloque pas la publication.
 */
async function openShop(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<void> {
  await supabase
    .from("tailors")
    .update({ is_active: true })
    .eq("id", userId)
    .eq("is_active", false);
  revalidatePath("/tailleurs");
  revalidatePath(`/tailleurs/${userId}`);
}

/** Le tailleur a-t-il indiqué où recevoir les tissus des autres vendeurs ? */
async function hasAtelier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("tailor_ateliers")
    .select("tailor_id")
    .eq("tailor_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** La photo est-elle bien dans le dossier de ce tailleur, sur notre stockage ? */
function isOwnModelPhoto(url: string, userId: string): boolean {
  try {
    const { host, pathname } = new URL(url);
    return (
      host === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host &&
      pathname.startsWith(`/storage/v1/object/public/${BUCKET}/${userId}/`)
    );
  } catch {
    return false;
  }
}

/**
 * Envoie UNE photo de choix de style. Un modèle peut en compter une vingtaine :
 * ensemble, elles dépasseraient la limite d'une Server Action, alors elles
 * partent une à une, juste avant l'enregistrement du modèle.
 */
export async function uploadModelStylePhoto(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const file = toFile(formData.get("photo"));
  if (!file) return { ok: false, error: "Photo manquante." };

  const upload = await uploadImage(supabase, BUCKET, user.id, file);
  return "error" in upload ? { ok: false, error: upload.error } : { ok: true, url: upload.url };
}

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

  // Les tissus cochés, gardés seulement s'ils appartiennent bien au tailleur.
  const pickedFabrics = formData.getAll("fabric_id").map(String).filter(Boolean);
  const { data: ownedFabrics } = pickedFabrics.length
    ? await supabase
        .from("fabrics")
        .select("id, is_active")
        .eq("vendor_id", user.id)
        .in("id", pickedFabrics)
    : { data: [] };
  const fabricRows = (ownedFabrics ?? []) as { id: string; is_active: boolean }[];

  // Les champs de l'atelier n'apparaissent que s'il n'est pas encore renseigné.
  const atelierAddress = text(formData.get("atelier_address"));
  const atelierPhone = text(formData.get("atelier_phone"));
  if (Boolean(atelierAddress) !== Boolean(atelierPhone)) {
    return { ok: false, error: "Indiquez l'adresse ET le téléphone de votre atelier." };
  }

  const styleGroups = parseModelStyleGroups(formData.get("style_groups"), (url) =>
    isOwnModelPhoto(url, user.id),
  );

  const categorySlug = text(formData.get("category_slug"));
  const bodyFits = parseModelBodyFits(formData.get("body_fits"), categorySlug);

  // Pour publier : un style complet, le tissu de chaque silhouette, au moins un
  // tissu en ligne, et une adresse où envoyer les tissus des autres vendeurs. Un
  // brouillon reste libre. Contrôlé avant tout téléversement, pour ne pas laisser
  // de photo orpheline.
  if (formData.get("is_active") === "on") {
    const styleProblem = modelStyleProblem(styleGroups);
    if (styleProblem) return { ok: false, error: styleProblem };
    const fitProblem = modelBodyFitProblem(bodyFits, categorySlug);
    if (fitProblem) return { ok: false, error: fitProblem };
    if (!fabricRows.some((f) => f.is_active)) {
      return { ok: false, error: "Choisissez au moins un tissu pour publier ce modèle." };
    }
    if (!atelierAddress && !(await hasAtelier(supabase, user.id))) {
      return { ok: false, error: "Indiquez l'adresse de votre atelier pour publier ce modèle." };
    }
  }

  if (atelierAddress && atelierPhone) {
    const { error: atelierError } = await supabase.from("tailor_ateliers").upsert({
      tailor_id: user.id,
      address: atelierAddress,
      phone: atelierPhone,
      updated_at: new Date().toISOString(),
    });
    if (atelierError) return { ok: false, error: atelierError.message };
  }

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
    category_slug: categorySlug,
    description: text(formData.get("description")),
    delivery_zone: parseDeliveryZone(formData.get("delivery_zone")),
    care_tips: text(formData.get("care_tips"))?.slice(0, MAX_CARE_TIPS_LENGTH) ?? null,
    style_groups: styleGroups,
    body_fits: bodyFits,
    difficulty: difficulty(formData.get("difficulty")),
    avg_days: avgDays(formData.get("avg_days")),
    price: price(formData.get("price")),
    image_url: finalUrls[0],
    is_active: formData.get("is_active") === "on",
  };

  const photoRows = (modelId: string) =>
    finalUrls.map((image_url, sort_order) => ({ model_id: modelId, image_url, sort_order }));

  let savedModelId = id;
  if (id) {
    // Current gallery, kept to prune the storage objects the tailor dropped and
    // to swap rows without ever leaving the model photo-less mid-update.
    const { data: prev } = await supabase
      .from("models")
      .select("image_url, style_groups, model_photos(id, image_url)")
      .eq("id", id)
      .eq("tailor_id", user.id)
      .single();
    const previous = prev as {
      image_url: string | null;
      style_groups: ModelStyleGroup[] | null;
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

    const kept = new Set([...finalUrls, ...styleGroupPhotos(styleGroups)]);
    const orphaned = [
      ...(previous?.image_url ? [previous.image_url] : []),
      ...(previous?.model_photos ?? []).map((p) => p.image_url),
      ...styleGroupPhotos(previous?.style_groups),
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
    savedModelId = newId;
  }

  // Les tissus du modèle : la liste cochée remplace la précédente.
  if (savedModelId) {
    const { error: unlinkError } = await supabase
      .from("model_fabrics")
      .delete()
      .eq("model_id", savedModelId);
    if (unlinkError) return { ok: false, error: unlinkError.message };

    if (fabricRows.length > 0) {
      const modelId = savedModelId;
      const { error: linkError } = await supabase
        .from("model_fabrics")
        .insert(fabricRows.map((f) => ({ model_id: modelId, fabric_id: f.id })));
      if (linkError) return { ok: false, error: linkError.message };
    }
  }

  if (payload.is_active) await openShop(supabase, user.id);

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
  return { ok: true };
}

/** Publish a draft model to the catalogue, or put a published one back in draft. */
export async function setModelPublished(id: string, published: boolean): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  if (published) {
    const { data: current } = await supabase
      .from("models")
      .select("style_groups, body_fits, category_slug")
      .eq("id", id)
      .eq("tailor_id", user.id)
      .maybeSingle();
    const row = current as {
      style_groups: ModelStyleGroup[] | null;
      body_fits: ModelBodyFit[] | null;
      category_slug: string | null;
    } | null;
    const publishProblem =
      modelStyleProblem(row?.style_groups ?? []) ??
      modelBodyFitProblem(row?.body_fits ?? [], row?.category_slug);
    if (publishProblem) throw new Error(`Touchez « Modifier ». ${publishProblem}`);

    const { data: links } = await supabase
      .from("model_fabrics")
      .select("fabric:fabrics!inner(is_active)")
      .eq("model_id", id)
      .eq("fabric.is_active", true)
      .limit(1);
    if (!links?.length) {
      throw new Error("Touchez « Modifier » et choisissez au moins un tissu pour ce modèle.");
    }
    if (!(await hasAtelier(supabase, user.id))) {
      throw new Error("Touchez « Modifier » et indiquez l'adresse de votre atelier.");
    }
  }

  const { data, error } = await supabase
    .from("models")
    .update({ is_active: published })
    .eq("id", id)
    .eq("tailor_id", user.id)
    .select("id");
  if (error) throw new Error(error.message);
  if (published && data && data.length > 0) await openShop(supabase, user.id);
  if (!data || data.length === 0) throw new Error("Modèle introuvable.");

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
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
    .select("image_url, style_groups")
    .eq("id", id)
    .eq("tailor_id", user.id)
    .single();
  const model = data as {
    image_url: string | null;
    style_groups: ModelStyleGroup[] | null;
  } | null;

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
  await Promise.all(
    styleGroupPhotos(model?.style_groups).map((u) => removeImage(supabase, BUCKET, u)),
  );

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
}
