"use server";

import { revalidatePath } from "next/cache";

import { createCheckoutCharge, isBictorysConfigured } from "@/lib/bictorys";
import { getFabricById } from "@/lib/data";
import { quoteLines, type DeliveryLine } from "@/lib/delivery-fees";
import type { DeliveryOption } from "@/lib/order-workflow";
import { parseFabricColors } from "@/lib/fabric-colors";
import { isFabricOnSale } from "@/lib/fabric-metrage";
import {
  fabricLinePrice,
  fabricMinQty,
  fabricStock,
  fabricUnit,
  formatUnits,
  unitsToMeters,
} from "@/lib/fabric-specs";
import { recordDemoFabricSales, type DemoFabricSale } from "@/lib/notifications-demo";
import { saveOrderContact } from "@/lib/order-contact";
import { resolveTailoringPrice } from "@/lib/order-pricing";
import { FABRIC_FREE_DELIVERY_MIN } from "@/lib/pricing";
import { stripContactInfo } from "@/lib/privacy";
import { renewProFromSale, siteOrigin } from "@/lib/pro-subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/queries";
import { ensureClientAccount } from "@/lib/supabase/guest";
import { createClient } from "@/lib/supabase/server";
import { writeSavedContact } from "@/lib/saved-profile-db";
import { MEASUREMENT_FIELDS, type OrderType, type PaymentMethod } from "@/lib/constants";
import { demoFabricError, findUnapprovedSeller, isDemoFabric } from "@/lib/sales-approval";
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
  /** Couleur choisie (tissu seul) — vérifiée contre les couleurs du vendeur. */
  fabric_color?: string | null;
  /** Couleur du prêt-à-porter — son prix propre est relu sur le modèle. */
  ready_color?: string | null;
  tailor_id: string | null;
  measurement: {
    mode: "manual" | "standard";
    standard_size: string | null;
    /** Photo de silhouette en data URL JPEG, avec une taille standard. */
    photo?: string | null;
    values: Record<string, number | null>;
  } | null;
  notes: string | null;
  qty: number;
};

/** Seules les colonnes de mesures connues passent : le navigateur n'écrit rien d'autre. */
function measurementValues(values: Record<string, number | null>) {
  return Object.fromEntries(
    MEASUREMENT_FIELDS.flatMap(({ key }) => {
      const v = values?.[key];
      return typeof v === "number" && Number.isFinite(v) ? [[key, v]] : [];
    }),
  );
}

/** Au-delà, ce n'est pas une photo compressée par le configurateur. */
const MAX_BODY_PHOTO_BYTES = 2 * 1024 * 1024;

/**
 * Range la photo de silhouette dans le bucket privé, sous l'uid du client.
 * Facultative : un échec (bucket absent, format refusé) ne bloque jamais la
 * commande, l'habit se fait alors sur la seule taille standard.
 */
async function storeBodyPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dataUrl: string | null | undefined,
): Promise<string | null> {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
  if (!match) return null;
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length === 0 || bytes.length > MAX_BODY_PHOTO_BYTES) return null;
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("body-photos")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  return error ? null : path;
}

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
  /** Choisi sur la page Bictorys (renseigné au webhook) ; null à la caisse. */
  payment_method?: PaymentMethod | null;
  /** A (économique) ou B (express), cahier des charges §3. */
  delivery_option?: DeliveryOption | null;
  /** « Enregistrer mon téléphone et mon adresse pour mes prochaines commandes ». */
  save_profile?: boolean;
};

/** Ce que coûte la livraison d'un panier dans chaque option, aux tarifs des pros. */
export type BasketDeliveryQuote = Record<
  DeliveryOption,
  { total: number; unknown: boolean } | null
>;

/**
 * Les frais de livraison du panier, affichés AVANT le paiement (§3.8). Mêmes
 * calculs que `placeOrders` (`quoteLines`) : ce qui est montré est ce qui sera payé.
 */
