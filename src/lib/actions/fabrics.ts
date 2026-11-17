"use server";

import { revalidatePath } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { parseDeliveryZone } from "@/lib/delivery";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import {
  CARE_INSTRUCTIONS,
  DRAPES,
  OPACITIES,
  PATTERNS,
  STRETCHES,
  USAGES,
  WEIGHTS,
  parseSalesUnit,
  pickKey,
  pricePerMeterFor,
} from "@/lib/fabric-specs";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type FabricFormState =
  | { ok: true; id: string | null }
  | { ok: false; error: string }
  | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La gestion des tissus sera possible une fois Supabase configuré.";

const BUCKET = "fabric-images";

/** Postgres `foreign_key_violation`. */
const FOREIGN_KEY_VIOLATION = "23503";
/** Colonne inconnue (Postgres / cache PostgREST) : migration fiche produit pas encore appliquée. */
const UNKNOWN_COLUMN = new Set(["42703", "PGRST204"]);

/** Colonnes ajoutées par la migration 20260901000001 (fiche produit). */
const SPEC_COLUMNS = [
  "sales_unit",
  "price_per_unit",
  "width_cm",
  "min_order_qty",
  "composition",
  "origin_brand",
  "weight",
  "grammage_gsm",
  "opacity",
  "drape",
  "stretch",
  "pattern",
  "finish",
  "care_instructions",
  "recommended_usages",
  "detail_image_url",
  "color_variants",
] as const;

/** Repli intermédiaire : seule la migration 20260902000001 manque. */
function withoutVariants<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const copy: Record<string, unknown> = { ...payload };
  delete copy.color_variants;
  return copy as Partial<T>;
}

type ColorVariants = Record<string, { price: number | null; image_url: string | null }>;

/** Le JSON du formulaire, ramené aux seules couleurs du tissu et à des valeurs saines. */
function parseColorVariants(raw: FormDataEntryValue | null, colors: string[]): ColorVariants {
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(String(raw ?? "{}"));
  } catch {
    parsed = {};
  }
  const out: ColorVariants = {};
  const src = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  for (const c of colors) {
    const v = (src[c] ?? {}) as { price?: unknown; image_url?: unknown };
    const price = Math.round(Number(v.price));
    const image = typeof v.image_url === "string" && v.image_url.startsWith("http") ? v.image_url : null;
    out[c] = { price: Number.isFinite(price) && price > 0 ? price : null, image_url: image };
  }
  return out;
}

function withoutSpecs<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const copy: Record<string, unknown> = { ...payload };
  for (const col of SPEC_COLUMNS) delete copy[col];
  return copy as Partial<T>;
}

/** Entier positif, ou null si vide / invalide. */
function optionalInt(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Math.round(Number(s.replace(",", ".")));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Cases cochées d'un groupe, filtrées sur les clés connues. */
function checked<K extends string>(formData: FormData, name: string, dict: Record<K, unknown>): K[] {
  return formData
    .getAll(name)
    .map((v) => pickKey(dict, v))
    .filter((v): v is K => v !== null);
}

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/**
 * Make sure the seller has the `vendors` row that `fabrics.vendor_id` points at.
 *
 * Signup only creates one for role='vendor', so a tailor listing cloth has none.
 * The shop row is what carries the fabric, not the role — their profile stays
 * 'tailor'. A no-op once the row exists.
 */
async function ensureVendorShop(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ error: string } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  const profile = data as { full_name: string | null } | null;

  const { error } = await supabase
    .from("vendors")
    .upsert(
      { id: userId, shop_name: profile?.full_name ?? null },
      { onConflict: "id", ignoreDuplicates: true },
    );
  return error ? { error: error.message } : null;
}

