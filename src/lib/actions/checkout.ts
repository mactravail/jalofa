"use server";

import { revalidatePath } from "next/cache";

import { getFabricById } from "@/lib/data";
import { recordDemoFabricSales, type DemoFabricSale } from "@/lib/notifications-demo";
import { resolveTailoringPrice } from "@/lib/order-pricing";
import { DELIVERY_FEE } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { OrderType, PaymentMethod } from "@/lib/constants";

// A single basket line handed over from the cart. `qty` bespoke garments are
// produced from it — each becomes its own order row (there is no qty column on
// `orders`, and every made-to-measure piece is sewn individually anyway).
export type CheckoutItem = {
  type: OrderType;
  model_id: string | null;
  style_slug: string | null;
  fabric_id: string | null;
  fabric_meters: number | null;
  tailor_id: string | null;
  measurement: {
    mode: "manual" | "standard";
    standard_size: string | null;
    values: Record<string, number | null>;
  } | null;
  notes: string | null;
  qty: number;
};

export type CheckoutPayload = {
  items: CheckoutItem[];
  delivery_method: "home" | "pickup";
  /** Ville de destination — collectée quel que soit le mode de livraison. */
  delivery_city: string | null;
  // Required whatever the delivery method — a pickup order still needs an
  // identified person to hand the piece to and a way to reach them.
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  address: {
    address_line: string;
    city: string;
    region: string | null;
  } | null;
  payment_method: PaymentMethod | null;
};

export type PlaceOrdersState =
  | { ok: true; demo: boolean; orderNumbers: string[] }
  | { ok: false; error: string }
  | null;

function demoOrderNumber(index: number): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const seq = String(index + 1).padStart(2, "0");
  return `CMD-${rand}${seq}`;
}

