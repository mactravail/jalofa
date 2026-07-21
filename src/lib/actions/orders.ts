"use server";

import { revalidatePath } from "next/cache";

import { DELIVERY_FEE } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, OrderType, PaymentMethod } from "@/lib/constants";

export type OrderDraft = {
  type: OrderType;
  model_id: string | null;
  style_slug: string | null;
  fabric_id: string | null;
  fabric_meters: number | null;
  tailor_id: string | null;
  delivery_method: "home" | "pickup";
  payment_method: PaymentMethod | null;
  measurement: {
    mode: "manual" | "standard";
    standard_size: string | null;
    values: Record<string, number | null>;
  } | null;
  address: {
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    region: string | null;
  } | null;
  notes: string | null;
};

export type CreateOrderState =
  | { ok: true; orderId: string }
  | { ok: false; error: string }
  | null;

export async function createOrder(
  _prev: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "La base de données n'est pas encore connectée. La commande sera possible une fois Supabase configuré.",
    };
  }

  let draft: OrderDraft;
  try {
    draft = JSON.parse(String(formData.get("draft") ?? "{}"));
  } catch {
    return { ok: false, error: "Données de commande invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Vous devez être connecté pour commander." };
  }

  // Recompute prices from authoritative DB rows.
  let fabricPrice = 0;
  if (draft.fabric_id && draft.type !== "own_fabric") {
    const { data: fabric } = await supabase
      .from("fabrics")
      .select("price_per_meter")
      .eq("id", draft.fabric_id)
      .single();
    const meters = draft.fabric_meters ?? 0;
    fabricPrice = Number(fabric?.price_per_meter ?? 0) * meters;
  }

  let tailoringPrice = 0;
  let tailorFreeDelivery = false;
  if (draft.tailor_id && draft.type !== "fabric_only") {
    const { data: tailor } = await supabase
      .from("tailors")
      .select("base_price, free_delivery")
      .eq("id", draft.tailor_id)
      .single();
    tailoringPrice = Number(tailor?.base_price ?? 0);
    tailorFreeDelivery = Boolean(tailor?.free_delivery);
  }

  // Livraison offerte par le tailleur : la livraison à domicile n'est pas
  // facturée au client.
  const deliveryFee =
    draft.delivery_method === "home" && !tailorFreeDelivery ? DELIVERY_FEE : 0;
  const total = fabricPrice + tailoringPrice + deliveryFee;

  // Optional measurement.
  let measurementId: string | null = null;
  if (draft.measurement && draft.type !== "fabric_only") {
    const m = draft.measurement;
    const { data: measurement, error: mErr } = await supabase
      .from("measurements")
      .insert({
        user_id: user.id,
        mode: m.mode,
        standard_size: m.mode === "standard" ? m.standard_size : null,
        ...m.values,
      })
      .select("id")
      .single();
    if (mErr) return { ok: false, error: mErr.message };
    measurementId = measurement.id as string;
  }

  // Optional address.
  let addressId: string | null = null;
  if (draft.address && draft.delivery_method === "home") {
    const { data: address, error: aErr } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        recipient_name: draft.address.recipient_name,
        phone: draft.address.phone,
        address_line: draft.address.address_line,
        city: draft.address.city,
        region: draft.address.region,
      })
      .select("id")
      .single();
    if (aErr) return { ok: false, error: aErr.message };
    addressId = address.id as string;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      client_id: user.id,
      tailor_id: draft.type !== "fabric_only" ? draft.tailor_id : null,
      type: draft.type,
      model_id: draft.type !== "fabric_only" ? draft.model_id : null,
      style_slug: draft.type !== "fabric_only" ? draft.style_slug : null,
      fabric_id: draft.type !== "own_fabric" ? draft.fabric_id : null,
      fabric_meters: draft.fabric_meters,
      measurement_id: measurementId,
      address_id: addressId,
      delivery_method: draft.delivery_method,
      delivery_city: draft.address?.city ?? null,
      fabric_price: fabricPrice,
      tailoring_price: tailoringPrice,
      delivery_fee: deliveryFee,
      total_amount: total,
      payment_method: draft.payment_method,
      payment_status: "paid", // Payment gateway integration is stubbed for the MVP.
      notes: draft.notes,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/compte/commandes");
  return { ok: true, orderId: order.id as string };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath(`/tailleur/espace`, "layout");
  revalidatePath(`/vendeur/espace`, "layout");
  revalidatePath(`/compte/commandes/${orderId}`);
}