/** Create a new fabric or update an existing one owned by the signed-in seller. */
export async function saveFabric(
  _prev: FabricFormState,
  formData: FormData,
): Promise<FabricFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const id = text(formData.get("id"));
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Le nom du tissu est requis." };

  // Obligatoire : l'acheteur doit savoir ce qu'il achète.
  if (!text(formData.get("category_slug"))) {
    return { ok: false, error: "Choisissez la catégorie du tissu." };
  }

  const file = toFile(formData.get("image"));
  const previousUrl = text(formData.get("image_url"));
  if (!file && !previousUrl) {
    return { ok: false, error: "La photo du tissu est requise." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  // 2e photo : gros plan sur le tissage. Exigée à la création (fiche produit),
  // pas imposée aux tissus déjà en ligne.
  const detailFile = toFile(formData.get("detail_image"));
  const previousDetailUrl = text(formData.get("detail_image_url"));
  if (!detailFile && !previousDetailUrl) {
    return { ok: false, error: "Ajoutez une 2e photo : un gros plan sur le tissage." };
  }

  const salesUnit = parseSalesUnit(formData.get("sales_unit"));
  const unitPrice = toNumber(formData.get("price_per_unit") ?? formData.get("price_per_meter"));
  if (unitPrice <= 0) return { ok: false, error: "Indiquez le prix." };
  const widthCm = optionalInt(formData.get("width_cm"));
  if (widthCm === null || widthCm < 30 || widthCm > 400) {
    return { ok: false, error: "La laize doit être entre 30 et 400 cm." };
  }
  const minQty = toNumber(formData.get("min_order_qty"));
  if (minQty <= 0) return { ok: false, error: "Indiquez la quantité minimum." };
  if (minQty > 30) return { ok: false, error: "La quantité minimum ne peut pas dépasser 30." };

  // Tous les champs de la fiche sont obligatoires : l'acheteur doit tout savoir.
  if (text(formData.get("stock_quantity")) === null) {
    return { ok: false, error: "Indiquez le stock." };
  }
  const stockQty = toNumber(formData.get("stock_quantity"));
  if (!id && stockQty <= 0) return { ok: false, error: "Indiquez le stock." };
  const missing = (
    [
      ["composition", "la composition"],
      ["origin_brand", "la marque / origine"],
      ["color", "au moins une couleur"],
    ] as const
  ).find(([field]) => !text(formData.get(field)));
  if (missing) return { ok: false, error: `Indiquez ${missing[1]}.` };
  // « Toucher & tombé », « Entretien & usages » et la finition sont facultatifs.
  if (!pickKey(PATTERNS, formData.get("pattern"))) {
    return { ok: false, error: "Choisissez le motif." };
  }

  let imageUrl = previousUrl;
  if (file) {
    const upload = await uploadImage(supabase, BUCKET, user.id, file);
    if ("error" in upload) return { ok: false, error: upload.error };
    imageUrl = upload.url;
  }
  let detailUrl = previousDetailUrl;
  if (detailFile) {
    const upload = await uploadImage(supabase, BUCKET, user.id, detailFile);
    if ("error" in upload) {
      if (file) await removeImage(supabase, BUCKET, imageUrl);
      return { ok: false, error: upload.error };
    }
    detailUrl = upload.url;
  }
  // Prix / photo par couleur — facultatifs. Une photo envoyée remplace l'ancienne.
  const colorList = String(formData.get("color") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const colorVariants = parseColorVariants(formData.get("color_variants"), colorList);
  const colorFiles = formData.getAll("color_image");
  const colorFor = formData.getAll("color_image_for").map(String);
  const colorUploads: string[] = [];
  for (const [i, raw] of colorFiles.entries()) {
    const f = toFile(raw);
    const c = colorFor[i];
    if (!f || !c || !colorVariants[c]) continue;
    const upload = await uploadImage(supabase, BUCKET, user.id, f);
    if ("error" in upload) continue; // Facultatif : on n'arrête pas l'enregistrement.
    colorUploads.push(upload.url);
    colorVariants[c].image_url = upload.url;
  }

  // Ne pas laisser d'upload orphelin si l'enregistrement échoue.
  const dropUploads = async () => {
    if (file) await removeImage(supabase, BUCKET, imageUrl);
    if (detailFile) await removeImage(supabase, BUCKET, detailUrl);
    for (const url of colorUploads) await removeImage(supabase, BUCKET, url);
  };

  const payload = {
    name,
    category_slug: text(formData.get("category_slug")),
    color: text(formData.get("color")),
    // Ancien libellé, lu par le catalogue (nuancier, sur-titre) : repli sur la composition.
    material: text(formData.get("material")) ?? text(formData.get("composition")),
    price_per_meter: pricePerMeterFor(salesUnit, unitPrice),
    description: text(formData.get("description")),
    delivery_zone: parseDeliveryZone(formData.get("delivery_zone")),
    image_url: imageUrl,
    is_active: formData.get("is_active") === "on",
    // Stock dans l'unité de vente (colonne historique `stock_meters`). À zéro,
    // le tissu est épuisé ; avec du stock, il redevient disponible.
    stock_meters: stockQty,
    in_stock: stockQty > 0,
    // Fiche produit
    sales_unit: salesUnit,
    price_per_unit: unitPrice,
    width_cm: widthCm,
    min_order_qty: minQty,
    composition: text(formData.get("composition")),
    origin_brand: text(formData.get("origin_brand")),
    weight: pickKey(WEIGHTS, formData.get("weight")),
    grammage_gsm: optionalInt(formData.get("grammage_gsm")),
    opacity: pickKey(OPACITIES, formData.get("opacity")),
    drape: pickKey(DRAPES, formData.get("drape")),
    stretch: pickKey(STRETCHES, formData.get("stretch")),
    pattern: pickKey(PATTERNS, formData.get("pattern")),
    finish: text(formData.get("finish")),
    care_instructions: checked(formData, "care_instructions", CARE_INSTRUCTIONS),
    recommended_usages: checked(formData, "recommended_usages", USAGES),
    detail_image_url: detailUrl,
    color_variants: colorVariants,
  };

  let savedId = id;
  if (id) {
    // Update — RLS also enforces ownership, but scope the query explicitly.
    const update = (p: Partial<typeof payload>) =>
      supabase.from("fabrics").update(p).eq("id", id).eq("vendor_id", user.id);
    let { error } = await update(payload);
    // Migrations pas encore appliquées : on garde l'essentiel.
    if (error && UNKNOWN_COLUMN.has(error.code)) ({ error } = await update(withoutVariants(payload)));
    if (error && UNKNOWN_COLUMN.has(error.code)) ({ error } = await update(withoutSpecs(payload)));
    if (error) {
      await dropUploads();
      return { ok: false, error: error.message };
    }
    if (file && previousUrl !== imageUrl) {
      await removeImage(supabase, BUCKET, previousUrl);
    }
    if (detailFile && previousDetailUrl && previousDetailUrl !== detailUrl) {
      await removeImage(supabase, BUCKET, previousDetailUrl);
    }
  } else {
    const shop = await ensureVendorShop(supabase, user.id);
    if (shop) {
      await dropUploads();
      return { ok: false, error: shop.error };
    }
    const insert = (p: Partial<typeof payload>) =>
      supabase
        .from("fabrics")
        .insert({ ...p, vendor_id: user.id })
        .select("id")
        .single();
    let { data: created, error } = await insert(payload);
    if (error && UNKNOWN_COLUMN.has(error.code)) {
      ({ data: created, error } = await insert(withoutVariants(payload)));
    }
    if (error && UNKNOWN_COLUMN.has(error.code)) {
      ({ data: created, error } = await insert(withoutSpecs(payload)));
    }
    if (error || !created) {
      await dropUploads();
      return { ok: false, error: error?.message ?? "Ajout impossible." };
    }
    savedId = (created as { id: string }).id;
  }

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
  revalidatePath("/europe");
  return { ok: true, id: savedId };
}

/** Le pro indique si son tissu est disponible ou épuisé. */
async function setFabricInStockImpl(id: string, inStock: boolean): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data, error } = await supabase
    .from("fabrics")
    .update({ in_stock: inStock })
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Tissu introuvable.");

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
  revalidatePath("/europe");
  revalidatePath(`/tissus/${id}`);
  revalidatePath("/modeles", "layout");
}

