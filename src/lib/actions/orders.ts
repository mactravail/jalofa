"use server";

import { revalidatePath } from "next/cache";

import { resolveTailoringPrice } from "@/lib/order-pricing";
import { DELIVERY_FEE } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  OrderStatus,
  OrderType,
  PaymentMethod,
  RejectionReason,
} from "@/lib/constants";

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
  let vendorFreeDelivery = false;
  if (draft.fabric_id && draft.type !== "own_fabric") {
    const { data: fabric } = await supabase
      .from("fabrics")
      .select("price_per_meter, vendor_id")
      .eq("id", draft.fabric_id)
      .single();
    const meters = draft.fabric_meters ?? 0;
    fabricPrice = Number(fabric?.price_per_meter ?? 0) * meters;
    // Pour un tissu seul, c'est le vendeur qui livre : son offre de livraison
    // fait foi.
    if (draft.type === "fabric_only" && fabric?.vendor_id) {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("free_delivery")
        .eq("id", fabric.vendor_id)
        .single();
      vendorFreeDelivery = Boolean(vendor?.free_delivery);
    }
  }

  let tailoringPrice = 0;
  let tailorFreeDelivery = false;
  if (draft.tailor_id && draft.type !== "fabric_only") {
    tailoringPrice = await resolveTailoringPrice(
      supabase,
      draft.model_id,
      draft.tailor_id,
    );
    const { data: tailor } = await supabase
      .from("tailors")
      .select("free_delivery")
      .eq("id", draft.tailor_id)
      .single();
    tailorFreeDelivery = Boolean(tailor?.free_delivery);
  }

  // Livraison offerte par le prestataire qui livre — le vendeur pour un tissu
  // seul, sinon le tailleur : la livraison à domicile n'est pas facturée.
  const freeDelivery =
    draft.type === "fabric_only" ? vendorFreeDelivery : tailorFreeDelivery;
  const deliveryFee =
    draft.delivery_method === "home" && !freeDelivery ? DELIVERY_FEE : 0;
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

/**
 * Le tailleur refuse une commande qu'il ne peut pas honorer, EN DONNANT un
 * motif. Le statut passe à `rejected` et le motif est enregistré : un trigger
 * `security definer` en prévient aussitôt le client (cf. la migration), qui
 * pourra relancer chez un autre tailleur. L'administration, elle, retrouve le
 * refus sur sa page dédiée.
 */
export async function rejectOrder(orderId: string, reason: RejectionReason) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "rejected" as OrderStatus, rejection_reason: reason })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath(`/tailleur/espace`, "layout");
  revalidatePath(`/vendeur/espace`, "layout");
  revalidatePath(`/admin/refus`);
  revalidatePath(`/compte/commandes/${orderId}`);
}

export type ReassignState = { ok: true } | { ok: false; error: string };

/**
 * Le client relance une commande refusée chez un autre tailleur. Autorisé
 * UNIQUEMENT tant que la commande est au statut `rejected` : une fois qu'un
 * tailleur a accepté, le client ne peut plus changer d'atelier. Le prix de
 * confection est recalculé pour le nouveau tailleur, le statut repart à
 * `received` (la commande retombe dans son « À traiter ») et le motif de refus
 * est effacé.
 */
export async function reassignTailor(
  orderId: string,
  newTailorId: string,
): Promise<ReassignState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Base de données non connectée." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: order } = await supabase
    .from("orders")
    .select("client_id, status, model_id, fabric_price, delivery_fee")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Commande introuvable." };
  if (order.client_id !== user.id) {
    return { ok: false, error: "Cette commande n'est pas la vôtre." };
  }
  if (order.status !== "rejected") {
    return {
      ok: false,
      error:
        "Vous ne pouvez changer de tailleur que sur une commande refusée.",
    };
  }

  // Le nouveau tailleur doit être une boutique ouverte (active, validée, non
  // suspendue) — même garde que le catalogue public.
  const { data: tailor } = await supabase
    .from("tailors")
    .select("id, is_active, is_activated, is_suspended")
    .eq("id", newTailorId)
    .single();
  if (!tailor || !tailor.is_active || !tailor.is_activated || tailor.is_suspended) {
    return { ok: false, error: "Ce tailleur n'est pas disponible." };
  }

  const tailoringPrice = await resolveTailoringPrice(
    supabase,
    order.model_id as string | null,
    newTailorId,
  );
  const total =
    Number(order.fabric_price ?? 0) +
    tailoringPrice +
    Number(order.delivery_fee ?? 0);

  const { error } = await supabase
    .from("orders")
    .update({
      tailor_id: newTailorId,
      tailoring_price: tailoringPrice,
      total_amount: total,
      status: "received" as OrderStatus,
      rejection_reason: null,
    })
    .eq("id", orderId)
    .eq("client_id", user.id)
    .eq("status", "rejected"); // garde-fou concurrentiel : jamais après acceptation
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/admin/refus");
  return { ok: true };
}
