import "server-only";

import { DEMO_TAILOR_ORDERS, DEMO_VENDOR_ORDERS } from "@/lib/orders-demo";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
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
  model?: { name: string } | null;
  fabric?: {
    name: string;
    image_url: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
  tailor?: { shop_name: string | null } | null;
  /** La boutique de tissu créditée — l'admin lit qui fournit le tissu. */
  vendor?: { shop_name: string | null } | null;
  style?: { name: string } | null;
  client?: { full_name: string | null; phone: string | null } | null;
  /** Le relevé de mesures rattaché à la commande, pour la fiche du pro. */
  measurement?: OrderMeasurement | null;
};

export type OrderListItem = Order & OrderRelations;

export type OrderDetail = OrderListItem & {
  history: OrderStatusHistory[];
  client?: { full_name: string | null; phone: string | null } | null;
  address?: Record<string, unknown> | null;
};

const RELATIONS =
  "*, model:models(name), fabric:fabrics(name, image_url), tailor:tailors(shop_name), style:styles(name)";

// Colonnes du relevé de mesures reprises sur la fiche de commande du pro.
const MEASUREMENT_COLS =
  "mode, standard_size, height, chest, waist, hips, shoulders, arm_length, leg_length, neck, wrist, notes, label";

/**
 * Ce que voit le pro sur chaque commande : en plus du catalogue, le tissu
 * détaillé (couleur, matière), le client et surtout le relevé de mesures. Une
 * nouvelle commande doit se lire d'un coup d'œil, sans autre requête.
 */
const PRO_RELATIONS =
  `*, model:models(name), fabric:fabrics(name, image_url, color, material), tailor:tailors(shop_name), style:styles(name), client:profiles!orders_client_id_fkey(full_name, phone), measurement:measurements(${MEASUREMENT_COLS})`;

export async function getMyOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(RELATIONS)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (data as unknown as OrderListItem[]) ?? [];
}

export async function getTailorOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return DEMO_TAILOR_ORDERS;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(PRO_RELATIONS)
    .eq("tailor_id", user.id)
    .order("created_at", { ascending: false });

  return (data as unknown as OrderListItem[]) ?? [];
}

export async function getVendorOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return DEMO_VENDOR_ORDERS;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(PRO_RELATIONS)
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  return (data as unknown as OrderListItem[]) ?? [];
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`${PRO_RELATIONS}, address:addresses(*)`)
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