/** Le pro masque son tissu (retiré de la boutique) ou le remet en ligne. */
async function setFabricActiveImpl(id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data, error } = await supabase
    .from("fabrics")
    .update({ is_active: active })
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Tissu introuvable.");

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
  revalidatePath("/europe");
  revalidatePath(`/tissus/${id}`);
  revalidatePath("/modeles", "layout");
}

/** Delete a fabric owned by the signed-in seller. */
async function deleteFabricImpl(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data } = await supabase
    .from("fabrics")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", user.id)
    .single();
  const fabric = data as { image_url: string | null; detail_image_url?: string | null } | null;

  const { error } = await supabase
    .from("fabrics")
    .delete()
    .eq("id", id)
    .eq("vendor_id", user.id);
  // `orders.fabric_id` has no cascade — a fabric already ordered cannot leave,
  // or the client's order history would lose what it was made from.
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    throw new Error(
      "Ce tissu a déjà été commandé et ne peut pas être supprimé. Masquez-le pour le retirer de la boutique.",
    );
  }
  if (error) throw new Error(error.message);

  await removeImage(supabase, BUCKET, fabric?.image_url ?? null);
  await removeImage(supabase, BUCKET, fabric?.detail_image_url ?? null);

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
  revalidatePath("/europe");
}

function revalidateFabric(id: string) {
  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
  revalidatePath("/europe");
  revalidatePath(`/tissus/${id}`);
  revalidatePath("/modeles", "layout");
}

