import "server-only";

import { cache } from "react";

import {
  DEMO_ALL_ORDERS,
  DEMO_FEEDBACK,
  DEMO_REVIEWS,
  DEMO_USERS,
  DEMO_VENDOR_REVIEWS,
  DEMO_VENDORS,
} from "@/lib/admin-demo";
import {
  buildPayouts,
  proDirectory,
  sumPayouts,
} from "@/lib/payouts";
import { withCancellations } from "@/lib/order-cancellations";
import { readCollectedSubscriptions } from "@/lib/pro-subscription";
import { isTerminal } from "@/lib/pipeline";
import { FABRICS, MODELS, TAILORS } from "@/lib/fixtures";
import {
  getPublishedInspiration,
  type InspirationPostView,
} from "@/lib/inspiration-data";
import type { OrderListItem } from "@/lib/orders-data";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Fabric,
  Feedback,
  GarmentModel,
  Profile,
  Review,
  Tailor,
  Vendor,
  VendorReview,
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

/** Un avis tailleur, joint à son auteur et à la boutique notée, pour l'affichage. */
export type ReviewRow = Review & {
  client?: { full_name: string | null } | null;
  tailor?: { shop_name: string | null } | null;
};

/** Un avis vendeur, joint à son auteur et à la boutique notée, pour l'affichage. */
export type VendorReviewRow = VendorReview & {
  client?: { full_name: string | null } | null;
  vendor?: { shop_name: string | null } | null;
};

/** Avis normalisé pour la vue d'administration, quel que soit le métier noté. */
export type AdminReviewRow = {
  id: string;
  /** Métier noté — décide du libellé « Tailleur » / « Vendeur ». */
  kind: "tailor" | "vendor";
  rating: number;
  comment: string | null;
  created_at: string;
  clientName: string | null;
  targetName: string | null;
};

const ORDER_SELECT =
  "*, model:models(name), fabric:fabrics(name, image_url), tailor:tailors(shop_name), vendor:vendors(shop_name), style:styles(name), client:profiles!orders_client_id_fkey(full_name, phone), private_contact:order_contacts(first_name, last_name, email, phone), fabric_return:fabric_returns(status)";

/**
 * L'admin relie tout de suite le code au client, sans attendre le paiement. Recopié
 * sur les colonnes `contact_*` (vides en base), que lisent les pages de l'admin.
 */
function withPrivateContact(order: OrderListItem): OrderListItem {
  const contact = order.private_contact;
  if (!contact) return order;
  return {
    ...order,
    contact_first_name: contact.first_name,
    contact_last_name: contact.last_name,
    contact_email: contact.email,
    contact_phone: contact.phone,
  };
}

/**
 * Tissus seuls expédiés, en attente de la confirmation du client, avec l'heure
 * d'expédition pour compter les 48 h.
 */
/**
 * Les commandes en route vers le client — tenue envoyée par le tailleur
 * (`shipped`) ou tissu seul envoyé par le vendeur (`fabric_shipped`). JALOFA
 * demande au client s'il les a reçues ; les « pas reçues » d'abord, puis les
 * plus anciens envois.
 */
export async function getOrdersAwaitingReceipt(): Promise<
  { order: OrderListItem; shippedAt: string | null; clientPhone: string | null }[]
> {
  const orders = (await getAllOrders()).filter((o) =>
    o.type === "fabric_only" ? o.status === "fabric_shipped" : o.status === "shipped",
  );
  const supabase = await adminDb();
  if (!supabase || orders.length === 0) return [];

  const { data: history } = await supabase
    .from("order_status_history")
    .select("order_id, created_at")
    .in("status", ["shipped", "fabric_shipped"])
    .in("order_id", orders.map((o) => o.id));
  const shippedAt = new Map<string, string>();
  for (const h of (history ?? []) as { order_id: string; created_at: string }[]) {
    const prev = shippedAt.get(h.order_id);
    if (!prev || h.created_at > prev) shippedAt.set(h.order_id, h.created_at);
  }

  return orders
    .map((order) => ({
      order,
      shippedAt: shippedAt.get(order.id) ?? order.fabric_shipped_at ?? null,
      clientPhone: order.contact_phone ?? order.client?.phone ?? null,
    }))
    .sort((a, b) => {
      const da = a.order.receipt_disputed_at ? 0 : 1;
      const db = b.order.receipt_disputed_at ? 0 : 1;
      if (da !== db) return da - db;
      return (a.shippedAt ?? "").localeCompare(b.shippedAt ?? "");
    });
}