export async function quoteBasketDelivery(
  lines: (DeliveryLine & { qty: number })[],
  /** Total des tissus seuls, pour l'ESTIMATION de la livraison offerte ; le
   *  montant facturé, lui, est recalculé depuis la base dans `placeOrders`. */
  fabricTotal = 0,
): Promise<BasketDeliveryQuote> {
  const none: BasketDeliveryQuote = { economy: { total: 0, unknown: true }, express: null };
  if (!isSupabaseConfigured() || !Array.isArray(lines) || lines.length === 0) return none;
  const safe = lines.slice(0, MAX_ITEMS).map((l) => ({
    type: l.type,
    fabric_id: typeof l.fabric_id === "string" ? l.fabric_id : null,
    tailor_id: typeof l.tailor_id === "string" ? l.tailor_id : null,
    qty: safeQty(l.qty),
  }));
  const supabase = await createClient();
  const quotes = await quoteLines(supabase, safe);
  const fabricFree = Number(fabricTotal) >= FABRIC_FREE_DELIVERY_MIN;
  const sum = (option: DeliveryOption) => {
    let total = 0;
    let unknown = false;
    for (const [i, q] of quotes.entries()) {
      const freeFabricLine = fabricFree && safe[i].type === "fabric_only";
      if (freeFabricLine) continue;
      const fees = q[option];
      if (!fees) return null;
      total += (fees.fabric + fees.garment) * safe[i].qty;
      unknown ||= fees.unknown;
    }
    return { total, unknown };
  };
  return { economy: sum("economy"), express: sum("express") };
}

