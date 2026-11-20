import "server-only";

import { cache } from "react";

import {
  FABRICS,
  FABRIC_CATEGORIES,
  MODELS,
  MODEL_CATEGORIES,
  REVIEWS,
  STYLES,
  TAILORS,
  VENDORS,
  VENDOR_REVIEWS,
} from "@/lib/fixtures";
import { belongsToCatalogModel, isCatalogModel } from "@/lib/catalog-link";
import { isEuropeCountry, type ProductOrigin } from "@/lib/europe";
import { effectiveBodyFits, type TailorBodyFits } from "@/lib/model-body-fit";
import { isSupabaseConfigured } from "@/lib/queries";
import { fabricUnitPrice, usagesForFilter } from "@/lib/fabric-specs";
import { isRetiredModel } from "@/lib/retired-models";
import { loadOneTailorBodyFits, loadTailorBodyFits } from "@/lib/tailor-body-fits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import type {
  Fabric,
  FabricCategory,
  GarmentModel,
  ModelCategory,
  Review,
  Style,
  Tailor,
  TailorAtelier,
  Vendor,
  VendorReview,
} from "@/lib/types";

export type FabricFilters = {
  category?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  /** Famille d'usage du filtre catalogue (cérémonie, quotidien…). */
  usage?: string;
  /** LIGHT | MEDIUM | HEAVY. */
  weight?: string;
};

export type TailorFilters = {
  city?: string;
  q?: string;
};

export type VendorFilters = {
  city?: string;
  q?: string;
};

// --- Reference data --------------------------------------------------------

export async function getFabricCategories(): Promise<FabricCategory[]> {
  if (!isSupabaseConfigured()) return FABRIC_CATEGORIES;
  const supabase = await createClient();
  const { data } = await supabase
    .from("fabric_categories")
    .select("*")
    .order("sort_order");
  return (data as FabricCategory[]) ?? FABRIC_CATEGORIES;
}

export async function getModelCategories(): Promise<ModelCategory[]> {
  if (!isSupabaseConfigured()) return MODEL_CATEGORIES;
  const supabase = await createClient();
  const { data } = await supabase
    .from("model_categories")
    .select("*")
    .order("sort_order");
  return (data as ModelCategory[]) ?? MODEL_CATEGORIES;
}

export async function getStyles(): Promise<Style[]> {
  if (!isSupabaseConfigured()) return STYLES;
  const supabase = await createClient();
  const { data } = await supabase.from("styles").select("*").order("sort_order");
  return (data as Style[]) ?? STYLES;
}

// --- Fabrics ---------------------------------------------------------------

// JALOFA EUROPE : la boutique (nom, ville, pays) voyage avec le tissu, aplatie en
// `origin` — c'est son pays qui range le tissu dans /europe.
const FABRIC_SELECT = "*, vendors(shop_name, city, country)";
const LEGACY_FABRIC_SELECT = "*";

/**
 * Filet de sécurité de déploiement : tant que la migration JALOFA EUROPE
 * (`20260817000001`) n'est pas appliquée, la colonne `country` n'existe pas et
 * les requêtes enrichies échoueraient — le catalogue serait vide. On sonde donc
 * la colonne (une requête minuscule, au plus une fois par minute) et on retombe
 * sur les anciennes requêtes si elle manque. Une fois la migration passée, le
 * site bascule tout seul, sans redéploiement.
 */
let europeColumns: { ok: boolean; at: number } | null = null;
const PROBE_TTL_MS = 60_000;

async function hasEuropeColumns(): Promise<boolean> {
  if (europeColumns && Date.now() - europeColumns.at < PROBE_TTL_MS) return europeColumns.ok;
  const supabase = await createClient();
  const { error } = await supabase.from("tailors").select("country").limit(1);
  // Seul « colonne inconnue » (42703) désactive ; une autre erreur ne change rien.
  const ok = error?.code !== "42703";
  europeColumns = { ok, at: Date.now() };
  return ok;
}

// Fiche produit tissu (migration 20260901000001) : tant qu'elle n'est pas
// appliquée, les filtres usage / épaisseur sont ignorés au lieu de vider le catalogue.
let fabricSpecColumns: { ok: boolean; at: number } | null = null;
async function hasFabricSpecColumns(): Promise<boolean> {
  if (fabricSpecColumns && Date.now() - fabricSpecColumns.at < PROBE_TTL_MS) return fabricSpecColumns.ok;
  const supabase = await createClient();
  const { error } = await supabase.from("fabrics").select("sales_unit").limit(1);
  const ok = error?.code !== "42703";
  fabricSpecColumns = { ok, at: Date.now() };
  return ok;
}