/**
 * Le tailleur a dit « J'ai reçu le tissu » sans que le vendeur ait déclaré
 * l'envoi : JALOFA appelle le vendeur, et ne le paie qu'après confirmation.
 * Les envois démentis restent listés, l'argent du tissu étant bloqué.
 */
export async function getVendorShipmentChecks(): Promise<
  { order: OrderListItem; vendorPhone: string | null }[]
> {
  const orders = (await getAllOrders()).filter(
    (o) => o.fabric_vendor_check === "pending" || o.fabric_vendor_check === "denied",
  );
  const supabase = await adminDb();
  if (!supabase || orders.length === 0) return orders.map((order) => ({ order, vendorPhone: null }));

  const ids = [...new Set(orders.map((o) => o.vendor_id).filter((id): id is string => !!id))];
  const { data } = await supabase.from("profiles").select("id, phone").in("id", ids);
  const phones = new Map(
    ((data ?? []) as { id: string; phone: string | null }[]).map((p) => [p.id, p.phone]),
  );
  return orders.map((order) => ({
    order,
    vendorPhone: order.vendor_id ? (phones.get(order.vendor_id) ?? null) : null,
  }));
}

/** Ce que JALOFA doit rendre aux clients : annulations et tissus retournés. */
/**
 * Ce qu'il reste à rembourser, commande par commande, d'après le registre :
 * la décision d'annulation (35 % de couture, trajets, retour déjà retenus),
 * sinon tout le payé (refus, annulation d'avant le workflow), sinon le tissu
 * rendu. Moins ce qui a déjà été remboursé (`order_ledger`, type `refund`).
 */
export async function getRefundsDue(): Promise<
  { order: OrderListItem; amount: number; reason: string; kept: number }[]
> {
  const [orders, ledger] = await Promise.all([getAllOrders(), getOrderLedger()]);
  const refunded = new Map<string, number>();
  for (const e of ledger) {
    if (e.entry_type === "refund") refunded.set(e.order_id, (refunded.get(e.order_id) ?? 0) + e.amount);
  }

  return orders.flatMap((order) => {
    if (order.payment_status !== "paid") return [];
    const paid = Number(order.amount_paid ?? order.total_amount);
    const decision = order.cancellation?.status === "accepted" ? order.cancellation : null;
    let due = 0;
    let reason = "";
    if (order.status === "cancelled") {
      due = decision?.refund_amount ?? paid;
      reason = decision ? "Annulation acceptée par JALOFA" : "Commande annulée";
    } else if (order.fabric_return?.status === "received") {
      due = order.fabric_price;
      reason = "Tissu retourné";
    }
    const left = Math.round(due - (refunded.get(order.id) ?? 0));
    return left > 0 ? [{ order, amount: left, reason, kept: Math.max(0, Math.round(paid - due)) }] : [];
  });
}

export type LedgerEntry = {
  order_id: string;
  entry_type: string;
  party: string;
  party_id: string | null;
  amount: number;
  created_at: string;
  external_ref: string | null;
};

/** Le registre financier de toutes les commandes (vide tant que la migration manque). */
export const getOrderLedger = cache(async (): Promise<LedgerEntry[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("order_ledger" as never)
    .select("order_id, entry_type, party, party_id, amount, created_at, external_ref")
    .order("created_at", { ascending: true });
  if (error) return [];
  return ((data ?? []) as unknown as LedgerEntry[]).map((e) => ({ ...e, amount: Number(e.amount) }));
});

export type CancellationRequestRow = {
  id: string;
  order_id: string;
  status: "pending" | "accepted" | "rejected";
  stage: string;
  reason: string | null;
  requested_at: string;
  decided_at: string | null;
  decision_reason: string | null;
  refund_amount: number | null;
  return_fee: number | null;
  order: OrderListItem | null;
};