export type PlaceOrdersState =
  | {
      ok: true;
      demo: boolean;
      orderNumbers: string[];
      /** Bictorys : la page où le client paie. Les commandes attendent le webhook. */
      redirectUrl?: string;
    }
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
  if (formData.get("accept_terms") !== "1") {
    return { ok: false, error: "Acceptez les conditions pour payer" };
  }
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
          fabric_price:
            item.type === "fabric_only"
              ? fabricLinePrice(fabric, meters)
              : fabric.price_per_meter * meters,
        });
      }
    }

    recordDemoFabricSales(sales);
    revalidatePath("/admin/boutique", "layout");
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
    const demo = ((basketFabrics ?? []) as Fabric[]).find((f) => isDemoFabric(f));
    if (demo) return { ok: false, error: demoFabricError(demo.name) };
    const soldOut = ((basketFabrics ?? []) as Fabric[]).find((f) => !isFabricOnSale(f));
    if (soldOut) {
      return {
        ok: false,
        error: `Le tissu « ${soldOut.name} » est épuisé. Retirez-le de votre panier.`,
      };
    }
    // Le panier ne peut pas demander plus que le stock du vendeur.
    for (const f of (basketFabrics ?? []) as Fabric[]) {
      const stock = fabricStock(f);
      if (stock == null) continue;
      const wantedMeters = payload.items
        .filter((it) => it.fabric_id === f.id && it.type !== "own_fabric")
        .reduce((sum, it) => sum + (it.fabric_meters ?? 0) * Math.max(1, it.qty), 0);
      if (wantedMeters / fabricUnit(f).meters > stock + 0.01) {
        return {
          ok: false,
          error: `Il ne reste que ${formatUnits(f, stock)} du tissu « ${f.name} ». Réduisez la quantité.`,
        };
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
        country: payload.address.country?.trim() || "Sénégal",
      })
      .select("id")
      .single();
    if (aErr) return { ok: false, error: aErr.message };
    addressId = address.id as string;
  }

  const orderNumbers: string[] = [];
  /** Les pros payés par ce panier — pour renouveler leur offre Pro échue. */
  const soldBy: (string | null)[] = [];

  // --- Option de livraison et tarifs des pros (§3) --------------------------
  const option: DeliveryOption = payload.delivery_option === "express" ? "express" : "economy";
  const deliveryQuotes = await quoteLines(
    supabase,
    payload.items.map((it) => ({ type: it.type, fabric_id: it.fabric_id, tailor_id: it.tailor_id })),
  );
  if (option === "express" && deliveryQuotes.some((q) => !q.express)) {
    return {
      ok: false,
      error: "Un des pros de votre panier ne propose pas l'express. Choisissez la livraison économique.",
    };
  }

  // Prix recalculés depuis la base, AVANT d'ouvrir le paiement : le montant
  // encaissé est la somme exacte des commandes créées.
  const priced: {
    item: CheckoutItem;
    fabricPrice: number;
    vendorId: string | null;
    tailoringPrice: number;
    fabricFee: number;
    garmentFee: number;
  }[] = [];
  for (const [index, item] of payload.items.entries()) {
    // The fabric also carries the vendor the order belongs to — without it the
    // sale would reach neither their board nor their notifications.
    let fabricPrice = 0;
    let vendorId: string | null = null;
    if (item.fabric_id && item.type !== "own_fabric") {
      const { data } = await supabase
        .from("fabrics")
        .select("*")
        .eq("id", item.fabric_id)
        .single();
      const fabric = data as Fabric | null;
      // Seule une couleur réellement proposée par le vendeur est gardée : c'est
      // elle qui fixe le prix quand il diffère.
      item.fabric_color =
        fabric && typeof item.fabric_color === "string" &&
        parseFabricColors(fabric.color).includes(item.fabric_color)
          ? item.fabric_color
          : null;
      if (item.fabric_color) {
        const line = `Couleur : ${item.fabric_color}`;
        item.notes = item.notes ? `${line}\n${item.notes}` : line;
      }
      // Tissu seul vendu au yard / pagne / complet : N × prix de l’unité, exact.
      fabricPrice = !fabric
        ? 0
        : item.type === "fabric_only"
          ? fabricLinePrice(fabric, item.fabric_meters ?? 0, item.fabric_color)
          : Math.round(Number(fabric.price_per_meter ?? 0) * (item.fabric_meters ?? 0));
      // Quantité minimum du vendeur (tissu acheté seul).
      if (
        fabric &&
        item.type === "fabric_only" &&
        (item.fabric_meters ?? 0) + 0.01 < unitsToMeters(fabric, fabricMinQty(fabric))
      ) {
        return {
          ok: false,
          error: `Le tissu « ${fabric.name} » se vend à partir de ${formatUnits(fabric, fabricMinQty(fabric))}.`,
        };
      }
      vendorId = fabric?.vendor_id ?? null;
    }

    // Prêt-à-porter : la couleur payée est toujours écrite pour le tailleur.
    item.ready_color =
      !item.fabric_id && typeof item.ready_color === "string" && item.ready_color.trim()
        ? item.ready_color.trim().slice(0, 40)
        : null;
    if (item.ready_color && !item.notes?.includes(`Couleur : ${item.ready_color}`)) {
      const line = `Couleur : ${item.ready_color}`;
      item.notes = item.notes ? `${line}
${item.notes}` : line;
    }

    let tailoringPrice = 0;
    if (item.tailor_id && item.type !== "fabric_only") {
      tailoringPrice = await resolveTailoringPrice(
        supabase,
        item.model_id,
        item.tailor_id,
        item.ready_color,
      );
    }
    const fees = deliveryQuotes[index][option] ?? { fabric: 0, garment: 0 };
    priced.push({
      item,
      fabricPrice,
      vendorId,
      tailoringPrice,
      fabricFee: fees.fabric,
      garmentFee: fees.garment,
    });
  }

  // Tissus JALOFA : livraison offerte dès 100 000 FCFA de tissus achetés seuls,
  // calculé sur les prix relus en base (jamais sur ceux du navigateur).
  const fabricOnlyTotal = priced.reduce(
    (sum, p) => (p.item.type === "fabric_only" ? sum + p.fabricPrice * Math.max(1, p.item.qty) : sum),
    0,
  );
  if (fabricOnlyTotal >= FABRIC_FREE_DELIVERY_MIN) {
    for (const p of priced) if (p.item.type === "fabric_only") p.fabricFee = 0;
  }

  // Anti-arnaque : un pro dont JALOFA n'a pas encore validé les ventes ne peut
  // rien encaisser (aussi bloqué en base par orders_guard_sellers_approved).
  const unapproved = await findUnapprovedSeller(supabase, {
    tailorIds: priced.map((p) => (p.item.type !== "fabric_only" ? p.item.tailor_id : null)),
    vendorIds: priced.map((p) => p.vendorId),
  });
  if (unapproved) return { ok: false, error: unapproved };

  const basketTotal = priced.reduce(
    (sum, p) =>
      sum + (p.fabricPrice + p.tailoringPrice + p.fabricFee + p.garmentFee) * Math.max(1, p.item.qty),
    0,
  );

  // Un seul paiement pour tout le panier. La clé vient du formulaire : un double
  // envoi retrouve le même paiement, et les commandes déjà créées (§12).
  const checkoutKey = String(formData.get("checkout_key") ?? "");
  if (!/^[\w-]{8,80}$/.test(checkoutKey)) {
    return { ok: false, error: "Rechargez la page puis réessayez." };
  }
  // Bictorys configuré : paiement réel, les commandes attendent le webhook.
  // Sinon : paiement `manual` (stub), payé tout de suite comme avant.
  const viaBictorys = isBictorysConfigured();
  if (viaBictorys && basketTotal < 100) {
    return { ok: false, error: "Montant minimum : 100 FCFA." };
  }
  const { data: paymentId, error: payErr } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: string | null; error: { message: string } | null }>;
  }).rpc("open_payment", {
    p_amount: basketTotal,
    p_idempotency_key: checkoutKey,
    p_provider: viaBictorys ? "bictorys" : "manual",
  });
  if (payErr || !paymentId) {
    return { ok: false, error: "Le paiement n'a pas pu être ouvert. Réessayez." };
  }
  const { data: already } = await supabase
    .from("orders")
    .select("order_number")
    .eq("payment_id" as never, paymentId);
  if (already && already.length > 0) {
    // Double envoi : mêmes commandes, même page de paiement.
    const { data: pay } = await supabase
      .from("payments" as never)
      .select("checkout_url, status")
      .eq("id", paymentId)
      .maybeSingle();
    const p = pay as { checkout_url: string | null; status: string } | null;
    return {
      ok: true,
      demo: false,
      orderNumbers: (already as { order_number: string }[]).map((o) => o.order_number),
      ...(viaBictorys && p?.status === "pending" && p.checkout_url ? { redirectUrl: p.checkout_url } : {}),
    };
  }

  for (const { item, fabricPrice, vendorId, tailoringPrice, fabricFee, garmentFee } of priced) {

    // Une seule photo par ligne, partagée par chaque exemplaire.
    const bodyPhotoPath =
      item.measurement?.mode === "standard" && item.type !== "fabric_only"
        ? await storeBodyPhoto(supabase, user.id, item.measurement.photo)
        : null;

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
            // Colonne ajoutée par 20260816000001 : absente du payload sans photo,
            // pour qu'une base pas encore migrée accepte la commande.
            ...(bodyPhotoPath ? { photo_path: bodyPhotoPath } : {}),
            ...measurementValues(m.values),
          })
          .select("id")
          .single();
        if (mErr) return { ok: false, error: mErr.message };
        measurementId = measurement.id as string;
      }

      // Livraison au tarif du pro pour l'option choisie (aller du tissu, vêtement).
      // Tarif non renseigné en économique : à régler au livreur, comme avant.
      const total = fabricPrice + tailoringPrice + fabricFee + garmentFee;

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
          delivery_fee: garmentFee,
          total_amount: total,
          payment_method: null,
          // Bictorys : la commande naît « en attente » ; `confirm_payment`
          // (webhook vérifié) la passera « payée » et la base posera `paid_at`.
          // Stub `manual` (Bictorys non configuré) : payée tout de suite.
          payment_status: viaBictorys ? "pending" : "paid",
          ...({
            payment_id: paymentId,
            delivery_option: option,
            fabric_delivery_fee: fabricFee,
          } as Record<string, unknown>),
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
      soldBy.push(item.type !== "fabric_only" ? item.tailor_id : null, vendorId);
    }
  }

  // Téléphone et adresse gardés pour la prochaine fois, si le client l'a
  // demandé. Un échec ici ne doit jamais faire échouer la commande.
  if (payload.save_profile === true) {
    try {
      await writeSavedContact(supabase, user.id, {
        phone: contact.phone,
        address:
          payload.address && payload.delivery_method === "home"
            ? {
                address_line: payload.address.address_line,
                city: payload.address.city,
                region: payload.address.region,
                country: payload.address.country?.trim() || "Sénégal",
              }
            : null,
      });
    } catch {
      // Sans effet sur la commande.
    }
  }

  // Le compte vient peut-être de naître : l'en-tête (« Mon compte ») change.
  revalidatePath("/", "layout");

  if (viaBictorys) {
    // La page de paiement Bictorys. Le renouvellement d'offre Pro se fera au
    // paiement confirmé (`settleBictorysEvent`).
    try {
      const origin = await siteOrigin();
      const charge = await createCheckoutCharge({
        amount: basketTotal,
        paymentReference: paymentId,
        customer: {
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          phone: contact.phone,
        },
        successUrl: `${origin}/paiement/retour?p=${paymentId}`,
        errorUrl: `${origin}/paiement/retour?p=${paymentId}&e=1`,
      });
      await createAdminClient()
        .from("payments" as never)
        .update({ checkout_url: charge.link, provider_charge_id: charge.chargeId } as never)
        .eq("id", paymentId);
      return { ok: true, demo: false, orderNumbers, redirectUrl: charge.link };
    } catch (e) {
      // Pas de page de paiement : les commandes ne doivent pas rester ouvertes.
      try {
        await (createAdminClient() as unknown as {
          rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown>;
        }).rpc("fail_payment", { p_payment_id: paymentId, p_provider_status: "charge_creation_failed" });
      } catch {
        // Clé de service absente : les commandes restent « en attente de paiement ».
      }
      return { ok: false, error: e instanceof Error ? e.message : "Le paiement n'a pas pu être ouvert." };
    }
  }

  // Offre Pro échue : la vente rouvre un mois, retenu sur le reversement.
  await renewProFromSale(soldBy);
  return { ok: true, demo: false, orderNumbers };
}
