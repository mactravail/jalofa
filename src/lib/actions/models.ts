"use server";

import { revalidatePath } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { parseModelQuoteSettings } from "@/lib/auto-quote";
import { parseDeliveryZone } from "@/lib/delivery";
import { europeTypeInfo, parseEuropeType, parseMakingType } from "@/lib/europe";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { parseModelBodyFits, tailorBodyFitProblem } from "@/lib/model-body-fit";
import { loadOneTailorBodyFits } from "@/lib/tailor-body-fits";
import { parseReadyColorPrices, parseReadyColors } from "@/lib/ready-to-wear";
import {
  MAX_CARE_TIPS_LENGTH,
  modelStyleProblem,
  parseModelStyleGroups,
  styleGroupPhotos,
} from "@/lib/model-style";
import type { OrderStatus } from "@/lib/constants";
import { garmentStyleKey, parseStyleBase, STYLE_BASE_REQUESTED } from "@/lib/style-options";
import { isTerminal } from "@/lib/pipeline";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { GarmentModel, ModelBodyFit, ModelStyleGroup } from "@/lib/types";

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

  // « Tel quel » = prêt-à-porter : le tailleur dit s'il l'a déjà cousu et en
  // quelles couleurs. Le prix payé est le prix du modèle, donc il est requis.
  const sendsReady = formData.has("ready_form");
  const readyToWear = sendsReady && formData.get("ready_to_wear") === "on";
  const readyColors = readyToWear ? parseReadyColors(formData.getAll("ready_colors")) : [];
  // Un prix par couleur, facultatif : case vide = prix du modèle.
  const readyColorPrices = parseReadyColorPrices(formData.get("ready_color_prices"), readyColors);
  if (readyToWear && readyColors.length === 0) {
    return { ok: false, error: "Prêt-à-porter : choisissez au moins une couleur." };
  }
  if (readyToWear && price(formData.get("price")) === null) {
    return { ok: false, error: "Prêt-à-porter : indiquez le prix du modèle, c'est le prix payé « tel quel »." };
  }

  // Les champs de l'atelier n'apparaissent que s'il n'est pas encore renseigné.
  const atelierAddress = text(formData.get("atelier_address"));
  const atelierPhone = text(formData.get("atelier_phone"));
  if (Boolean(atelierAddress) !== Boolean(atelierPhone)) {
    return { ok: false, error: "Indiquez l'adresse ET le téléphone de votre atelier." };
  }

  const styleGroups = parseModelStyleGroups(formData.get("style_groups"), (url) =>
    isOwnModelPhoto(url, user.id),
  );

  // JALOFA EUROPE : la catégorie européenne décide de la page Homme ou Femme,
  // quoi qu'ait envoyé le formulaire. Ces champs n'arrivent que du formulaire
  // d'un atelier européen : les autres sauvegardes n'y touchent pas.
  const sendsEurope = formData.has("europe_type");
  const europeType = sendsEurope ? parseEuropeType(formData.get("europe_type")) : null;

  // Chaque création est rangée sous un modèle du catalogue JALOFA : elle
  // s'affiche sur sa page, prend sa catégorie et reprend ses planches dessinées.
  const sendsCatalog = formData.has("catalog_model_id");
  const catalogModelId = text(formData.get("catalog_model_id"));
  let catalogModel: GarmentModel | null = null;
  if (catalogModelId) {
    const { data: picked } = await supabase
      .from("models")
      .select("*")
      .eq("id", catalogModelId)
      .is("tailor_id", null)
      .maybeSingle();
    if (!picked) return { ok: false, error: "Ce vêtement n'est pas dans le catalogue JALOFA." };
    catalogModel = picked as GarmentModel;
  }
  if (sendsCatalog && !catalogModel && formData.get("is_active") === "on") {
    return {
      ok: false,
      error: "Choisissez le vêtement de notre catalogue auquel correspond votre modèle.",
    };
  }

  const categorySlug =
    europeTypeInfo(europeType)?.category ??
    catalogModel?.category_slug ??
    text(formData.get("category_slug"));
  // Le métrage vit dans « Mes métrages » : le formulaire n'en envoie plus. Celui
  // déjà enregistré sur un ancien modèle reste en place, en repli.
  const sendsBodyFits = formData.has("body_fits");
  const bodyFits = parseModelBodyFits(formData.get("body_fits"), categorySlug);
  const styleBase = catalogModel
    ? garmentStyleKey(catalogModel)
    : parseStyleBase(formData.get("style_base"));
  // Devis manuel ou automatique (prix fixe, livraison, délai).
  const quote = parseModelQuoteSettings(formData);
  if (!quote.ok) return { ok: false, error: quote.error };

  // Pour publier : un style complet, le tissu de chaque silhouette, au moins un
  // tissu en ligne, et une adresse où envoyer les tissus des autres vendeurs. Un
  // brouillon reste libre. Contrôlé avant tout téléversement, pour ne pas laisser
  // de photo orpheline.
  if (formData.get("is_active") === "on") {
    const styleProblem = modelStyleProblem(styleGroups);
    if (styleProblem) return { ok: false, error: styleProblem };
    let savedFits: ModelBodyFit[] = bodyFits;
    if (!sendsBodyFits && id) {
      const { data: current } = await supabase
        .from("models")
        .select("body_fits")
        .eq("id", id)
        .eq("tailor_id", user.id)
        .maybeSingle();
      savedFits = (current as { body_fits: ModelBodyFit[] | null } | null)?.body_fits ?? [];
    }
    const fitProblem = tailorBodyFitProblem(
      savedFits,
      await loadOneTailorBodyFits(supabase, user.id),
      categorySlug,
    );
    if (fitProblem) return { ok: false, error: fitProblem };
    // Les tissus sont facultatifs : un tailleur peut publier sans en avoir.
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
    ...(formData.has("style_base") || catalogModel ? { style_base: styleBase } : {}),
    ...(sendsCatalog ? { catalog_model_id: catalogModel?.id ?? null } : {}),
    ...(sendsBodyFits ? { body_fits: bodyFits } : {}),
    difficulty: difficulty(formData.get("difficulty")),
    avg_days: avgDays(formData.get("avg_days")),
    price: price(formData.get("price")),
    ...(sendsReady
      ? {
          ready_to_wear: readyToWear,
          ready_colors: readyColors,
          ready_color_prices: readyColorPrices,
        }
      : {}),
    ...(formData.has("quote_mode") ? quote.settings : {}),
    image_url: finalUrls[0],
    is_active: formData.get("is_active") === "on",
    ...(sendsEurope
      ? {
          europe_type: europeType,
          material: text(formData.get("material"))?.slice(0, 160) ?? null,
          making_type: parseMakingType(formData.get("making_type")),
          sizes: text(formData.get("sizes"))?.slice(0, 120) ?? null,
        }
      : {}),
  };

  const photoRows = (modelId: string) =>
    finalUrls.map((image_url, sort_order) => ({ model_id: modelId, image_url, sort_order }));

  let savedModelId = id;
  let previousStyleBase: string | null = null;
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

    // À part : tant que la colonne manque, la requête du dessus doit marcher.
    const { data: prevBase } = await supabase
      .from("models")
      .select("style_base")
      .eq("id", id)
      .eq("tailor_id", user.id)
      .maybeSingle();
    previousStyleBase = (prevBase as { style_base: string | null } | null)?.style_base ?? null;

    // RLS also enforces ownership, but scope the query explicitly.
    const { error } = await withoutMissingStyleBase(payload, (row) =>
      supabase.from("models").update(row).eq("id", id).eq("tailor_id", user.id),
    );
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
    const { data: created, error } = await withoutMissingStyleBase(payload, (row) =>
      supabase
        .from("models")
        .insert({ ...row, tailor_id: user.id })
        .select("id")
        .single(),
    );
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

  if (styleBase === STYLE_BASE_REQUESTED && previousStyleBase !== STYLE_BASE_REQUESTED && savedModelId) {
    await requestStyleDrawing(supabase, user.id, savedModelId, name);
  }

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
  revalidatePath("/europe");
  return { ok: true };
}