/** Les demandes d'annulation : en cours d'abord, puis les 50 dernières décidées. */
export async function getCancellationRequests(): Promise<CancellationRequestRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await adminDb();
  if (!supabase) return [];
  const [{ data, error }, orders] = await Promise.all([
    supabase
      .from("order_cancellations" as never)
      .select("id, order_id, status, stage, reason, requested_at, decided_at, decision_reason, refund_amount, return_fee")
      .order("requested_at", { ascending: false })
      .limit(200),
    getAllOrders(),
  ]);
  if (error) return [];
  const byId = new Map(orders.map((o) => [o.id, o]));
  const rows = ((data ?? []) as unknown as Omit<CancellationRequestRow, "order">[]).map((r) => ({
    ...r,
    refund_amount: r.refund_amount == null ? null : Number(r.refund_amount),
    return_fee: r.return_fee == null ? null : Number(r.return_fee),
    order: byId.get(r.order_id) ?? null,
  }));
  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending").slice(0, 50);
  return [...pending, ...decided];
}

export const getAllOrders = cache(async (): Promise<OrderListItem[]> => {
  if (!isSupabaseConfigured()) return DEMO_ALL_ORDERS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  const orders = ((data as unknown as OrderListItem[]) ?? []).map(withPrivateContact);
  return withCancellations(supabase as unknown as Parameters<typeof withCancellations>[0], orders);
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

/** En démo, un e-mail lisible dérivé du nom (« bineta.gueye@exemple.sn »). */
function demoEmail(name: string | null): string {
  const base = (name ?? "compte")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // enlève les accents (Aïssatou → aissatou)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${base || "compte"}@exemple.sn`;
}

/**
 * id du compte → e-mail. L'e-mail vit dans `auth.users` (hors table `profiles`),
 * on le lit donc à part avec la clé de service. En démo, on en fabrique un
 * lisible depuis le nom pour que l'aperçu montre bien « e-mail + téléphone ».
 */
export const getUserEmails = cache(async (): Promise<Map<string, string>> => {
  const emails = new Map<string, string>();
  if (!isSupabaseConfigured()) {
    for (const u of DEMO_USERS) emails.set(u.id, demoEmail(u.full_name));
    return emails;
  }
  const supabase = await adminDb();
  if (!supabase) return emails;
  // `listUsers` pagine (50 comptes/page par défaut) : on ratisse page par page
  // jusqu'à épuisement pour n'oublier personne.
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error || !data) break;
    for (const u of data.users) if (u.email) emails.set(u.id, u.email);
    if (data.users.length < perPage) break;
  }
  return emails;
});

/** Un profil enrichi de son e-mail — de quoi savoir qui contacter. */
export type ProfileWithContact = Profile & { email: string | null };

/** Tous les comptes, chacun joint à son e-mail (`auth.users`). */
export const getAllUsersWithContact = cache(
  async (): Promise<ProfileWithContact[]> => {
    const [users, emails] = await Promise.all([getAllUsers(), getUserEmails()]);
    return users.map((u) => ({ ...u, email: emails.get(u.id) ?? null }));
  },
);

/**
 * Annuaire des comptes par id — nom, e-mail, téléphone — pour retrouver, à
 * partir d'un id (auteur d'un retour, propriétaire d'une boutique), la personne
 * exacte à contacter.
 */
export const getContactDirectory = cache(
  async (): Promise<Map<string, ProfileWithContact>> => {
    const users = await getAllUsersWithContact();
    return new Map(users.map((u) => [u.id, u]));
  },
);

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

/** Un modèle de tailleur masqué alors qu'il a déjà été commandé. */
export type HiddenOrderedModel = {
  model: GarmentModel;
  shopName: string | null;
  orders: number;
  /** Commandes pas encore livrées / refusées / annulées : le vrai risque. */
  ongoing: number;
};

/**
 * Garde-fou anti-arnaque : un modèle déjà commandé ne se supprime pas, il se
 * masque. L'administration surveille ces modèles masqués, ceux qui ont encore
 * des commandes en cours en tête (cf. `alertAdminsModelHidden`).
 */
