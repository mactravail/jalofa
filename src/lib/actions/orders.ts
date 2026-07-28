"use server";

import { revalidatePath } from "next/cache";

import { resolveTailoringPrice } from "@/lib/order-pricing";
import { isTerminal, timelineFor } from "@/lib/pipeline";
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

// ---------------------------------------------------------------------------
// Devis à la personnalisation
//
// Nouveau modèle de prix JALOFA : chaque modèle affiche un prix « à partir de ».
// Pris tel quel (taille seulement), le client paie ce prix. Mais dès qu'il
// PERSONNALISE la tenue (style, finitions, tissu, mesures), le prix final dépend
// de la demande : il envoie donc une DEMANDE DE DEVIS depuis le configurateur.
// Elle tombe dans « À traiter » du tailleur, sans prix ni paiement (`is_quote`),
// il la chiffre (`quoteOrder`), puis le client accepte et paie (`acceptQuote`).
//
// Réutilise toute la mécanique de devis existante — seul le point d'entrée
// change : une tenue configurée plutôt qu'une simple taille.
// ---------------------------------------------------------------------------

export type GarmentQuoteState =
  | { ok: true; orderId: string | null; demo: boolean }
  | { ok: false; error: string };

export type GarmentQuoteInput = {
  type: OrderType;
  modelId: string | null;
  styleSlug: string | null;
  fabricId: string | null;
  fabricMeters: number | null;
  tailorId: string | null;
  measurement: {
    mode: "manual" | "standard";
    standard_size: string | null;
    values: Record<string, number | null>;
  } | null;
  city: string | null;
  notes: string | null;
};

export async function requestGarmentQuote(
  input: GarmentQuoteInput,
): Promise<GarmentQuoteState> {
  // Mode démo (base non branchée) : le configurateur reste jouable de bout en
  // bout — on simule l'envoi sans écrire, comme le fait déjà la caisse.
  if (!isSupabaseConfigured()) {
    return { ok: true, orderId: null, demo: true };
  }

  if (!input.tailorId) {
    return { ok: false, error: "Choisissez un tailleur pour votre devis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Connectez-vous pour demander un devis." };
  }

  // Le tailleur doit être une boutique ouverte (active, validée, non suspendue) —
  // même garde que le catalogue public. Plus aucune condition d'abonnement : le
  // devis à la personnalisation est ouvert à tous les tailleurs.
  const { data: tailor } = await supabase
    .from("tailors")
    .select("id, is_active, is_activated, is_suspended")
    .eq("id", input.tailorId)
    .single();
  if (
    !tailor ||
    !tailor.is_active ||
    !tailor.is_activated ||
    tailor.is_suspended
  ) {
    return { ok: false, error: "Ce tailleur n'est pas disponible." };
  }

  // Prix du tissu, recalculé depuis la base (le tailleur chiffrera la confection).
  let fabricPrice = 0;
  if (input.fabricId && input.type !== "own_fabric") {
    const { data: fabric } = await supabase
      .from("fabrics")
      .select("price_per_meter")
      .eq("id", input.fabricId)
      .single();
    fabricPrice = Number(fabric?.price_per_meter ?? 0) * (input.fabricMeters ?? 0);
  }

  // Coordonnées reprises du profil (le devis n'a pas d'écran de caisse).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();
  const fullName = (profile as { full_name: string | null } | null)?.full_name ?? "";
  const [firstName, ...rest] = fullName.split(" ");
  const phone = (profile as { phone: string | null } | null)?.phone ?? null;

  let measurementId: string | null = null;
  if (input.measurement) {
    const m = input.measurement;
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

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      client_id: user.id,
      tailor_id: input.tailorId,
      type: input.type,
      model_id: input.modelId,
      style_slug: input.styleSlug,
      fabric_id: input.type !== "own_fabric" ? input.fabricId : null,
      fabric_meters: input.type !== "own_fabric" ? input.fabricMeters : null,
      measurement_id: measurementId,
      delivery_method: "home",
      delivery_city: input.city?.trim() || null,
      contact_first_name: firstName || null,
      contact_last_name: rest.join(" ") || null,
      contact_email: user.email ?? null,
      contact_phone: phone,
      is_quote: true,
      fabric_price: fabricPrice,
      tailoring_price: 0,
      delivery_fee: 0,
      total_amount: fabricPrice,
      payment_status: "pending",
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  return { ok: true, orderId: order.id as string, demo: false };
}

export type QuoteOrderState = { ok: true } | { ok: false; error: string };

/**
 * Le tailleur chiffre une demande de devis : il fixe le prix de confection. La
 * commande reste « reçue » et impayée — la balle passe au client, qui accepte
 * et paie (`acceptQuote`). Autorisé au seul tailleur assigné, sur un devis pas
 * encore chiffré.
 */
export async function quoteOrder(
  orderId: string,
  price: number,
): Promise<QuoteOrderState> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const amount = Math.round(Number(price));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Indiquez un prix valide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: order } = await supabase
    .from("orders")
    .select("tailor_id, status, is_quote, payment_status, fabric_price, delivery_fee")
    .eq("id", orderId)
    .single();
  const o = order as
    | {
        tailor_id: string | null;
        status: OrderStatus;
        is_quote: boolean;
        payment_status: string;
        fabric_price: number;
        delivery_fee: number;
      }
    | null;
  if (!o) return { ok: false, error: "Commande introuvable." };
  if (o.tailor_id !== user.id) return { ok: false, error: "Cette commande n'est pas la vôtre." };
  if (!o.is_quote || o.status !== "received" || o.payment_status !== "pending") {
    return { ok: false, error: "Ce devis ne peut plus être chiffré." };
  }

  const total = amount + Number(o.fabric_price ?? 0) + Number(o.delivery_fee ?? 0);
  const { error } = await supabase
    .from("orders")
    .update({ tailoring_price: amount, total_amount: total })
    .eq("id", orderId)
    .eq("tailor_id", user.id)
    .eq("status", "received")
    .eq("payment_status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath(`/compte/commandes/${orderId}`);
  return { ok: true };
}

