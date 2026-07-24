import "server-only";

import {
  FABRICS,
  FABRIC_CATEGORIES,
  MODELS,
  MODEL_CATEGORIES,
  REVIEWS,
  STYLES,
  TAILORS,
  VENDORS,
} from "@/lib/fixtures";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  Fabric,
  FabricCategory,
  GarmentModel,
  ModelCategory,
  Review,
  Style,
  Tailor,
  Vendor,
} from "@/lib/types";

export type FabricFilters = {
  category?: string;
  color?: string;
  maxPrice?: number;
  q?: string;
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

export async function getFabrics(filters: FabricFilters = {}): Promise<Fabric[]> {
  if (!isSupabaseConfigured()) {
    return FABRICS.filter((f) => {
      if (filters.category && f.category_slug !== filters.category) return false;
      if (filters.color && f.color?.toLowerCase() !== filters.color.toLowerCase())
        return false;
      if (filters.maxPrice && f.price_per_meter > filters.maxPrice) return false;
      if (filters.q && !f.name.toLowerCase().includes(filters.q.toLowerCase()))
        return false;
      return true;
    });
  }

  const supabase = await createClient();
  let query = supabase.from("fabrics").select("*").eq("is_active", true);
  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.color) query = query.ilike("color", filters.color);
  if (filters.maxPrice) query = query.lte("price_per_meter", filters.maxPrice);
  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  const { data } = await query.order("created_at", { ascending: false });
  return (data as Fabric[]) ?? [];
}

/** Fabrics owned by the signed-in vendor (for the pro dashboard). */
export async function getVendorFabrics(): Promise<Fabric[]> {
  if (!isSupabaseConfigured()) return FABRICS;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const { data } = await supabase.from("fabrics").select("*").eq("id", id).single();
  return (data as Fabric | null) ?? null;
}

/** Tissus actifs d'une boutique donnée — la grille de sa fiche publique. */
export async function getFabricsByVendor(vendorId: string): Promise<Fabric[]> {
  if (!isSupabaseConfigured()) {
    return FABRICS.filter((f) => f.vendor_id === vendorId && f.is_active);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("fabrics")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return (data as Fabric[]) ?? [];
}

// --- Models ----------------------------------------------------------------

// La galerie vit dans `model_photos` ; on l'aplatit en `photos` triée pour que
// l'UI n'ait qu'un tableau d'URLs, comme les fixtures. `tailors` n'est joint que
// pour savoir si l'auteur est ouvert (cf. `isOrderable`) et n'est pas exposé.
const MODEL_SELECT =
  "*, model_photos(image_url, sort_order), tailors(is_active, is_suspended)";

type ModelRow = Omit<GarmentModel, "photos"> & {
  model_photos?: { image_url: string; sort_order: number }[] | null;
  tailors?: { is_active: boolean; is_suspended: boolean } | null;
};

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
    image_url: row.image_url,
    is_active: row.is_active,
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

export async function getModels(filters: { category?: string } = {}): Promise<
  GarmentModel[]
> {
  if (!isSupabaseConfigured()) {
    return MODELS.filter(
      (m) => !filters.category || m.category_slug === filters.category,
    );
  }
  const supabase = await createClient();
  let query = supabase.from("models").select(MODEL_SELECT).eq("is_active", true);
  if (filters.category) query = query.eq("category_slug", filters.category);
  const { data } = await query.order("name");
  return ((data as ModelRow[]) ?? []).filter(isOrderable).map(toModel);
}

/**
 * Le catalogue de la plateforme (`tailor_id` null) proposé au tailleur comme
 * point de départ quand il ajoute une création : il s'approprie un modèle connu
 * (Grand Boubou, Kaftan…) qu'il n'a plus qu'à confirmer, ou part de zéro. Ce
 * sont des suggestions — pas les créations du tailleur, cf. `getTailorModels`.
 */
export async function getModelSuggestions(): Promise<GarmentModel[]> {
  if (!isSupabaseConfigured()) {
    return MODELS.filter((m) => m.tailor_id === null);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("models")
    .select(MODEL_SELECT)
    .is("tailor_id", null)
    .eq("is_active", true)
    .order("name");
  return ((data as ModelRow[]) ?? []).map(toModel);
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
    .select(MODEL_SELECT)
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("models")
    .select(MODEL_SELECT)
    .eq("tailor_id", user.id)
    .order("created_at", { ascending: false });
  return ((data as ModelRow[]) ?? []).map(toModel);
}

export async function getModelById(id: string): Promise<GarmentModel | null> {
  if (!isSupabaseConfigured()) {
    return MODELS.find((m) => m.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("models").select(MODEL_SELECT).eq("id", id).single();
  if (!data || !isOrderable(data as ModelRow)) return null;
  return toModel(data as ModelRow);
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
    return MODELS.find((m) => m.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("models")
    .select(MODEL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (!data || !isOrderable(data as ModelRow)) return null;
  return toModel(data as ModelRow);
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
  return (data as Tailor[]) ?? [];
}

export async function getTailorById(id: string): Promise<Tailor | null> {
  if (!isSupabaseConfigured()) {
    return TAILORS.find((t) => t.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("tailors").select("*").eq("id", id).single();
  return (data as Tailor | null) ?? null;
}

/**
 * La boutique du tailleur connecté, pour l'édition de son profil public.
 * En démo (sans Supabase), on renvoie un tailleur type pour peupler le
 * formulaire ; en production, la ligne `tailors` de l'utilisateur courant.
 */
export async function getCurrentTailor(): Promise<Tailor | null> {
  if (!isSupabaseConfigured()) return TAILORS[0] ?? null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  return (data as Vendor[]) ?? [];
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  if (!isSupabaseConfigured()) {
    return VENDORS.find((v) => v.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("vendors").select("*").eq("id", id).single();
  return (data as Vendor | null) ?? null;
}

/**
 * La boutique du vendeur connecté, pour l'édition de son profil public.
 * En démo (sans Supabase), on renvoie un vendeur type pour peupler le
 * formulaire ; en production, la ligne `vendors` de l'utilisateur courant.
 */
export async function getCurrentVendor(): Promise<Vendor | null> {
  if (!isSupabaseConfigured()) return VENDORS[0] ?? null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Vendor | null) ?? null;
}

// --- Reviews ---------------------------------------------------------------

/** Un avis destiné à l'affichage : la ligne `reviews` + le nom de son auteur. */
export type TailorReview = Review & { author_name: string | null };

type ReviewRow = Review & { client?: { full_name: string | null } | null };

/** Avis publics d'un tailleur, du plus récent au plus ancien. */
export async function getTailorReviews(tailorId: string): Promise<TailorReview[]> {
  if (!isSupabaseConfigured()) {
    return REVIEWS.filter((r) => r.tailor_id === tailorId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, client:profiles!reviews_client_id_fkey(full_name)")
    .eq("tailor_id", tailorId)
    .order("created_at", { ascending: false });
  return ((data as ReviewRow[]) ?? []).map((r) => ({
    ...r,
    author_name: r.client?.full_name ?? null,
  }));
}
