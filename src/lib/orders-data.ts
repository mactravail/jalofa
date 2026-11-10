import "server-only";

import type { AlterationReason } from "@/lib/after-sale";
import type { FreeDeliveryZone } from "@/lib/delivery";
import type { ProRole } from "@/lib/dashboard-nav";
import { DEMO_TAILOR_ORDERS, DEMO_VENDOR_ORDERS } from "@/lib/orders-demo";
import { contactRevealed, deliversToClient } from "@/lib/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import type { Measurement, Order, OrderStatusHistory } from "@/lib/types";

/**
 * Les mesures telles qu'affichées sur la fiche d'une commande : le mode
 * (taille standard ou relevé manuel), la taille standard et tous les champs en
 * centimètres. C'est ce que le tailleur lit pour couper et coudre.
 */
export type OrderMeasurement = Pick<
  Measurement,
  | "mode"
  | "standard_size"
  | "height"
  | "chest"
  | "waist"
  | "hips"
  | "shoulders"
  | "arm_length"
  | "leg_length"
  | "neck"
  | "wrist"
  | "notes"
  | "label"
>;

export type OrderRelations = {
  /** `delivery_zone` : ce que le pro a choisi pour la livraison de ce modèle. */
  model?: { name: string; image_url?: string | null; delivery_zone?: FreeDeliveryZone } | null;
  fabric?: {
    name: string;
    image_url: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
  tailor?: {
    shop_name: string | null;
    /** Où envoyer le tissu — lisible seulement par le tailleur et le vendeur
     *  d'une commande payée (RLS de `tailor_ateliers`). */
    atelier?: { address: string; phone: string } | null;
  } | null;
  /** La boutique de tissu créditée — l'admin lit qui fournit le tissu. */
  vendor?: { shop_name: string | null } | null;
  style?: { name: string } | null;
  client?: { full_name: string | null; phone: string | null } | null;
  /** Le nom, le téléphone et l'e-mail — le pro ne les lit qu'après le paiement
   *  (RLS de `order_contacts`). */
  private_contact?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  /** Le carnet d'adresses du client (nom et téléphone compris) : à lui seul. */
  address?: { address_line: string; city: string; region: string | null } | null;
  /** Le relevé de mesures rattaché à la commande, pour la fiche du pro. */
  measurement?: OrderMeasurement | null;
  /** Photo de silhouette jointe à une taille standard : lien signé (1 h), pour
   *  le tailleur d'une commande payée seulement. */
  body_photo_url?: string | null;
  /** Le retour du tissu, si le client a demandé à le rendre. */
  fabric_return?: { status: "requested" | "received" } | null;
  /** Les retouches demandées sur ce vêtement. */
  alterations?: {
    id: string;
    reason: AlterationReason;
    note: string | null;
    status: "requested" | "done";
    created_at: string;
  }[] | null;
  /** La réponse du client à « La tenue vous va ? », s'il a répondu. */
  satisfaction?: OrderSatisfaction | null;
};

export type OrderSatisfaction = {
  verdict: "perfect" | "problem";
  issues: string[];
  comment: string | null;
  created_at: string;
};

export type OrderListItem = Order & OrderRelations;

export type OrderDetail = OrderListItem & {
  history: OrderStatusHistory[];
  client?: { full_name: string | null; phone: string | null } | null;
};

const RELATIONS =
  "*, model:models(name, image_url), fabric:fabrics(name, image_url), tailor:tailors(shop_name), style:styles(name)";

// Colonnes du relevé de mesures reprises sur la fiche de commande du pro.
const MEASUREMENT_COLS =
  "mode, standard_size, height, chest, waist, hips, shoulders, arm_length, leg_length, neck, wrist, notes, label";

/**
 * Ce que voit le pro sur chaque commande : en plus du catalogue, le tissu
 * détaillé (couleur, matière) et surtout le relevé de mesures. Une nouvelle
 * commande doit se lire d'un coup d'œil, sans autre requête. Le client n'y est
 * qu'un code (`order_number`) et une adresse de livraison, jusqu'à ce qu'il paie
 * (`private_contact`, filtré par la RLS).
 */
const PRO_RELATIONS =
  `*, model:models(name, delivery_zone), fabric:fabrics(name, image_url, color, material), tailor:tailors(shop_name, atelier:tailor_ateliers(address, phone)), vendor:vendors(shop_name), style:styles(name), private_contact:order_contacts(first_name, last_name, email, phone), fabric_return:fabric_returns(status), alterations:order_alterations(id, reason, note, status, created_at), measurement:measurements(${MEASUREMENT_COLS})`;

export async function getMyOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(RELATIONS)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (data as unknown as OrderListItem[]) ?? [];
}