export function hiddenOrderedModels(
  models: GarmentModel[],
  orders: OrderListItem[],
  tailors: Tailor[],
): HiddenOrderedModel[] {
  const shops = new Map(tailors.map((t) => [t.id, t.shop_name]));
  const result: HiddenOrderedModel[] = [];
  for (const model of models) {
    if (model.is_active || !model.tailor_id) continue;
    const mine = orders.filter((o) => o.model_id === model.id);
    if (mine.length === 0) continue;
    result.push({
      model,
      shopName: shops.get(model.tailor_id) ?? null,
      orders: mine.length,
      ongoing: mine.filter((o) => !isTerminal(o.status)).length,
    });
  }
  return result.sort((a, b) => b.ongoing - a.ongoing || b.orders - a.orders);
}

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

export const getAllVendorReviews = cache(async (): Promise<VendorReviewRow[]> => {
  if (!isSupabaseConfigured()) return DEMO_VENDOR_REVIEWS;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("fabric_reviews")
    .select(
      "*, client:profiles!fabric_reviews_client_id_fkey(full_name), vendor:vendors(shop_name)",
    )
    .order("created_at", { ascending: false });
  return (data as unknown as VendorReviewRow[]) ?? [];
});

// Publications « Inspiration » — vue d'administration : toutes, y compris celles
// qu'un auteur aurait masquées, d'où la clé de service (la RLS publique ne rend
// que les publications visibles). Le nom de l'auteur est dénormalisé sur la
// ligne, aucun join vers `profiles` n'est donc nécessaire.
type InspirationRow = InspirationPostView & {
  inspiration_photos?: { image_url: string; sort_order: number }[] | null;
};

export const getAllInspiration = cache(
  async (): Promise<InspirationPostView[]> => {
    if (!isSupabaseConfigured()) return getPublishedInspiration();
    const supabase = await adminDb();
    if (!supabase) return [];
    const { data } = await supabase
      .from("inspiration_posts")
      .select("*, inspiration_photos(image_url, sort_order)")
      .order("created_at", { ascending: false });
    return ((data as InspirationRow[]) ?? []).map((row) => ({
      ...row,
      photos: (row.inspiration_photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => p.image_url),
      fabric: null,
    }));
  },
);

// Retours des utilisateurs — ce que l'admin reçoit depuis les trois espaces.
// Comme le reste, lu avec la clé de service (aucune policy admin sur la table).
export const getAllFeedback = cache(async (): Promise<Feedback[]> => {
  if (!isSupabaseConfigured()) return DEMO_FEEDBACK;
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Feedback[]) ?? [];
});

/**
 * Tous les avis de la place — tailleurs ET vendeurs — normalisés et triés du
 * plus récent, pour que la modération se fasse en un seul endroit.
 */