// Typées comme la requête enrichie : la variante « ancienne » renvoie les mêmes
// lignes, sans le pays (`origin.country` reste vide, rien n'est européen).
async function fabricSelect(): Promise<typeof FABRIC_SELECT> {
  return ((await hasEuropeColumns()) ? FABRIC_SELECT : LEGACY_FABRIC_SELECT) as typeof FABRIC_SELECT;
}

async function modelSelect(): Promise<typeof MODEL_SELECT> {
  return ((await hasEuropeColumns()) ? MODEL_SELECT : LEGACY_MODEL_SELECT) as typeof MODEL_SELECT;
}

type FabricRow = Omit<Fabric, "origin"> & {
  vendors?: { shop_name?: string | null; city?: string | null; country?: string | null } | null;
};

function toFabric(row: FabricRow): Fabric {
  const { vendors, ...fabric } = row;
  return { ...fabric, origin: toOrigin(vendors) };
}

/**
 * Une même page (l'accueil notamment) demande plusieurs fois le même catalogue :
 * `cache` ne fait la requête qu'une fois par rendu. La clé est une chaîne car
 * `cache` compare les arguments par identité (un nouvel objet `{}` à chaque
 * appel ne serait jamais reconnu). On rend une copie du tableau pour qu'un
 * appelant qui trie sur place ne dérange pas les autres.
 */
const getFabricsOnce = cache((key: string) => loadFabrics(JSON.parse(key) as FabricFilters));

export async function getFabrics(filters: FabricFilters = {}): Promise<Fabric[]> {
  return (await getFabricsOnce(JSON.stringify(filters))).slice();
}

async function loadFabrics(filters: FabricFilters): Promise<Fabric[]> {
  if (!isSupabaseConfigured()) {
    return FABRICS.filter((f) => {
      if (filters.category && f.category_slug !== filters.category) return false;
      if (
        filters.color &&
        !f.color?.toLowerCase().includes(filters.color.toLowerCase())
      )
        return false;
      const price = fabricUnitPrice(f);
      if (filters.minPrice && price < filters.minPrice) return false;
      if (filters.maxPrice && price > filters.maxPrice) return false;
      if (filters.q && !f.name.toLowerCase().includes(filters.q.toLowerCase()))
        return false;
      if (filters.weight && f.weight !== filters.weight) return false;
      if (
        filters.usage &&
        !(f.recommended_usages ?? []).some((u) => usagesForFilter(filters.usage!).includes(u as never))
      )
        return false;
      return true;
    });
  }

  const supabase = await createClient();
  let query = supabase.from("fabrics").select(await fabricSelect()).eq("is_active", true);
  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.color) query = query.ilike("color", `%${filters.color}%`);
  const specs = await hasFabricSpecColumns();
  // Prix de l'unité de vente (le prix affiché) ; au mètre avant la migration.
  const priceCol = specs ? "price_per_unit" : "price_per_meter";
  if (filters.minPrice) query = query.gte(priceCol, filters.minPrice);
  if (filters.maxPrice) query = query.lte(priceCol, filters.maxPrice);
  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  if (specs && filters.weight) query = query.eq("weight", filters.weight);
  if (specs && filters.usage) {
    const usages = usagesForFilter(filters.usage);
    if (usages.length) query = query.overlaps("recommended_usages", usages);
  }
  const { data } = await query.order("created_at", { ascending: false });
  return ((data as FabricRow[]) ?? []).map(toFabric);
}

/** Fabrics owned by the signed-in vendor (for the pro dashboard). */
export async function getVendorFabrics(): Promise<Fabric[]> {
  if (!isSupabaseConfigured()) return FABRICS;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return [];
  const { data } = await supabase
    .from("fabrics")
    .select("*")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });
  return (data as Fabric[]) ?? [];
}

