import "server-only";

import { cache } from "react";

import { DEMO_ALL_ORDERS, DEMO_REVIEWS, DEMO_USERS, DEMO_VENDORS } from "@/lib/admin-demo";
import {
  buildPayouts,
  proDirectory,
  subscriptionMrr,
  sumPayouts,
} from "@/lib/payouts";
import { isTerminal } from "@/lib/pipeline";
import { FABRICS, MODELS, TAILORS } from "@/lib/fixtures";
import type { OrderListItem } from "@/lib/orders-data";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Fabric,
  GarmentModel,
  Profile,
  Review,
  Tailor,
  Vendor,
} from "@/lib/types";

/**
 * Le sésame de toutes les lectures d'administration : on vérifie d'abord, via la
 * session RLS, que l'appelant est bien `admin` ; alors seulement on renvoie le
 * client service-role qui voit toute la place. Pour tout autre visiteur (ou
 * personne connectée), on renvoie `null` et les lectures retombent sur du vide —
 * aucune donnée globale ne fuit, même si une page d'admin était rendue par
 * erreur. `cache` garantit un seul contrôle par requête, partagé par les six
 * lectures ci-dessous.
 */
const adminDb = cache(async () => {
  const rls = await createClient();
  const {
    data: { user },
  } = await rls.auth.getUser();
  if (!user) return null;
  const { data } = await rls
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "admin") return null;
  // Clé de service absente (ex. pas encore reportée sur Vercel) : plutôt que de
  // faire planter tout l'espace, on retombe sur du vide. L'admin voit un tableau
  // vide — le signal qu'il reste `SUPABASE_SERVICE_ROLE_KEY` à renseigner.
  try {
    return createAdminClient();
  } catch {
    return null;
  }
});

/**
 * Vue de la place de marché réservée à l'administration. Comme le reste de
 * l'app, chaque lecture retombe sur les données de démonstration tant que
 * Supabase n'est pas provisionné (cf. `isSupabaseConfigured`).
 *
 * À la différence du catalogue public (`src/lib/data.ts`), l'admin voit aussi
 * ce qui est désactivé : les requêtes ne filtrent pas sur `is_active`.
 */

/** Un avis, joint à son auteur et à la boutique notée, pour l'affichage. */
export type ReviewRow = Review & {
  client?: { full_name: string | null } | null;
  tailor?: { shop_name: string | null } | null;
};

const ORDER_SELECT =
  "*, model:models(name), fabric:fabrics(name, image_url), tailor:tailors(shop_name), vendor:vendors(shop_name), style:styles(name), client:profiles!orders_client_id_fkey(full_name, phone)";

export const getAllOrders = cache(async (): Promise<OrderListItem[]> => {
  if (!isSupabaseConfigured()) return DEMO_ALL_ORDERS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  return (data as unknown as OrderListItem[]) ?? [];
});

export const getAllUsers = cache(async (): Promise<Profile[]> => {
  if (!isSupabaseConfigured()) return DEMO_USERS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Profile[]) ?? [];
});

export const getAllTailors = cache(async (): Promise<Tailor[]> => {
  if (!isSupabaseConfigured()) return TAILORS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("tailors")
    .select("*")
    .order("rating", { ascending: false });
  return (data as Tailor[]) ?? [];
});

export const getAllVendors = cache(async (): Promise<Vendor[]> => {
  if (!isSupabaseConfigured()) return DEMO_VENDORS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase.from("vendors").select("*").order("shop_name");
  return (data as Vendor[]) ?? [];
});

export const getAllFabrics = cache(async (): Promise<Fabric[]> => {
  if (!isSupabaseConfigured()) return FABRICS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("fabrics")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Fabric[]) ?? [];
});

type ModelRow = Omit<GarmentModel, "photos"> & {
  model_photos?: { image_url: string; sort_order: number }[] | null;
};

export const getAllModels = cache(async (): Promise<GarmentModel[]> => {
  if (!isSupabaseConfigured()) return MODELS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("models")
    .select("*, model_photos(image_url, sort_order)")
    .order("name");
  return ((data as ModelRow[]) ?? []).map((row) => ({
    ...row,
    photos: (row.model_photos ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.image_url),
  }));
});

export const getAllReviews = cache(async (): Promise<ReviewRow[]> => {
  if (!isSupabaseConfigured()) return DEMO_REVIEWS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("reviews")
    .select(
      "*, client:profiles!reviews_client_id_fkey(full_name), tailor:tailors(shop_name)",
    )
    .order("created_at", { ascending: false });
  return (data as unknown as ReviewRow[]) ?? [];
});

// --- Agrégats de la vue d'ensemble -----------------------------------------

export type AdminStats = {
  users: { total: number; clients: number; tailors: number; vendors: number };
  orders: { total: number; pending: number; ongoing: number; delivered: number };
  /** Volume d'affaires : total payé par les clients sur les commandes réglées. */
  gmv: number;
  /** Les revenus propres à la plateforme, à distinguer de ce qu'elle reverse. */
  platform: {
    /** Commissions prélevées sur les ventes des pros au plan Gratuit. */
    commission: number;
    /** Abonnements des pros — 100% JALOFA. */
    subscriptions: number;
    /** Frais de livraison encaissés. */
    delivery: number;
    /** Total : commissions + abonnements + livraison. */
    total: number;
  };
  /** Ce que JALOFA doit reverser aux prestataires (net, commissions déduites). */
  netOwed: number;
  catalog: { fabrics: number; models: number; tailors: number; vendors: number };
};

/** Le total encaissé par la place sur une liste de commandes payées. */
export function gmvOf(orders: OrderListItem[]): number {
  return orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total_amount, 0);
}

export async function getAdminStats(): Promise<AdminStats> {
  const [users, orders, fabrics, models, tailors, vendors] = await Promise.all([
    getAllUsers(),
    getAllOrders(),
    getAllFabrics(),
    getAllModels(),
    getAllTailors(),
    getAllVendors(),
  ]);

  const gmv = gmvOf(orders);

  // La part propre à JALOFA : les commissions ne pèsent que sur les pros au plan
  // Gratuit (`buildPayouts`), auxquelles s'ajoutent les abonnements (100% JALOFA)
  // et les frais de livraison. Distinct du net reversé aux prestataires.
  const vendorTotals = sumPayouts(
    buildPayouts("vendor", orders, proDirectory(vendors)),
  );
  const tailorTotals = sumPayouts(
    buildPayouts("tailor", orders, proDirectory(tailors)),
  );
  const commission = vendorTotals.commission + tailorTotals.commission;
  const subscriptions = subscriptionMrr(vendors) + subscriptionMrr(tailors);
  const delivery = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.delivery_fee, 0);

  return {
    users: {
      total: users.length,
      clients: users.filter((u) => u.role === "client").length,
      tailors: users.filter((u) => u.role === "tailor").length,
      vendors: users.filter((u) => u.role === "vendor").length,
    },
    orders: {
      total: orders.length,
      pending: orders.filter((o) => o.status === "received").length,
      ongoing: orders.filter(
        (o) => o.status !== "received" && !isTerminal(o.status),
      ).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    },
    gmv,
    platform: {
      commission,
      subscriptions,
      delivery,
      total: commission + subscriptions + delivery,
    },
    netOwed: vendorTotals.net + tailorTotals.net,
    catalog: {
      fabrics: fabrics.length,
      models: models.length,
      tailors: tailors.length,
      vendors: vendors.length,
    },
  };
}