export type AcceptQuoteState = { ok: true } | { ok: false; error: string };

/**
 * Le client accepte le prix proposé et paie : le devis devient une commande
 * ferme (`accepted`, payée), qui entre dans le pipeline normal. Autorisé au
 * seul client propriétaire, sur un devis déjà chiffré et encore impayé.
 */
export async function acceptQuote(
  orderId: string,
  paymentMethod: PaymentMethod,
): Promise<AcceptQuoteState> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: order } = await supabase
    .from("orders")
    .select("client_id, is_quote, payment_status, tailoring_price")
    .eq("id", orderId)
    .single();
  const o = order as
    | {
        client_id: string;
        is_quote: boolean;
        payment_status: string;
        tailoring_price: number;
      }
    | null;
  if (!o) return { ok: false, error: "Commande introuvable." };
  if (o.client_id !== user.id) return { ok: false, error: "Cette commande n'est pas la vôtre." };
  if (!o.is_quote || o.payment_status !== "pending" || Number(o.tailoring_price ?? 0) <= 0) {
    return { ok: false, error: "Ce devis n'est pas prêt à être payé." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: paymentMethod,
      status: "accepted" as OrderStatus,
    })
    .eq("id", orderId)
    .eq("client_id", user.id)
    .eq("payment_status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  return { ok: true };
}

/**
 * La commande telle qu'elle fait foi pour décider d'un avancement, avec le
 * contrôle « c'est bien un prestataire de cette commande » déjà fait.
 *
 * Ces actions sont des points d'entrée HTTP : le bouton n'existe que dans
 * l'espace pro, mais l'appel, lui, est à la portée de n'importe qui. La policy
 * `orders_update_party` laisse passer les TROIS parties (client compris) sur
 * n'importe quelle colonne — sans ce contrôle, un client pouvait déclarer sa
 * propre commande « livrée » et gonfler d'autant le score de confiance du
 * tailleur (`completed_orders`, `on_time_orders`).
 */
async function proOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data } = await supabase
    .from("orders")
    .select("tailor_id, vendor_id, status, type")
    .eq("id", orderId)
    .single();
  const order = data as {
    tailor_id: string | null;
    vendor_id: string | null;
    status: OrderStatus;
    type: OrderType;
  } | null;
  if (!order) throw new Error("Commande introuvable.");

  const isTailor = order.tailor_id === user.id;
  const isVendor = order.vendor_id === user.id;
  if (!isTailor && !isVendor) {
    throw new Error("Cette commande ne vous est pas confiée.");
  }
  if (isTerminal(order.status)) {
    throw new Error("Cette commande est clôturée.");
  }

  return { supabase, user, order, isTailor };
}

/**
 * Le prestataire fait avancer la commande.
 *
 * L'avancement ne va que vers l'avant, le long du pipeline du type de commande
 * (cf. `timelineFor`). On ne se limite pas à l'étape immédiatement suivante :
 * l'espace pro propose volontairement des raccourcis (« J'ai reçu le tissu »,
 * « Marquer prêt & livré ») qui sautent plusieurs étapes. En revanche on ne
 * revient jamais en arrière — sans quoi un pro pourrait rejouer indéfiniment le
 * passage à « livrée » et recompter la commande dans ses statistiques.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { supabase, order } = await proOrder(orderId);

  const timeline = timelineFor(order.type);
  const from = timeline.indexOf(order.status);
  const to = timeline.indexOf(status);
  if (to < 0) {
    throw new Error("Cette étape n'existe pas pour ce type de commande.");
  }
  if (to <= from) {
    throw new Error("Une commande ne peut pas revenir en arrière.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("status", order.status);
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
  const { supabase, order } = await proOrder(orderId);

  // On ne refuse qu'une commande qu'on n'a pas encore prise en main : une fois le
  // travail engagé, le geste est l'annulation, pas le refus.
  if (order.status !== "received" && order.status !== "accepted") {
    throw new Error("Cette commande est déjà engagée et ne peut plus être refusée.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "rejected" as OrderStatus, rejection_reason: reason })
    .eq("id", orderId)
    .eq("status", order.status);
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