/**
 * Ce que le pro reçoit du client. Pendant le devis : le code et l'adresse de
 * livraison, sinon il pourrait joindre le client et la commande sortirait de
 * JALOFA. Une fois payé : aussi le nom, le téléphone et l'e-mail, pour livrer. La
 * base le garantit déjà (`order_contacts` + RLS) ; ce filtre ne laisse rien partir
 * vers son navigateur, et couvre les données de démo.
 */
function forPro(role: ProRole, order: OrderListItem): OrderListItem {
  const revealed = contactRevealed(role, order);
  const contact = order.private_contact;
  // Le vendeur d'une commande complète envoie à l'atelier : pas d'adresse client.
  const delivers = deliversToClient(role, order.type);
  return {
    ...order,
    private_contact: null,
    contact_first_name: revealed ? (contact?.first_name ?? order.contact_first_name) : null,
    contact_last_name: revealed ? (contact?.last_name ?? order.contact_last_name) : null,
    contact_email: revealed ? (contact?.email ?? order.contact_email) : null,
    contact_phone: revealed ? (contact?.phone ?? order.contact_phone) : null,
    delivery_address: delivers ? order.delivery_address : null,
    delivery_country: delivers ? order.delivery_country : null,
    client: null,
    address: null,
  };
}

/** Joint la photo de silhouette du client (lien signé) aux commandes payées. */
async function withBodyPhotos(orders: OrderListItem[]): Promise<OrderListItem[]> {
  // Avant le paiement, le pro ne connaît que le code et l'adresse : une photo
  // peut montrer un visage, elle attend donc le paiement.
  const ids = orders
    .filter((o) => o.payment_status === "paid" && o.measurement_id && o.type !== "fabric_only")
    .map((o) => o.measurement_id as string);
  if (ids.length === 0) return orders;
  try {
    const admin = createAdminClient();
    // Lu à part du select principal : sur une base pas encore migrée, la colonne
    // manque (42703) et seule la photo disparaît, pas la liste des commandes.
    const { data, error } = await admin
      .from("measurements")
      .select("id, photo_path")
      .in("id", ids)
      .not("photo_path", "is", null);
    if (error || !data?.length) return orders;
    const rows = data as { id: string; photo_path: string }[];
    const { data: signed } = await admin.storage.from("body-photos").createSignedUrls(
      rows.map((r) => r.photo_path),
      3600,
    );
    const urlByPath = new Map(
      (signed ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl]] : [])),
    );
    const urlByMeasurement = new Map(
      rows.flatMap((r) => {
        const url = urlByPath.get(r.photo_path);
        return url ? [[r.id, url]] : [];
      }),
    );
    return orders.map((o) => ({
      ...o,
      body_photo_url: o.measurement_id ? (urlByMeasurement.get(o.measurement_id) ?? null) : null,
    }));
  } catch {
    // Clé de service absente : la fiche s'affiche sans la photo.
    return orders;
  }
}

/**
 * Joint à chaque commande livrée la réponse « La tenue vous va ? » du client.
 * Requête à part et tolérante : si la table manque encore en prod, l'espace pro
 * s'affiche quand même, simplement sans ces retours.
 */
