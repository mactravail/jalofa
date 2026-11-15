"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { removeImage, uploadImage } from "@/lib/actions/storage";
import { isSupabaseConfigured } from "@/lib/queries";
import { STYLE_GROUPS_BY_SLUG } from "@/lib/style-options";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Le catalogue JALOFA (`models.tailor_id` null) : seul l'administrateur y
 * ajoute, modifie ou masque des modèles. Les créations des tailleurs se rangent
 * ensuite sous ces modèles (cf. `catalog-link.ts`).
 *
 * La policy `models_write_own` interdit à tout client d'écrire une ligne sans
 * propriétaire : on écrit donc avec la clé de service, TOUJOURS après le
 * contrôle du rôle admin ci-dessous — ces actions sont des points d'entrée HTTP
 * publics, l'interface seule ne protège rien.
 */

const NOT_CONNECTED = "La base de données n'est pas encore connectée.";
const FORBIDDEN = "Action réservée à l'administration.";
const BUCKET = "model-images";
const MAX_PHOTOS = 5;
const DIFFICULTIES = ["facile", "moyen", "difficile"];

async function adminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (data as { role?: string } | null)?.role === "admin" ? user.id : null;
}

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

function wholeNumber(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Math.round(Number(s));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** « Grand Boubou brodé » → « grand-boubou-brode ». */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function revalidateCatalog() {
  revalidatePath("/admin/modeles");
  revalidatePath("/modeles", "layout");
  revalidatePath("/homme/grand-boubou-sur-mesure");
  revalidatePath("/femme/robe-sur-mesure");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/");
}

/**
 * Crée ou modifie un modèle du catalogue. Le slug se fixe à la création et ne
 * bouge plus : les pages dédiées et les liens de la home s'y accrochent.
 */
export async function saveCatalogModel(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const adminId = await adminUserId();
  if (!adminId) return { ok: false, error: FORBIDDEN };

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Clé de service manquante." };
  }

  const id = text(formData.get("id"));
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Le nom du modèle est requis." };
  const categorySlug = text(formData.get("category_slug"));
  if (!categorySlug) return { ok: false, error: "Choisissez une catégorie." };

  const styleBaseRaw = text(formData.get("style_base"));
  const styleBase = styleBaseRaw && STYLE_GROUPS_BY_SLUG[styleBaseRaw] ? styleBaseRaw : null;
  const difficultyRaw = text(formData.get("difficulty"));
  const avgDays = wholeNumber(formData.get("avg_days"));

  // Photos dans l'ordre d'affichage : les nouvelles en fichiers, les
  // conservées en URL. La première est la couverture.
  const finalUrls: string[] = [];
  const uploaded: string[] = [];
  const asServer = db as unknown as Parameters<typeof uploadImage>[0];
  const rollback = () => Promise.all(uploaded.map((u) => removeImage(asServer, BUCKET, u)));
  for (const entry of formData.getAll("photo")) {
    if (entry instanceof File && entry.size > 0) {
      const res = await uploadImage(asServer, BUCKET, `catalogue-${adminId}`, entry);
      if ("error" in res) {
        await rollback();
        return { ok: false, error: res.error };
      }
      finalUrls.push(res.url);
      uploaded.push(res.url);
    } else if (typeof entry === "string" && entry.trim()) {
      finalUrls.push(entry.trim());
    }
  }
  if (finalUrls.length === 0) return { ok: false, error: "Ajoutez au moins une photo." };
  if (finalUrls.length > MAX_PHOTOS) {
    await rollback();
    return { ok: false, error: `Jusqu'à ${MAX_PHOTOS} photos.` };
  }

  const payload = {
    name,
    category_slug: categorySlug,
    description: text(formData.get("description")),
    difficulty: difficultyRaw && DIFFICULTIES.includes(difficultyRaw) ? difficultyRaw : null,
    avg_days: avgDays && avgDays > 0 ? Math.min(avgDays, 365) : 7,
    price: wholeNumber(formData.get("price")),
    style_base: styleBase,
    image_url: finalUrls[0],
    is_active: formData.get("is_active") === "on",
  };

  let modelId = id;
  if (id) {
    const { data: current } = await db
      .from("models")
      .select("id, tailor_id")
      .eq("id", id)
      .maybeSingle();
    if (!current || (current as { tailor_id: string | null }).tailor_id !== null) {
      await rollback();
      return { ok: false, error: "Ce modèle n'est pas dans le catalogue JALOFA." };
    }
    const { error } = await db.from("models").update(payload as never).eq("id", id);
    if (error) {
      await rollback();
      return { ok: false, error: error.message };
    }
  } else {
    const base = slugify(text(formData.get("slug")) ?? name);
    if (!base) {
      await rollback();
      return { ok: false, error: "Nom invalide." };
    }
    const { data: taken } = await db.from("models").select("id").eq("slug", base).maybeSingle();
    if (taken) {
      await rollback();
      return { ok: false, error: `Le lien « ${base} » est déjà pris. Changez le nom ou le lien.` };
    }
    const { data: created, error } = await db
      .from("models")
      .insert({ ...payload, slug: base, tailor_id: null } as never)
      .select("id")
      .single();
    if (error || !created) {
      await rollback();
      return { ok: false, error: error?.message ?? "Création impossible." };
    }
    modelId = (created as { id: string }).id;
  }

  // La galerie : la nouvelle liste remplace l'ancienne.
  if (modelId) {
    const { data: oldPhotos } = await db
      .from("model_photos")
      .select("id")
      .eq("model_id", modelId);
    const { error: photoError } = await db.from("model_photos").insert(
      finalUrls.map((image_url, sort_order) => ({ model_id: modelId!, image_url, sort_order })) as never,
    );
    if (photoError) return { ok: false, error: photoError.message };
    const oldIds = ((oldPhotos as { id: string }[] | null) ?? []).map((p) => p.id);
    if (oldIds.length) await db.from("model_photos").delete().in("id", oldIds);
  }

  revalidateCatalog();
  return { ok: true };
}

/** Masque ou réaffiche un modèle du catalogue (on ne supprime jamais : il a pu être commandé). */
export async function setCatalogModelActive(id: string, active: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  if (!(await adminUserId())) return { ok: false, error: FORBIDDEN };
  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Clé de service manquante." };
  }
  const { error } = await db
    .from("models")
    .update({ is_active: active } as never)
    .eq("id", id)
    .is("tailor_id", null);
  if (error) return { ok: false, error: error.message };
  revalidateCatalog();
  return { ok: true };
}