async function ownedFabric(id: string) {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  const { data } = await supabase
    .from("fabrics")
    .select("id, stock_meters, color")
    .eq("id", id)
    .eq("vendor_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("Tissu introuvable.");
  return {
    supabase,
    userId: user.id,
    fabric: data as { id: string; stock_meters: number | null; color: string | null },
  };
}

/**
 * Nouveau stock reçu : seule la quantité est demandée. Elle s'ajoute à ce qui
 * reste, et le tissu repasse « disponible ».
 */
async function restockFabricImpl(id: string, added: number): Promise<void> {
  const qty = Number(added);
  if (!Number.isFinite(qty) || qty <= 0 || qty > 100000) {
    throw new Error("Indiquez la quantité reçue.");
  }
  const { supabase, userId, fabric } = await ownedFabric(id);
  const stock = Math.round((Math.max(0, Number(fabric.stock_meters ?? 0)) + qty) * 100) / 100;
  const { error } = await supabase
    .from("fabrics")
    .update({ stock_meters: stock, in_stock: true })
    .eq("id", id)
    .eq("vendor_id", userId);
  if (error) throw new Error(error.message);
  revalidateFabric(id);
}

/**
 * Nouvelles couleurs pour un tissu déjà publié — rien d'autre à ressaisir. Une
 * photo par nouvelle couleur, facultative : `color_image` + `color_image_for`
 * dans `photos`, dans le même ordre.
 */
async function addFabricColorsImpl(id: string, colors: string[], photos?: FormData): Promise<void> {
  const clean = (Array.isArray(colors) ? colors : [])
    .map((c) => String(c).trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 30);
  if (clean.length === 0) throw new Error("Choisissez au moins une couleur.");
  const { supabase, userId, fabric } = await ownedFabric(id);
  const current = (fabric.color ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const added = clean.filter((c) => !current.includes(c));
  const merged = [...current, ...added];

  // Photos des nouvelles couleurs, rangées dans `color_variants`.
  const files = photos?.getAll("color_image") ?? [];
  const fileFor = photos?.getAll("color_image_for").map(String) ?? [];
  const uploads: Record<string, string> = {};
  for (const [i, raw] of files.entries()) {
    const f = toFile(raw);
    const c = fileFor[i];
    if (!f || !c || !added.includes(c)) continue;
    const upload = await uploadImage(supabase, BUCKET, userId, f);
    if ("error" in upload) {
      for (const url of Object.values(uploads)) await removeImage(supabase, BUCKET, url);
      throw new Error(upload.error);
    }
    uploads[c] = upload.url;
  }

  let variants: ColorVariants | null = null;
  if (Object.keys(uploads).length > 0) {
    const { data: row } = await supabase
      .from("fabrics")
      .select("color_variants")
      .eq("id", id)
      .eq("vendor_id", userId)
      .maybeSingle();
    variants = { ...((row as { color_variants: ColorVariants | null } | null)?.color_variants ?? {}) };
    for (const [c, url] of Object.entries(uploads)) {
      variants[c] = { price: variants[c]?.price ?? null, image_url: url };
    }
  }

  const { error } = await supabase
    .from("fabrics")
    .update({ color: merged.join(", "), ...(variants ? { color_variants: variants } : {}) })
    .eq("id", id)
    .eq("vendor_id", userId);
  if (error) {
    for (const url of Object.values(uploads)) await removeImage(supabase, BUCKET, url);
    throw new Error(error.message);
  }
  revalidateFabric(id);
}

// Wrappers exportés : le message d'erreur doit revenir en valeur, pas en exception
// (masquée en production) — cf. `src/lib/action-result.ts`.
export async function deleteFabric(id: string): Promise<ActionResult> {
  return runAction(() => deleteFabricImpl(id));
}

export async function setFabricInStock(id: string, inStock: boolean): Promise<ActionResult> {
  return runAction(() => setFabricInStockImpl(id, inStock));
}

export async function setFabricActive(id: string, active: boolean): Promise<ActionResult> {
  return runAction(() => setFabricActiveImpl(id, active));
}

export async function restockFabric(id: string, added: number): Promise<ActionResult> {
  return runAction(() => restockFabricImpl(id, added));
}

export async function addFabricColors(
  id: string,
  colors: string[],
  photos?: FormData,
): Promise<ActionResult> {
  return runAction(() => addFabricColorsImpl(id, colors, photos));
}