const QUOTE_COLUMNS = ["quote_mode", "quote_price", "quote_delivery_fee", "quote_ready_days"];

/**
 * Tant que les migrations `20260821000001_model_style_base` et
 * `20260822000001_model_auto_quote` ne sont pas passées, leurs colonnes
 * n'existent pas : on enregistre le reste plutôt que de bloquer le tailleur. Un
 * devis automatique, lui, ne peut pas être perdu en silence : il bloque.
 */
async function withoutMissingStyleBase<P extends Record<string, unknown>, R extends { error: { code?: string; message: string } | null }>(
  payload: P,
  run: (row: P) => PromiseLike<R>,
): Promise<R> {
  let row: Record<string, unknown> = payload;
  let res = await run(payload);
  for (let attempt = 0; attempt < 2; attempt++) {
    const err = res.error;
    if (!err || (err.code !== "42703" && err.code !== "PGRST204")) return res;
    const missing = ["style_base", "catalog_model_id", ...QUOTE_COLUMNS].filter(
      (col) => col in row && err.message.includes(col),
    );
    if (missing.length === 0) return res;
    const dropsQuote = missing.some((col) => QUOTE_COLUMNS.includes(col));
    if (dropsQuote && row.quote_mode === "auto") {
      return {
        ...res,
        error: {
          ...err,
          message: "Le devis automatique n'est pas encore disponible. Choisissez « Devis manuel » pour l'instant.",
        },
      };
    }
    const next = { ...row };
    for (const col of dropsQuote ? [...missing, ...QUOTE_COLUMNS] : missing) delete next[col];
    row = next;
    res = await run(row as P);
  }
  return res;
}