export async function placeOrders(
  _prev: PlaceOrdersState,
  formData: FormData,
): Promise<PlaceOrdersState> {
  let payload: CheckoutPayload;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { ok: false, error: "Données de commande invalides." };
  }

  if (!payload.items?.length) {
    return { ok: false, error: "Votre panier est vide." };
  }
  if (!payload.payment_method) {
    return { ok: false, error: "Choisissez un moyen de paiement." };
  }

  const contact = {
    first_name: payload.contact?.first_name?.trim() ?? "",
    last_name: payload.contact?.last_name?.trim() ?? "",
    email: payload.contact?.email?.trim() ?? "",
    phone: payload.contact?.phone?.trim() ?? "",
  };
  if (!(contact.first_name && contact.last_name && contact.email && contact.phone)) {
    return { ok: false, error: "Complétez vos coordonnées." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return { ok: false, error: "Adresse email invalide." };
  }

  const deliveryCity = payload.delivery_city?.trim() ?? "";
  if (!deliveryCity) {
    return { ok: false, error: "Indiquez la ville de livraison." };
  }

  if (
    payload.delivery_method === "home" &&
    !(payload.address?.address_line && payload.address?.city)
  ) {
    return { ok: false, error: "Complétez l'adresse de livraison." };
  }

  // --- Demo mode -----------------------------------------------------------
  // No database yet: simulate a successful checkout so the full flow can be
  // demonstrated on the local catalogue fixtures. Fabric sales still reach the
  // vendor dashboard, through the in-memory store instead of the DB trigger.
  if (!isSupabaseConfigured()) {
    const orderNumbers: string[] = [];
    const sales: DemoFabricSale[] = [];

    for (const item of payload.items) {
      const fabric =
        item.fabric_id && item.type !== "own_fabric"
          ? await getFabricById(item.fabric_id)
          : null;
      const meters = item.fabric_meters ?? 0;

      // One order per garment, hence one sale per garment — same granularity
      // as the rows the database path inserts.
      for (let u = 0; u < Math.max(1, item.qty); u++) {
        const orderNumber = demoOrderNumber(orderNumbers.length);
        orderNumbers.push(orderNumber);
        if (!fabric) continue;
        sales.push({
          order_id: null,
          order_number: orderNumber,
          fabric_name: fabric.name,
          fabric_image: fabric.image_url,
          fabric_meters: meters,
          fabric_price: fabric.price_per_meter * meters,
          client_name: `${contact.first_name} ${contact.last_name}`,
        });
      }
    }

    recordDemoFabricSales(sales);
    revalidatePath("/vendeur/espace", "layout");
    return { ok: true, demo: true, orderNumbers };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Vous devez être connecté pour commander." };
  }

  // Livraison offerte : gratuite si tout le panier vient de tailleurs qui la
  // prennent à leur charge. Une ligne « tissu seul » n'a pas de tailleur, sa
  // présence conserve donc les frais. Les lignes `tailors` font foi ici, quel
  // que soit l'instantané côté client.
  let deliveryFee = payload.delivery_method === "home" ? DELIVERY_FEE : 0;
  if (deliveryFee > 0) {
    const madeItems = payload.items.filter((it) => it.type !== "fabric_only");
    const tailorIds = madeItems
      .map((it) => it.tailor_id)
      .filter((id): id is string => Boolean(id));
    const allItemsHaveTailor =
      madeItems.length === payload.items.length &&
      tailorIds.length === madeItems.length &&
      tailorIds.length > 0;
    if (allItemsHaveTailor) {
      const { data: tailorRows } = await supabase
        .from("tailors")
        .select("id, free_delivery")
        .in("id", [...new Set(tailorIds)]);
      const freeById = new Map(
        (tailorRows ?? []).map((t) => [t.id as string, Boolean(t.free_delivery)]),
      );
      if (madeItems.every((it) => freeById.get(it.tailor_id as string) === true)) {
        deliveryFee = 0;
      }
    }
  }

  // One shared address row for the whole basket.
  let addressId: string | null = null;
  if (payload.address && payload.delivery_method === "home") {
    const { data: address, error: aErr } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        recipient_name: `${contact.first_name} ${contact.last_name}`,
        phone: contact.phone,
        address_line: payload.address.address_line,
        city: payload.address.city,
        region: payload.address.region,
      })
      .select("id")
      .single();
    if (aErr) return { ok: false, error: aErr.message };
    addressId = address.id as string;
  }

  const orderNumbers: string[] = [];
  let firstOrder = true;

  for (const item of payload.items) {
    // Recompute prices from authoritative DB rows. The fabric also carries the
    // vendor the order belongs to — without it the sale would reach neither
    // their board nor their notifications.
    let fabricPrice = 0;
    let vendorId: string | null = null;
    if (item.fabric_id && item.type !== "own_fabric") {
      const { data: fabric } = await supabase
        .from("fabrics")
        .select("price_per_meter, vendor_id")
        .eq("id", item.fabric_id)
        .single();
      fabricPrice = Number(fabric?.price_per_meter ?? 0) * (item.fabric_meters ?? 0);
      vendorId = (fabric?.vendor_id as string | null) ?? null;
    }

    let tailoringPrice = 0;
    if (item.tailor_id && item.type !== "fabric_only") {
      tailoringPrice = await resolveTailoringPrice(
        supabase,
        item.model_id,
        item.tailor_id,
      );
    }

    const qty = Math.max(1, item.qty);
    for (let u = 0; u < qty; u++) {
      // One measurement row per garment.
      let measurementId: string | null = null;
      if (item.measurement && item.type !== "fabric_only") {
        const m = item.measurement;
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

      // Delivery is a basket-level fee — bill it once, on the first garment.
      const lineDelivery = firstOrder ? deliveryFee : 0;
      const total = fabricPrice + tailoringPrice + lineDelivery;

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          client_id: user.id,
          tailor_id: item.type !== "fabric_only" ? item.tailor_id : null,
          vendor_id: vendorId,
          type: item.type,
          model_id: item.type !== "fabric_only" ? item.model_id : null,
          style_slug: item.type !== "fabric_only" ? item.style_slug : null,
          fabric_id: item.type !== "own_fabric" ? item.fabric_id : null,
          fabric_meters: item.fabric_meters,
          measurement_id: measurementId,
          address_id: addressId,
          delivery_method: payload.delivery_method,
          delivery_city: deliveryCity,
          contact_first_name: contact.first_name,
          contact_last_name: contact.last_name,
          contact_email: contact.email,
          contact_phone: contact.phone,
          fabric_price: fabricPrice,
          tailoring_price: tailoringPrice,
          delivery_fee: lineDelivery,
          total_amount: total,
          payment_method: payload.payment_method,
          payment_status: "paid", // Payment gateway integration is stubbed for the MVP.
          notes: item.notes,
        })
        .select("order_number")
        .single();

      if (error) return { ok: false, error: error.message };
      orderNumbers.push(String(order.order_number));
      firstOrder = false;
    }
  }

  revalidatePath("/compte/commandes");
  revalidatePath("/vendeur/espace", "layout");
  return { ok: true, demo: false, orderNumbers };
}
