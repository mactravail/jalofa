"use server";

import { revalidatePath } from "next/cache";

import { getFabricById } from "@/lib/data";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import { recordDemoFabricSales, type DemoFabricSale } from "@/lib/notifications-demo";
import { saveOrderContact } from "@/lib/order-contact";
import { resolveTailoringPrice } from "@/lib/order-pricing";
import { stripContactInfo } from "@/lib/privacy";
import { isSupabaseConfigured } from "@/lib/queries";
import { ensureClientAccount } from "@/lib/supabase/guest";
import { createClient } from "@/lib/supabase/server";
import type { OrderType, PaymentMethod } from "@/lib/constants";
import type { Fabric } from "@/lib/types";

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
    country?: string | null;
  } | null;
  payment_method: PaymentMethod | null;
};

export type PlaceOrdersState =
  | { ok: true; demo: boolean; orderNumbers: string[] }
  | { ok: false; error: string }
  | null;

/**
 * Bornes du panier. Le contenu arrive en JSON depuis le navigateur : c'est une
 * donnée d'entrée comme une autre, et rien n'oblige à ce qu'elle vienne de notre
 * page « Panier ».
 *
 * - `MAX_ITEMS` / `MAX_QTY` : sans plafond, une seule requête pouvait demander la
 *   création de dizaines de milliers de commandes (une ligne `orders` et une
 *   ligne `measurements` par vêtement) et saturer la base.
 * - `MAX_METERS` : le métrage multiplie le prix du tissu. Une valeur négative
 *   rendait le prix négatif — donc un total réduit, voire nul, sur le reste du
 *   panier. Le métrage est désormais toujours un nombre fini, positif et plafonné.
 */
const MAX_ITEMS = 20;
const MAX_QTY = 10;
const MAX_METERS = 100;

/** Quantité demandée pour une ligne, ramenée dans les bornes. */
function safeQty(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QTY);
}

/** Métrage de tissu, ramené dans les bornes (jamais négatif). */
function safeMeters(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, MAX_METERS);
}

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

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { ok: false, error: "Votre panier est vide." };
  }
  if (payload.items.length > MAX_ITEMS) {
    return {
      ok: false,
      error: `Votre panier dépasse ${MAX_ITEMS} lignes. Passez plusieurs commandes.`,
    };
  }

  // Métrage et quantité refaits ici, une fois pour toutes : le reste de l'action
  // (prix du tissu, boucle de création) travaille sur des valeurs déjà bornées.
  payload.items = payload.items.map((item) => ({
    ...item,
    fabric_meters: safeMeters(item.fabric_meters),
    qty: safeQty(item.qty),
  }));
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

  // Une tenue est livrée par le tailleur : l'adresse du client est obligatoire.
  if (
    payload.delivery_method === "pickup" &&
    payload.items.some((it) => it.type !== "fabric_only")
  ) {
    return { ok: false, error: "Indiquez votre adresse pour la livraison de votre tenue." };
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
        });
      }
    }

    recordDemoFabricSales(sales);
    revalidatePath("/vendeur/espace", "layout");
    return { ok: true, demo: true, orderNumbers };
  }

  // Pas d'inscription séparée : sans session, le compte client est créé ici,
  // avec les coordonnées de la commande et le mot de passe choisi à la caisse.
  const supabase = await createClient();
  const account = await ensureClientAccount(supabase, {
    email: contact.email,
    password: String(formData.get("password") ?? ""),
    fullName: `${contact.first_name} ${contact.last_name}`,
    phone: contact.phone,
  });
  if (!account.ok) {
    return { ok: false, error: account.error };
  }
  const { user } = account;

  // Un tissu a pu être déclaré épuisé depuis l'ajout au panier : on refuse avant
  // d'écrire quoi que ce soit.
  const basketFabricIds = payload.items
    .filter((it) => it.fabric_id && it.type !== "own_fabric")
    .map((it) => it.fabric_id as string);
  if (basketFabricIds.length > 0) {
    const { data: basketFabrics } = await supabase
      .from("fabrics")
      .select("*")
      .in("id", basketFabricIds);
    const soldOut = ((basketFabrics ?? []) as Fabric[]).find((f) => !isFabricAvailable(f));
    if (soldOut) {
      return {
        ok: false,
        error: `Le tissu « ${soldOut.name} » est épuisé. Retirez-le de votre panier.`,
      };
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
        country: payload.address.country?.trim() || "Sénégal",
      })
      .select("id")
      .single();
    if (aErr) return { ok: false, error: aErr.message };
    addressId = address.id as string;
  }

  const orderNumbers: string[] = [];

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

      // JALOFA n'ajoute aucun frais de livraison à un achat direct : chaque pro a dit
      // sur son produit si elle est gratuite ; sinon le client paie le GP ou le livreur.
      const total = fabricPrice + tailoringPrice;

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
          delivery_address: payload.address?.address_line ?? null,
          delivery_country: payload.address ? payload.address.country?.trim() || "Sénégal" : null,
          fabric_price: fabricPrice,
          tailoring_price: tailoringPrice,
          delivery_fee: 0,
          total_amount: total,
          payment_method: payload.payment_method,
          payment_status: "paid", // Payment gateway integration is stubbed for the MVP.
          notes: item.notes ? stripContactInfo(item.notes) : item.notes,
        })
        .select("id, order_number")
        .single();

      if (error) return { ok: false, error: error.message };

      const saved = await saveOrderContact(supabase, order.id as string, {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
      });
      if (!saved) {
        return { ok: false, error: "Votre commande n'a pas pu être enregistrée. Réessayez." };
      }

      orderNumbers.push(String(order.order_number));
    }
  }

  // Le compte vient peut-être de naître : l'en-tête (« Mon compte ») change.
  revalidatePath("/", "layout");
  return { ok: true, demo: false, orderNumbers };
}