/**
 * Le modèle n'est dans aucune liste du catalogue : le tailleur demande à JALOFA
 * de dessiner sa personnalisation. La demande arrive dans « Retours » et sonne
 * chez l'administration. Best-effort : l'enregistrement du modèle est déjà fait.
 */
async function requestStyleDrawing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  modelId: string,
  name: string,
) {
  try {
    const { data: tailor } = await supabase
      .from("tailors")
      .select("shop_name")
      .eq("id", userId)
      .maybeSingle();
    const shop = (tailor as { shop_name: string | null } | null)?.shop_name ?? "Un tailleur";
    const message = `Dessin de personnalisation demandé pour le modèle « ${name} » (${shop}). Ce vêtement n'est pas dans le catalogue : dessiner ses planches (col, manches, broderie…). Fiche : /modeles/${modelId}`;

    await supabase.from("feedback").insert({
      author_id: userId,
      author_name: shop,
      author_role: "tailor",
      space: "tailor",
      category: "amelioration",
      message,
    });

    const db = createAdminClient();
    const { data: admins } = await db.from("profiles").select("id").eq("role", "admin");
    if (admins?.length) {
      await db.from("notifications").insert(
        (admins as { id: string }[]).map((a) => ({
          user_id: a.id,
          type: "style_drawing_request",
          title: "Dessin de personnalisation demandé",
          body: `${shop} demande les planches de « ${name} ».`,
          link: "/admin/feedback",
        })),
      );
    }
    revalidatePath("/admin/feedback");
  } catch {
    // Clé de service absente : la demande reste dans « Retours ».
  }
}

/**
 * Garde-fou anti-arnaque : un modèle déjà commandé ne peut pas être supprimé,
 * seulement masqué. Quand un tailleur le masque, l'administration est prévenue
 * (notification + page « Modèles ») — surtout si des commandes sont encore en
 * cours, le cas où un client risque de payer sans rien recevoir. Best-effort :
 * un échec ici n'annule pas le geste du tailleur.
 */
async function alertAdminsModelHidden(modelId: string, tailorId: string) {
  try {
    const db = createAdminClient();
    const { data: orders } = await db
      .from("orders")
      .select("status")
      .eq("model_id", modelId);
    const list = (orders ?? []) as { status: OrderStatus }[];
    if (list.length === 0) return;
    const ongoing = list.filter((o) => !isTerminal(o.status)).length;

    const [{ data: model }, { data: tailor }, { data: admins }] = await Promise.all([
      db.from("models").select("name").eq("id", modelId).maybeSingle(),
      db.from("tailors").select("shop_name").eq("id", tailorId).maybeSingle(),
      db.from("profiles").select("id").eq("role", "admin"),
    ]);
    if (!admins?.length) return;

    const name = (model as { name: string } | null)?.name ?? "Un modèle";
    const shop = (tailor as { shop_name: string | null } | null)?.shop_name ?? "Un tailleur";
    const orderWord = list.length > 1 ? `${list.length} commandes` : "1 commande";
    const body =
      ongoing > 0
        ? `${shop} a masqué « ${name} » (${orderWord}, dont ${ongoing} en cours). À vérifier.`
        : `${shop} a masqué « ${name} » (${orderWord}, toutes terminées).`;

    await db.from("notifications").insert(
      (admins as { id: string }[]).map((a) => ({
        user_id: a.id,
        type: "model_hidden",
        title:
          ongoing > 0
            ? "Modèle masqué avec des commandes en cours"
            : "Modèle masqué après commande",
        body,
        link: "/admin/modeles",
      })),
    );
  } catch {
    // Clé de service absente : le masquage reste enregistré.
  }
}

/** Publish a draft model to the catalogue, or put a published one back in draft. */
async function setModelPublishedImpl(id: string, published: boolean): Promise<void> {
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
      tailorBodyFitProblem(
        row?.body_fits ?? [],
        await loadOneTailorBodyFits(supabase, user.id),
        row?.category_slug,
      );
    if (publishProblem) throw new Error(`Touchez « Modifier ». ${publishProblem}`);

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
  if (!published) await alertAdminsModelHidden(id, user.id);

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/modeles");
  revalidatePath("/europe");
  revalidatePath("/admin", "layout");
}

/** Delete a model owned by the signed-in tailor. */
async function deleteModelImpl(id: string): Promise<void> {
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
  revalidatePath("/europe");
}

// Wrappers exportés : le message d'erreur doit revenir en valeur, pas en exception
// (masquée en production) — cf. `src/lib/action-result.ts`.
export async function deleteModel(id: string): Promise<ActionResult> {
  return runAction(() => deleteModelImpl(id));
}

export async function setModelPublished(id: string, published: boolean): Promise<ActionResult> {
  return runAction(() => setModelPublishedImpl(id, published));
}