async function withSatisfaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orders: OrderListItem[],
): Promise<OrderListItem[]> {
  const ids = orders.filter((o) => o.status === "delivered").map((o) => o.id);
  if (ids.length === 0) return orders;
  const { data, error } = await supabase
    .from("order_satisfaction" as "orders")
    .select("order_id, verdict, issues, comment, created_at")
    .in("order_id", ids);
  if (error || !data) return orders;
  const byOrder = new Map(
    (data as unknown as (OrderSatisfaction & { order_id: string })[]).map((r) => [r.order_id, r]),
  );
  return orders.map((o) => {
    const row = byOrder.get(o.id);
    if (!row) return o;
    const { verdict, issues, comment, created_at } = row;
    return {
      ...o,
      satisfaction: { verdict, issues: issues ?? [], comment, created_at },
    };
  });
}

export async function getTailorOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return DEMO_TAILOR_ORDERS.map((o) => forPro("tailor", o));
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(PRO_RELATIONS)
    .eq("tailor_id", user.id)
    .order("created_at", { ascending: false });

  const orders = await withBodyPhotos(
    await withSatisfaction(supabase, (data as unknown as OrderListItem[]) ?? []),
  );
  return orders.map((o) => forPro("tailor", o));
}

export async function getVendorOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return DEMO_VENDOR_ORDERS.map((o) => forPro("vendor", o));
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(PRO_RELATIONS)
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  // Deux cas ne concernent pas le vendeur : le tissu du tailleur lui-même (rien
  // à envoyer, la commande vit dans l'espace tailleur) et le devis pas encore
  // payé (le tissu ne part qu'une fois le client ayant payé).
  const orders = await withSatisfaction(supabase, (data as unknown as OrderListItem[]) ?? []);
  return orders
    .filter(
      (o) =>
        o.tailor_id !== user.id && !(o.is_quote && o.payment_status === "pending"),
    )
    .map((o) => forPro("vendor", o));
}

/**
 * Où le client renvoie son tissu. L'adresse du vendeur reste privée : elle n'est
 * lue, côté serveur, que pour le client de cette commande, une fois le retour
 * demandé.
 */
export async function getFabricReturnAddress(
  order: Pick<Order, "client_id" | "vendor_id">,
): Promise<{ address: string; phone: string } | null> {
  const user = await getAuthUser();
  if (!order.vendor_id || !user || user.id !== order.client_id) return null;
  try {
    const { data } = await createAdminClient()
      .from("vendor_addresses")
      .select("address, phone")
      .eq("vendor_id", order.vendor_id)
      .maybeSingle();
    return (data as { address: string; phone: string } | null) ?? null;
  } catch {
    return null;
  }
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(PRO_RELATIONS)
    .eq("id", id)
    .single();

  if (!order) return null;

  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  return {
    ...(order as unknown as OrderDetail),
    history: (history as unknown as OrderStatusHistory[]) ?? [],
  };
}

/**
 * Le client a-t-il déjà noté cette commande ? Une note par commande, pour le
 * tailleur (`reviews`) comme pour le tissu (`fabric_reviews`). Une table absente
 * (migration pas encore passée) compte comme « pas encore noté ».
 */
export async function getOrderReviewState(
  orderId: string,
): Promise<{ tailor: boolean; fabric: boolean }> {
  if (!isSupabaseConfigured()) return { tailor: false, fabric: false };
  const supabase = await createClient();
  const [tailor, fabric] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("order_id", orderId),
    supabase
      .from("fabric_reviews")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId),
  ]);
  return {
    tailor: !tailor.error && (tailor.count ?? 0) > 0,
    fabric: !fabric.error && (fabric.count ?? 0) > 0,
  };
}

/** La réponse « La tenue vous va ? » du client, s'il a déjà répondu. */
export async function getOrderSatisfaction(orderId: string): Promise<{
  verdict: "perfect" | "problem";
  issues: string[];
  comment: string | null;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_satisfaction" as "orders")
    .select("verdict, issues, comment")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as {
    verdict: "perfect" | "problem";
    issues: string[];
    comment: string | null;
  };
}