export const getAdminReviews = cache(async (): Promise<AdminReviewRow[]> => {
  const [tailorReviews, vendorReviews] = await Promise.all([
    getAllReviews(),
    getAllVendorReviews(),
  ]);
  const rows: AdminReviewRow[] = [
    ...tailorReviews.map((r) => ({
      id: r.id,
      kind: "tailor" as const,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      clientName: r.client?.full_name ?? null,
      targetName: r.tailor?.shop_name ?? null,
    })),
    ...vendorReviews.map((r) => ({
      id: r.id,
      kind: "vendor" as const,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      clientName: r.client?.full_name ?? null,
      targetName: r.vendor?.shop_name ?? null,
    })),
  ];
  return rows.sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
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
    /** Total : commissions + abonnements. La livraison revient à celui qui livre. */
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
  const [users, orders, fabrics, models, tailors, vendors, subscriptions] = await Promise.all([
    getAllUsers(),
    getAllOrders(),
    getAllFabrics(),
    getAllModels(),
    getAllTailors(),
    getAllVendors(),
    readCollectedSubscriptions(),
  ]);

  const gmv = gmvOf(orders);

  // La part propre à JALOFA : les commissions ne pèsent que sur les pros au plan
  // Gratuit (`buildPayouts`), auxquelles s'ajoutent les abonnements (100% JALOFA).
  // Distinct du net reversé aux prestataires.
  const vendorTotals = sumPayouts(
    buildPayouts("vendor", orders, proDirectory(vendors)),
  );
  const tailorTotals = sumPayouts(
    buildPayouts("tailor", orders, proDirectory(tailors)),
  );
  const commission = vendorTotals.commission + tailorTotals.commission;

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
      total: commission + subscriptions,
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

/** Une réponse « La tenue vous va ? », avec de quoi la situer. */
export type SatisfactionRow = {
  id: string;
  created_at: string;
  verdict: "perfect" | "problem";
  issues: string[];
  comment: string | null;
  tailor_id: string | null;
  vendor_id: string | null;
  order: { id: string; order_number: string; model: { name: string } | null } | null;
  tailor: { shop_name: string } | null;
  vendor: { shop_name: string } | null;
};

/**
 * Toutes les réponses « Parfaite / Un problème » des clients, de la plus
 * récente. Sert à évaluer chaque tailleur et chaque vendeur.
 */
export async function getSatisfactionRows(): Promise<SatisfactionRow[]> {
  const supabase = await adminDb();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("order_satisfaction")
    .select(
      "id, created_at, verdict, issues, comment, tailor_id, vendor_id, order:orders(id, order_number, model:models(name)), tailor:tailors(shop_name), vendor:vendors(shop_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data as unknown as SatisfactionRow[]) ?? [];
}

export type CertificationRequestRow = {
  id: string;
  pro_id: string;
  kind: "tailor" | "vendor";
  legal_name: string;
  phone: string;
  address: string;
  company_name: string;
  ninea: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  /** Liens signés (1 h) vers les pièces du bucket privé `certification-docs`. */
  id_card_url: string | null;
  logo_url: string | null;
  trade_register_url: string | null;
};

/**
 * Toutes les demandes de certification, les plus récentes d'abord, avec des liens
 * signés vers les pièces (carte d'identité, logo, registre de commerce). Vide tant
 * que la migration 20260830000001 n'est pas appliquée.
 */
export const getAllCertificationRequests = cache(
  async (): Promise<CertificationRequestRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = await adminDb();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("certification_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data?.length) return [];
    type Raw = Omit<CertificationRequestRow, "id_card_url" | "logo_url" | "trade_register_url"> & {
      id_card_path: string;
      logo_path: string | null;
      trade_register_path: string | null;
    };
    const rows = data as unknown as Raw[];
    const paths = rows.flatMap((r) =>
      [r.id_card_path, r.logo_path, r.trade_register_path].filter((p): p is string => !!p),
    );
    const { data: signed } = await supabase.storage
      .from("certification-docs")
      .createSignedUrls(paths, 3600);
    const urlByPath = new Map(
      (signed ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl]] : [])),
    );
    return rows.map(({ id_card_path, logo_path, trade_register_path, ...r }) => ({
      ...r,
      id_card_url: urlByPath.get(id_card_path) ?? null,
      logo_url: logo_path ? (urlByPath.get(logo_path) ?? null) : null,
      trade_register_url: trade_register_path ? (urlByPath.get(trade_register_path) ?? null) : null,
    }));
  },
);

/** Le nombre de demandes de certification en attente (pastille du menu admin). */
export const getPendingCertificationCount = cache(async (): Promise<number> => {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await adminDb();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("certification_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return error ? 0 : (count ?? 0);
});

// ---------------------------------------------------------------------------
// Statistiques de visite (`page_views`, cf. migration 20260906000001)
// ---------------------------------------------------------------------------

export type SiteStatsPage = {
  path: string;
  views: number;
  visitors: number;
  /** Temps moyen passé sur la page (ms). */
  avg_ms: number;
  /** Nombre de visites qui se sont arrêtées sur cette page. */
  exits: number;
};

export type SiteStats = {
  visitors: number;
  sessions: number;
  views: number;
  /** Visites d'une seule page. */
  bounces: number;
  avg_session_ms: number;
  pages: SiteStatsPage[];
  daily: { day: string; visitors: number; views: number }[];
  devices: { label: string; visitors: number }[];
  countries: { label: string; visitors: number }[];
  sources: { label: string; visitors: number }[];
};

/**
 * Les chiffres de visite depuis `since`. `null` = migration pas encore
 * appliquée (ou clé de service absente) : la page le dit à l'admin.
 */
export async function getSiteStats(since: Date): Promise<SiteStats | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await adminDb();
  if (!supabase) return null;
  type Rpc = {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await (supabase as unknown as Rpc).rpc("site_stats", {
    since: since.toISOString(),
  });
  if (error || !data) return null;
  return data as SiteStats;
}
