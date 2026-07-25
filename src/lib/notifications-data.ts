import "server-only";

import { listDemoFabricSales } from "@/lib/notifications-demo";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";

/**
 * Les notifications de l'utilisateur connecté (refus de commande, etc.), de la
 * plus récente. Vide tant que Supabase n'est pas branché — la démo se concentre
 * sur l'espace pro. Les ventes de tissu ont leur propre panneau (voir
 * `getVendorFabricSales`) et ne sont pas reprises ici.
 */
export async function getMyNotifications(limit = 20): Promise<Notification[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .neq("type", "fabric_sale")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as Notification[]) ?? [];
}

/**
 * A « votre tissu a été acheté » notification, flattened for the vendor
 * dashboard: which cloth to cut, how much of it, and what the sale earned.
 *
 * Rows are raised by the `orders_notify_vendor_fabric_sale` trigger (see
 * supabase/migrations) and joined back to the order for the photo and price.
 */
export type FabricSale = {
  id: string;
  created_at: string;
  is_read: boolean;
  order_id: string | null;
  order_number: string | null;
  fabric_name: string;
  fabric_image: string | null;
  fabric_meters: number | null;
  /** The vendor's share of the order — confection and delivery excluded. */
  fabric_price: number;
  client_name: string | null;
};

const SALE_SELECT = `
  id, created_at, is_read, order_id,
  order:orders(
    order_number, fabric_meters, fabric_price,
    fabric:fabrics(name, image_url),
    client:profiles!orders_client_id_fkey(full_name)
  )
`;

type SaleRow = {
  id: string;
  created_at: string;
  is_read: boolean;
  order_id: string | null;
  order: {
    order_number: string;
    fabric_meters: number | null;
    fabric_price: number;
    fabric: { name: string; image_url: string | null } | null;
    client: { full_name: string | null } | null;
  } | null;
};

export async function getVendorFabricSales(): Promise<FabricSale[]> {
  if (!isSupabaseConfigured()) return listDemoFabricSales();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select(SALE_SELECT)
    .eq("user_id", user.id)
    .eq("type", "fabric_sale")
    .order("created_at", { ascending: false });

  return ((data as unknown as SaleRow[]) ?? []).map((n) => ({
    id: n.id,
    created_at: n.created_at,
    is_read: n.is_read,
    order_id: n.order_id,
    order_number: n.order?.order_number ?? null,
    fabric_name: n.order?.fabric?.name ?? "Tissu",
    fabric_image: n.order?.fabric?.image_url ?? null,
    fabric_meters: n.order?.fabric_meters ?? null,
    fabric_price: Number(n.order?.fabric_price ?? 0),
    client_name: n.order?.client?.full_name ?? null,
  }));
}