export async function getFabricById(id: string): Promise<Fabric | null> {
  if (!isSupabaseConfigured()) {
    return FABRICS.find((f) => f.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("fabrics").select(await fabricSelect()).eq("id", id).single();
  return data ? toFabric(data as FabricRow) : null;
}

/** Tissus actifs d'une boutique donnée — la grille de sa fiche publique. */
export async function getFabricsByVendor(vendorId: string): Promise<Fabric[]> {
  if (!isSupabaseConfigured()) {
    return FABRICS.filter((f) => f.vendor_id === vendorId && f.is_active);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("fabrics")
    .select(await fabricSelect())
    .eq("vendor_id", vendorId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return ((data as FabricRow[]) ?? []).map(toFabric);
}

/** Les tissus que le tailleur a publiés pour ce modèle. */
export async function getModelFabricIds(modelId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("model_fabrics")
    .select("fabric_id")
    .eq("model_id", modelId);
  return ((data as { fabric_id: string }[] | null) ?? []).map((r) => r.fabric_id);
}

/** Pour l'espace tailleur : les tissus de chacun de ses modèles, par modèle. */
export async function getMyModelFabricLinks(): Promise<Record<string, string[]>> {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return {};
  const { data } = await supabase
    .from("model_fabrics")
    .select("model_id, fabric_id, model:models!inner(tailor_id)")
    .eq("model.tailor_id", user.id);
  const links: Record<string, string[]> = {};
  for (const row of (data as unknown as { model_id: string; fabric_id: string }[] | null) ?? []) {
    (links[row.model_id] ??= []).push(row.fabric_id);
  }
  return links;
}

/** L'adresse de retour du vendeur connecté (privée). */
export async function getMyVendorAddress(): Promise<TailorAtelier | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;
  const { data } = await supabase
    .from("vendor_addresses")
    .select("address, phone")
    .eq("vendor_id", user.id)
    .maybeSingle();
  return (data as TailorAtelier | null) ?? null;
}

/** L'adresse de l'atelier du tailleur connecté (privée). */
export async function getMyAtelier(): Promise<TailorAtelier | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;
  const { data } = await supabase
    .from("tailor_ateliers")
    .select("address, phone")
    .eq("tailor_id", user.id)
    .maybeSingle();
  return (data as TailorAtelier | null) ?? null;
}

/** « Mes métrages » du tailleur connecté : un tableau par collection. */
export async function getMyBodyFits(): Promise<TailorBodyFits> {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return {};
  return loadOneTailorBodyFits(supabase, user.id);
}

/**
 * « Mes recommandations » du tailleur connecté : écrites sur tous ses modèles,
 * on lit celles du plus récent qui en a.
 */
export async function getMyCareTips(): Promise<{ tips: string; modelCount: number }> {
  if (!isSupabaseConfigured()) return { tips: "", modelCount: 0 };
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { tips: "", modelCount: 0 };
  const { data } = await supabase
    .from("models")
    .select("care_tips")
    .eq("tailor_id", user.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as { care_tips: string | null }[];
  return {
    tips: rows.find((r) => r.care_tips?.trim())?.care_tips ?? "",
    modelCount: rows.length,
  };
}

// --- Models ----------------------------------------------------------------

// La galerie vit dans `model_photos` ; on l'aplatit en `photos` triée pour que
// l'UI n'ait qu'un tableau d'URLs, comme les fixtures. `tailors` n'est joint que
// pour savoir si l'auteur est ouvert (cf. `isOrderable`) et n'est pas exposé.
//
// JALOFA EUROPE : on joint aussi le nom, la ville et le pays de l'atelier. C'est
// le pays qui range le produit dans /europe (cf. `europe.ts`), sans colonne à
// tenir à jour sur chaque modèle.
const MODEL_SELECT =
  "*, model_photos(image_url, sort_order), tailors(is_active, is_suspended, shop_name, city, country)";
const LEGACY_MODEL_SELECT =
  "*, model_photos(image_url, sort_order), tailors(is_active, is_suspended, shop_name, city)";

type ModelRow = Omit<GarmentModel, "photos" | "origin"> & {
  model_photos?: { image_url: string; sort_order: number }[] | null;
  tailors?: {
    is_active: boolean;
    is_suspended: boolean;
    shop_name?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
};

function toOrigin(
  pro: { shop_name?: string | null; city?: string | null; country?: string | null } | null | undefined,
): ProductOrigin | null {
  if (!pro) return null;
  const country = pro.country ?? null;
  return {
    shop_name: pro.shop_name ?? null,
    city: pro.city ?? null,
    country,
    europe: isEuropeCountry(country),
  };
}

// Champ par champ plutôt qu'un spread : `tailors` ne sert qu'au filtre et n'a
// rien à faire dans la charge envoyée aux composants client.
function toModel(row: ModelRow): GarmentModel {
  return {
    id: row.id,
    slug: row.slug ?? null,
    tailor_id: row.tailor_id,
    name: row.name,
    category_slug: row.category_slug,
    description: row.description,
    difficulty: row.difficulty,
    avg_days: row.avg_days,
    price: row.price ?? null,
    quote_mode: row.quote_mode === "auto" ? "auto" : "manual",
    quote_price: row.quote_price ?? null,
    quote_delivery_fee: row.quote_delivery_fee ?? null,
    quote_ready_days: row.quote_ready_days ?? null,
    image_url: row.image_url,
    is_active: row.is_active,
    style_groups: row.style_groups ?? [],
    style_base: row.style_base ?? null,
    catalog_model_id: row.catalog_model_id ?? null,
    body_fits: row.body_fits ?? [],
    care_tips: row.care_tips ?? null,
    delivery_zone: row.delivery_zone,
    europe_type: row.europe_type ?? null,
    material: row.material ?? null,
    making_type: row.making_type ?? null,
    sizes: row.sizes ?? null,
    ready_to_wear: row.ready_to_wear === true,
    ready_colors: Array.isArray(row.ready_colors) ? row.ready_colors : [],
    ready_sizes: Array.isArray(row.ready_sizes) ? row.ready_sizes : [],
    ready_color_prices:
      row.ready_color_prices && typeof row.ready_color_prices === "object" && !Array.isArray(row.ready_color_prices)
        ? (row.ready_color_prices as Record<string, number>)
        : {},
    ready_color_images:
      row.ready_color_images && typeof row.ready_color_images === "object" && !Array.isArray(row.ready_color_images)
        ? (row.ready_color_images as Record<string, string>)
        : {},
    origin: toOrigin(row.tailors),
    photos: (row.model_photos ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.image_url),
  };
}

/**
 * Un modèle signé n'est commandable que si son auteur l'est aussi : le choisir
 * le verrouille comme tailleur, or `getTailors` ne sert que les boutiques
 * ouvertes. Sans ce filtre, la fiche mènerait à une étape tailleur vide.
 * Le catalogue de la plateforme (`tailor_id` null) reste toujours ouvert.
 */
function isOrderable(row: ModelRow): boolean {
  if (row.tailor_id === null) return true;
  return row.tailors?.is_active === true && row.tailors?.is_suspended === false;
}

// Même déduplication par rendu que `getFabrics`.
const getModelsOnce = cache((category: string) => loadModels({ category: category || undefined }));

export async function getModels(filters: { category?: string } = {}): Promise<
  GarmentModel[]
> {
  return (await getModelsOnce(filters.category ?? "")).slice();
}

async function loadModels(filters: { category?: string }): Promise<GarmentModel[]> {
  if (!isSupabaseConfigured()) {
    return MODELS.filter(
      (m) =>
        (!filters.category || m.category_slug === filters.category) && !isRetiredModel(m),
    );
  }
  const supabase = await createClient();
  let query = supabase.from("models").select(await modelSelect()).eq("is_active", true);
  if (filters.category) query = query.eq("category_slug", filters.category);
  const { data } = await query.order("name");
  return withTailorBodyFits(
    supabase,
    ((data as ModelRow[]) ?? [])
      .filter(isOrderable)
      .map(toModel)
      .filter((m) => !isRetiredModel(m)),
  );
}

/**
 * Les mètres de tissu viennent de « Mes métrages » : le tailleur les écrit une
 * fois et ils valent pour tous ses modèles de la collection.
 */
async function withTailorBodyFits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  models: GarmentModel[],
): Promise<GarmentModel[]> {
  const byTailor = await loadTailorBodyFits(
    supabase,
    models.map((m) => m.tailor_id),
  );
  if (byTailor.size === 0) return models;
  return models.map((m) => {
    const fits = m.tailor_id ? byTailor.get(m.tailor_id) : undefined;
    return fits
      ? { ...m, body_fits: effectiveBodyFits(m.body_fits, fits, m.category_slug) }
      : m;
  });
}

/**
 * Le catalogue de la plateforme (`tailor_id` null) proposé au tailleur comme
 * point de départ quand il ajoute une création : il s'approprie un modèle connu
 * (Grand Boubou, Kaftan…) qu'il n'a plus qu'à confirmer, ou part de zéro. Ce
 * sont des suggestions — pas les créations du tailleur, cf. `getTailorModels`.
 */
export async function getModelSuggestions(): Promise<GarmentModel[]> {
  if (!isSupabaseConfigured()) {
    return MODELS.filter((m) => m.tailor_id === null && !isRetiredModel(m));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("models")
    .select(await modelSelect())
    .is("tailor_id", null)
    .eq("is_active", true)
    .order("name");
  return ((data as ModelRow[]) ?? []).map(toModel).filter((m) => !isRetiredModel(m));
}

/**
 * Les créations des tailleurs rangées sous un ou plusieurs modèles du catalogue
 * (la grille « Les créations de nos tailleurs » de leur page). Seules les
 * créations commandables, cf. `getModels`. Une page dédiée de famille (grand
 * boubou, robe) passe tous ses modèles.
 */
export async function getTailorCreationsFor(
  catalogModels: GarmentModel[],
): Promise<GarmentModel[]> {
  const catalog = catalogModels.filter(isCatalogModel);
  if (catalog.length === 0) return [];
  const all = await getModels();
  return all.filter(
    (m) => m.tailor_id !== null && catalog.some((c) => belongsToCatalogModel(m, c)),
  );
}

/**
 * Créations publiques d'un tailleur — la grille de sa fiche publique
 * (`/tailleurs/[id]`). Seuls ses modèles actifs, du plus récent au plus ancien.
 */
export async function getModelsByTailor(tailorId: string): Promise<GarmentModel[]> {
  if (!isSupabaseConfigured()) {
    return MODELS.filter((m) => m.tailor_id === tailorId && m.is_active);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("models")
    .select(await modelSelect())
    .eq("tailor_id", tailorId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return ((data as ModelRow[]) ?? []).map(toModel);
}

/** Models created by the signed-in tailor (for the pro dashboard). */
export async function getTailorModels(): Promise<GarmentModel[]> {
  // En démo, on renvoie les créations du tailleur type (`getCurrentTailor` =
  // TAILORS[0]) : les mêmes que sur sa fiche publique, pour que dashboard et
  // vitrine restent cohérents. Le catalogue plateforme reste en suggestions
  // (cf. `getModelSuggestions`), ce qui rend l'ajout d'une création démontrable.
  if (!isSupabaseConfigured()) {
    const demoTailorId = TAILORS[0]?.id;
    return MODELS.filter((m) => m.tailor_id === demoTailorId);
  }
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return [];
  const { data } = await supabase
    .from("models")
    .select(await modelSelect())
    .eq("tailor_id", user.id)
    .order("created_at", { ascending: false });
  return ((data as ModelRow[]) ?? []).map(toModel);
}

export async function getModelById(id: string): Promise<GarmentModel | null> {
  if (!isSupabaseConfigured()) {
    return MODELS.find((m) => m.id === id && !isRetiredModel(m)) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("models").select(await modelSelect()).eq("id", id).single();
  if (!data || !isOrderable(data as ModelRow)) return null;
  const model = toModel(data as ModelRow);
  return isRetiredModel(model) ? null : (await withTailorBodyFits(supabase, [model]))[0];
}

/**
 * Résout un modèle par son `slug` stable plutôt que par son `id` UUID. C'est la
 * clé des pages dédiées (grand boubou, robe…) et de leurs familles : le slug
 * existe à l'identique en démo (fixtures) et en prod (colonne `models.slug`
 * seedée), alors que l'`id` est un UUID aléatoire en base. `null` si aucun
 * modèle actif ne porte ce slug — la page appelante retombe alors sur les
 * membres de la famille qui existent, ou sur `notFound()`.
 */
export async function getModelBySlug(slug: string): Promise<GarmentModel | null> {
  if (!isSupabaseConfigured()) {
    return MODELS.find((m) => m.slug === slug && !isRetiredModel(m)) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("models")
    .select(await modelSelect())
    .eq("slug", slug)
    .maybeSingle();
  if (!data || !isOrderable(data as ModelRow)) return null;
  const model = toModel(data as ModelRow);
  return isRetiredModel(model) ? null : (await withTailorBodyFits(supabase, [model]))[0];
}

/**
 * Résout le segment de `/modeles/[param]`, qui peut être soit l'`id` UUID (les
 * cartes du catalogue passent `model.id`), soit le `slug` stable (les tuiles de
 * la home pointent le slug — identique en démo et en prod, cf.
 * `garment-routes.ts`). On ne tente l'`id` que si le segment ressemble à un UUID,
 * pour éviter une requête vouée à échouer en base (`models.id` est de type
 * uuid). Un ancien préfixe `demo-` (liens ou marque-pages historiques) est
 * toléré en repli. `null` = aucun modèle → la page appelle `notFound()`.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getModelByIdOrSlug(param: string): Promise<GarmentModel | null> {
  if (UUID_RE.test(param)) {
    const byId = await getModelById(param);
    if (byId) return byId;
  }
  const bySlug = await getModelBySlug(param);
  if (bySlug) return bySlug;
  return param.startsWith("demo-") ? getModelBySlug(param.slice(5)) : null;
}

// --- Une seule fiche pour les deux métiers -------------------------------

type ShopInfo = {
  id: string;
  shop_name: string | null;
  bio: string | null;
  city: string | null;
  cover_url: string | null;
};

/**
 * Un compte pro porte une boutique tailleur ET une boutique de tissus. Le pro ne
 * remplit souvent qu'une des deux fiches (« Ma page publique ») : pour les
 * clients, l'autre reprend alors son nom, sa photo, sa ville et sa présentation.
 * Seuls les champs vides sont complétés — ce que le pro a écrit prime.
 */
async function fillFromSibling<T extends ShopInfo>(
  rows: T[],
  sibling: "tailors" | "vendors",
): Promise<T[]> {
  const missing = rows.filter((r) => !r.shop_name || !r.bio || !r.city || !r.cover_url);
  if (missing.length === 0) return rows;
  const supabase = await createClient();
  const { data } = await supabase
    .from(sibling)
    .select("id, shop_name, bio, city, cover_url")
    .in("id", missing.map((r) => r.id));
  const byId = new Map(((data as ShopInfo[] | null) ?? []).map((s) => [s.id, s]));
  return rows.map((r) => {
    const s = byId.get(r.id);
    if (!s) return r;
    return {
      ...r,
      shop_name: r.shop_name || s.shop_name,
      bio: r.bio || s.bio,
      city: r.city || s.city,
      cover_url: r.cover_url || s.cover_url,
    };
  });
}

// --- Tailors ---------------------------------------------------------------

export async function getTailors(filters: TailorFilters = {}): Promise<Tailor[]> {
  if (!isSupabaseConfigured()) {
    return TAILORS.filter((t) => {
      if (t.is_suspended) return false;
      if (filters.city && t.city?.toLowerCase() !== filters.city.toLowerCase())
        return false;
      if (
        filters.q &&
        !(t.shop_name ?? "").toLowerCase().includes(filters.q.toLowerCase())
      )
        return false;
      return true;
    });
  }
  const supabase = await createClient();
  let query = supabase
    .from("tailors")
    .select("*")
    .eq("is_activated", true)
    .eq("is_active", true)
    .eq("is_suspended", false);
  if (filters.city) query = query.ilike("city", filters.city);
  if (filters.q) query = query.ilike("shop_name", `%${filters.q}%`);
  const { data } = await query.order("rating", { ascending: false });
  // Masqué par l'administration (déjà `is_active` false) : double sécurité.
  return fillFromSibling(
    ((data as Tailor[]) ?? []).filter((t) => !t.hidden_by_admin),
    "vendors",
  );
}

export async function getTailorById(id: string): Promise<Tailor | null> {
  if (!isSupabaseConfigured()) {
    return TAILORS.find((t) => t.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("tailors").select("*").eq("id", id).single();
  if (!data) return null;
  const [tailor] = await fillFromSibling([data as Tailor], "vendors");
  return tailor;
}

/**
 * La boutique du tailleur connecté, pour l'édition de son profil public.
 * En démo (sans Supabase), on renvoie un tailleur type pour peupler le
 * formulaire ; en production, la ligne `tailors` de l'utilisateur courant.
 */
export async function getCurrentTailor(): Promise<Tailor | null> {
  if (!isSupabaseConfigured()) return TAILORS[0] ?? null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;
  const { data } = await supabase
    .from("tailors")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Tailor | null) ?? null;
}

// --- Vendors ---------------------------------------------------------------

export async function getVendors(filters: VendorFilters = {}): Promise<Vendor[]> {
  if (!isSupabaseConfigured()) {
    return VENDORS.filter((v) => {
      if (!v.is_active || v.is_suspended) return false;
      if (filters.city && v.city?.toLowerCase() !== filters.city.toLowerCase())
        return false;
      if (
        filters.q &&
        !(v.shop_name ?? "").toLowerCase().includes(filters.q.toLowerCase())
      )
        return false;
      return true;
    });
  }
  const supabase = await createClient();
  let query = supabase
    .from("vendors")
    .select("*")
    .eq("is_activated", true)
    .eq("is_active", true)
    .eq("is_suspended", false);
  if (filters.city) query = query.ilike("city", filters.city);
  if (filters.q) query = query.ilike("shop_name", `%${filters.q}%`);
  const { data } = await query.order("shop_name");
  return fillFromSibling((data as Vendor[]) ?? [], "tailors");
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  if (!isSupabaseConfigured()) {
    return VENDORS.find((v) => v.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("vendors").select("*").eq("id", id).single();
  if (!data) return null;
  const [vendor] = await fillFromSibling([data as Vendor], "tailors");
  return vendor;
}

/**
 * La boutique du vendeur connecté, pour l'édition de son profil public.
 * En démo (sans Supabase), on renvoie un vendeur type pour peupler le
 * formulaire ; en production, la ligne `vendors` de l'utilisateur courant.
 */
export async function getCurrentVendor(): Promise<Vendor | null> {
  if (!isSupabaseConfigured()) return VENDORS[0] ?? null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Vendor | null) ?? null;
}

// --- Reviews ---------------------------------------------------------------

/**
 * Un avis destiné à l'affichage : la ligne `reviews`, le nom de son auteur et
 * ses éventuelles photos (jusqu'à 3, jointes par le client).
 */
export type TailorReview = Review & {
  author_name: string | null;
  photos: string[];
};

type ReviewRow = Review & {
  client?: { full_name: string | null } | null;
  review_photos?: { image_url: string }[] | null;
};

export type LatestReviews = {
  reviews: TailorReview[];
  count: number;
  average: number;
};

/**
 * Les derniers avis clients de toute la plateforme, sans tri par note, avec le
 * total et la moyenne de TOUS les avis. Ce sont de vraies lignes `reviews` : sans
 * avis, le résultat est vide.
 */
export async function getLatestReviews(limit = 6): Promise<LatestReviews> {
  if (!isSupabaseConfigured()) {
    return { reviews: [], count: 0, average: 0 };
  }
  const supabase = await createClient();
  const [latest, ratings] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "*, client:profiles!reviews_client_id_fkey(full_name), review_photos(image_url)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("reviews").select("rating"),
  ]);
  const all = (ratings.data as { rating: number }[] | null) ?? [];
  return {
    reviews: ((latest.data as ReviewRow[]) ?? []).map((r) => ({
      ...r,
      author_name: r.client?.full_name ?? null,
      photos: (r.review_photos ?? []).map((p) => p.image_url),
    })),
    count: all.length,
    average: all.length ? all.reduce((sum, r) => sum + r.rating, 0) / all.length : 0,
  };
}

/** Avis publics d'un tailleur, du plus récent au plus ancien. */
export async function getTailorReviews(tailorId: string): Promise<TailorReview[]> {
  if (!isSupabaseConfigured()) {
    return REVIEWS.filter((r) => r.tailor_id === tailorId).map((r) => ({
      ...r,
      photos: [],
    }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      "*, client:profiles!reviews_client_id_fkey(full_name), review_photos(image_url)",
    )
    .eq("tailor_id", tailorId)
    .order("created_at", { ascending: false });
  return ((data as ReviewRow[]) ?? []).map((r) => ({
    ...r,
    author_name: r.client?.full_name ?? null,
    photos: (r.review_photos ?? []).map((p) => p.image_url),
  }));
}

export type ModelReviewStats = { count: number; average: number };

const MODEL_REVIEWS_SHOWN = 12;

// Un avis est lié à une commande, et c'est elle qui porte le modèle. La RLS cache
// les commandes aux visiteurs, d'où le client de service dans les deux fonctions
// suivantes : les commandes ne servent qu'à filtrer, rien d'elles n'est renvoyé.

/** Les vrais avis d'un modèle, les plus récents d'abord, avec le total et la moyenne. */
export async function getModelReviews(modelId: string): Promise<LatestReviews> {
  const none = { reviews: [], count: 0, average: 0 };
  if (!isSupabaseConfigured()) return none;
  try {
    const { data, error } = await createAdminClient()
      .from("reviews")
      .select(
        "id, order_id, client_id, tailor_id, rating, comment, created_at, client:profiles!reviews_client_id_fkey(full_name), review_photos(image_url), orders!inner(model_id)",
      )
      .eq("orders.model_id", modelId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as ReviewRow[];
    return {
      reviews: rows.slice(0, MODEL_REVIEWS_SHOWN).map((r) => ({
        id: r.id,
        order_id: r.order_id,
        client_id: r.client_id,
        tailor_id: r.tailor_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        author_name: r.client?.full_name ?? null,
        photos: (r.review_photos ?? []).map((p) => p.image_url),
      })),
      count: rows.length,
      average: rows.length ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length : 0,
    };
  } catch (error) {
    console.error("[getModelReviews]", error);
    return none;
  }
}

/** Nombre et moyenne des vrais avis de plusieurs modèles ; un modèle sans avis est absent. */
export async function getModelReviewStats(
  modelIds: string[],
): Promise<Map<string, ModelReviewStats>> {
  const stats = new Map<string, ModelReviewStats>();
  if (!isSupabaseConfigured() || modelIds.length === 0) return stats;
  try {
    const { data, error } = await createAdminClient()
      .from("reviews")
      .select("rating, orders!inner(model_id)")
      .in("orders.model_id", modelIds);
    if (error) throw error;
    const rows = (data ?? []) as unknown as {
      rating: number;
      orders: { model_id: string };
    }[];
    for (const { rating, orders } of rows) {
      const current = stats.get(orders.model_id) ?? { count: 0, average: 0 };
      const count = current.count + 1;
      stats.set(orders.model_id, {
        count,
        average: (current.average * current.count + rating) / count,
      });
    }
  } catch (error) {
    console.error("[getModelReviewStats]", error);
  }
  return stats;
}

/**
 * Un avis vendeur destiné à l'affichage : la ligne `fabric_reviews`, le nom de
 * l'auteur et ses éventuelles photos (jusqu'à 3, jointes par le client).
 */
export type VendorReviewView = VendorReview & {
  author_name: string | null;
  photos: string[];
};

type VendorReviewRow = VendorReview & {
  client?: { full_name: string | null } | null;
  fabric_review_photos?: { image_url: string }[] | null;
};

function mapVendorReview(r: VendorReviewRow): VendorReviewView {
  return {
    ...r,
    author_name: r.client?.full_name ?? null,
    photos: (r.fabric_review_photos ?? []).map((p) => p.image_url),
  };
}

/** Avis publics d'un vendeur de tissu, du plus récent au plus ancien. */
export async function getVendorReviews(
  vendorId: string,
): Promise<VendorReviewView[]> {
  if (!isSupabaseConfigured()) {
    return VENDOR_REVIEWS.filter((r) => r.vendor_id === vendorId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("fabric_reviews")
    .select(
      "*, client:profiles!fabric_reviews_client_id_fkey(full_name), fabric_review_photos(image_url)",
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return ((data as VendorReviewRow[]) ?? []).map(mapVendorReview);
}

/** Avis vérifiés portant sur un tissu précis (via la commande notée). */
export async function getFabricReviews(
  fabricId: string,
): Promise<VendorReviewView[]> {
  if (!isSupabaseConfigured()) {
    return VENDOR_REVIEWS.filter((r) => r.fabric_id === fabricId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("fabric_reviews")
    .select(
      "*, client:profiles!fabric_reviews_client_id_fkey(full_name), fabric_review_photos(image_url)",
    )
    .eq("fabric_id", fabricId)
    .order("created_at", { ascending: false });
  return ((data as VendorReviewRow[]) ?? []).map(mapVendorReview);
}

// --- Ventes validées (anti-arnaque) -----------------------------------------

/**
 * Les pros (tailleurs + vendeurs) dont JALOFA n'a pas encore validé les ventes
 * (cf. `@/lib/sales-approval`). Leurs articles restent visibles, mais on ne les
 * propose dans aucun parcours d'achat. Colonne absente (migration
 * 20260904000001 pas appliquée) = personne n'est bloqué.
 */
export const getUnapprovedSellerIds = cache(async (): Promise<Set<string>> => {
  if (!isSupabaseConfigured()) return new Set();
  const supabase = await createClient();
  const [t, v] = await Promise.all([
    supabase.from("tailors").select("id").eq("sales_approved", false),
    supabase.from("vendors").select("id").eq("sales_approved", false),
  ]);
  const ids = new Set<string>();
  for (const row of [...(t.error ? [] : (t.data ?? [])), ...(v.error ? [] : (v.data ?? []))]) {
    ids.add((row as { id: string }).id);
  }
  return ids;
});

/** Les tissus achetables : ceux dont le vendeur peut vendre. */
export function sellableFabrics(fabrics: Fabric[], unapproved: Set<string>): Fabric[] {
  if (unapproved.size === 0) return fabrics;
  return fabrics.filter((f) => !f.vendor_id || !unapproved.has(f.vendor_id));
}
