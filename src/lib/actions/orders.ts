"use server";

import { revalidatePath } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { isFabricAvailable, isFabricOnSale } from "@/lib/fabric-metrage";
import { quoteLines } from "@/lib/delivery-fees";
import { withCancellations } from "@/lib/order-cancellations";
import { saveOrderContact } from "@/lib/order-contact";
import {
  CUT_BLOCK_LABELS,
  SHIP_BLOCK_LABELS,
  cuttingStatus,
  shippingStatus,
  toWorkflowOrder,
  type DeliveryOption,
} from "@/lib/order-workflow";
import { resolveTailoringPrice } from "@/lib/order-pricing";
import { isTerminal, pipelineType, timelineFor } from "@/lib/pipeline";
import { stripContactInfo } from "@/lib/privacy";
import { renewProFromSale, siteOrigin } from "@/lib/pro-subscription";
import { createCheckoutCharge, isBictorysConfigured } from "@/lib/bictorys";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureClientAccount } from "@/lib/supabase/guest";
import type { OrderContact } from "@/lib/order-contact";
import { createClient } from "@/lib/supabase/server";
import type {
  OrderStatus,
  OrderType,
  RejectionReason,
} from "@/lib/constants";
import { modelAutoQuote } from "@/lib/auto-quote";
import { demoFabricError, findUnapprovedSeller, isDemoFabric } from "@/lib/sales-approval";
import { styleExtraTotal } from "@/lib/style-options";
import type { Fabric, GarmentModel, Order } from "@/lib/types";

// Nouveau modèle de prix JALOFA : chaque modèle affiche un prix « à partir de ».
// Pris tel quel (taille seulement), le client paie ce prix. Mais dès qu'il
// PERSONNALISE la tenue (style, finitions, tissu, mesures), le prix final dépend
// de la demande : il envoie donc une DEMANDE DE DEVIS depuis le configurateur.
// Elle tombe dans « À traiter » du tailleur, sans prix ni paiement (`is_quote`),
// il la chiffre (`quoteOrder`), puis le client accepte et paie (`acceptQuote`).
//
// Réutilise toute la mécanique de devis existante — seul le point d'entrée
// change : une tenue configurée plutôt qu'une simple taille.

export type GarmentQuoteState =
  | {
      ok: true;
      orderId: string | null;
      demo: boolean;
      /** Le modèle est en devis automatique : le prix est déjà là. */
      autoQuoted?: boolean;
    }
  | { ok: false; error: string };

export type GarmentQuoteInput = {
  type: OrderType;
  modelId: string | null;
  styleSlug: string | null;
  fabricId: string | null;
  fabricMeters: number | null;
  tailorId: string | null;
  /** Les choix de personnalisation (groupe → option), pour les suppléments
   *  d'un devis automatique. */
  styleDetails?: Record<string, string>;
  measurement: {
    mode: "manual" | "standard";
    standard_size: string | null;
    values: Record<string, number | null>;
  } | null;
  /** Où livrer : le tailleur la voit pour chiffrer la livraison de son devis. */
  delivery: { address: string; city: string; country: string };
  notes: string | null;
  /** Broderie « Je choisis » : la photo de la broderie voulue (data URL JPEG). */
  embroideryPhoto?: string | null;
  /** Coordonnées saisies au récap — prioritaires sur le profil. Sans compte,
   *  `email` + `password` créent le compte client avec le devis. */
  contact?: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    /** Conditions acceptées : obligatoire dès qu'un mot de passe est fourni. */
    acceptTerms?: boolean;
  } | null;
};

/** L'adresse de livraison saisie, sans espaces inutiles ; null si incomplète. */
function cleanDelivery(delivery: { address: string; city: string; country: string } | undefined) {
  const address = delivery?.address?.trim() ?? "";
  const city = delivery?.city?.trim() ?? "";
  if (!address || !city) return null;
  return { address, city, country: delivery?.country?.trim() || "Sénégal" };
}

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

  const contactName = input.contact?.name?.trim() ?? "";
  const contactPhone = input.contact?.phone?.trim() ?? "";

  if (input.contact?.password && !input.contact.acceptTerms) {
    return { ok: false, error: "Vous devez accepter les conditions d'utilisation." };
  }

  // Le tailleur en a besoin pour chiffrer la livraison de son devis.
  const delivery = cleanDelivery(input.delivery);
  if (!delivery) {
    return { ok: false, error: "Indiquez votre adresse de livraison et votre ville." };
  }

  // Pas d'inscription séparée : sans session, le compte client est créé ici,
  // avec les coordonnées et le mot de passe saisis au récap.
  const supabase = await createClient();
  const account = await ensureClientAccount(
    supabase,
    input.contact
      ? {
          email: input.contact.email ?? "",
          password: input.contact.password ?? "",
          fullName: contactName,
          phone: contactPhone,
        }
      : null,
  );
  if (!account.ok) {
    return { ok: false, error: account.error };
  }
  const { user } = account;

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
  // Le vendeur est rattaché dès la demande : au paiement du devis, il devra
  // envoyer le tissu à l'atelier (il ne voit pas la commande avant).
  let fabricPrice = 0;
  let fabricVendorId: string | null = null;
  if (input.fabricId && input.type !== "own_fabric") {
    const { data } = await supabase
      .from("fabrics")
      .select("*")
      .eq("id", input.fabricId)
      .single();
    const fabric = data as Fabric | null;
    if (fabric && isDemoFabric(fabric)) return { ok: false, error: demoFabricError(fabric.name) };
    if (fabric && !isFabricOnSale(fabric)) {
      return { ok: false, error: `Le tissu « ${fabric.name} » est épuisé. Choisissez-en un autre.` };
    }
    fabricPrice = Number(fabric?.price_per_meter ?? 0) * (input.fabricMeters ?? 0);
    fabricVendorId = fabric?.vendor_id ?? null;
  }

  // Anti-arnaque : pas de devis vers un pro dont JALOFA n'a pas validé les ventes.
  const unapproved = await findUnapprovedSeller(supabase, {
    tailorIds: [input.tailorId],
    vendorIds: [fabricVendorId],
  });
  if (unapproved) return { ok: false, error: unapproved };

  // Coordonnées reprises du profil (le devis n'a pas d'écran de caisse).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();
  const fullName =
    contactName || ((profile as { full_name: string | null } | null)?.full_name ?? "");
  const [firstName, ...rest] = fullName.split(" ");
  const phone =
    contactPhone || ((profile as { phone: string | null } | null)?.phone ?? null);

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
      vendor_id: fabricVendorId,
      type: input.type,
      model_id: input.modelId,
      style_slug: input.styleSlug,
      fabric_id: input.type !== "own_fabric" ? input.fabricId : null,
      fabric_meters: input.type !== "own_fabric" ? input.fabricMeters : null,
      measurement_id: measurementId,
      delivery_method: "home",
      delivery_address: delivery.address,
      delivery_city: delivery.city,
      delivery_country: delivery.country,
      is_quote: true,
      fabric_price: fabricPrice,
      tailoring_price: 0,
      delivery_fee: 0,
      total_amount: fabricPrice,
      payment_status: "pending",
      notes: stripContactInfo(input.notes?.trim() ?? "") || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const orderId = order.id as string;
  const saved = await saveOrderContact(supabase, orderId, {
    first_name: firstName || null,
    last_name: rest.join(" ") || null,
    email: user.email ?? null,
    phone,
  });
  if (!saved) {
    return { ok: false, error: "Votre demande n'a pas pu être envoyée. Réessayez." };
  }

  await attachEmbroideryPhoto(supabase, user.id, orderId, input.embroideryPhoto);
  const autoQuoted = await applyAutoQuote(orderId, input, fabricPrice);

  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  return { ok: true, orderId, demo: false, autoQuoted };
}

/** Au-delà, ce n'est pas une photo compressée par le configurateur. */
const MAX_EMBROIDERY_PHOTO_BYTES = 2 * 1024 * 1024;

/**
 * Broderie « Je choisis » : range la photo dans le bucket privé
 * `embroidery-photos` (sous l'uid du client) et l'attache à la commande. Le
 * tailleur la voit dès le devis, par lien signé. Best-effort : bucket ou
 * colonne absents (migration 20260825000001 pas encore jouée), la demande part
 * quand même — la description et la couleur sont déjà dans la note.
 */
async function attachEmbroideryPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orderId: string,
  dataUrl: string | null | undefined,
): Promise<void> {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
  if (!match) return;
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length === 0 || bytes.length > MAX_EMBROIDERY_PHOTO_BYTES) return;
  const path = `${userId}/${orderId}.jpg`;
  const { error } = await supabase.storage
    .from("embroidery-photos")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (error) return;
  try {
    // Colonne d'une commande : écrite par le serveur, jamais par le navigateur.
    await createAdminClient()
      .from("orders")
      .update({ embroidery_photo_path: path })
      .eq("id", orderId)
      .eq("client_id", userId);
  } catch {
    // Clé de service absente : la photo reste rangée, sans lien sur la commande.
  }
}

/**
 * Devis automatique : le tailleur a fixé sur son modèle un prix, une livraison
 * et un délai. La demande reçoit ce devis tout de suite — prix fixe plus les
 * suppléments des choix retenus —, comme si le tailleur l'avait chiffrée
 * lui-même (`quoteOrder`). Seulement sur les créations du tailleur de la
 * commande. Best-effort : en cas d'échec, la demande reste un devis manuel.
 */
async function applyAutoQuote(
  orderId: string,
  input: GarmentQuoteInput,
  fabricPrice: number,
): Promise<boolean> {
  if (!input.modelId || !input.tailorId) return false;
  // Le client envoie son tissu : le tailleur doit lui répondre lui-même (combien
  // de mètres, et une adresse d'atelier où l'envoyer) — pas de devis automatique.
  if (input.type === "own_fabric") return false;
  // Les montants sont protégés en base (`guard_order_columns`) : client de
  // service, le prix venant du modèle et jamais du navigateur.
  let db;
  try {
    db = createAdminClient();
  } catch {
    return false;
  }

  const { data } = await db.from("models").select("*").eq("id", input.modelId).maybeSingle();
  const model = data as GarmentModel | null;
  if (!model || model.tailor_id !== input.tailorId) return false;
  const auto = modelAutoQuote(model);
  if (!auto) return false;

  const extra = styleExtraTotal(model, input.styleDetails ?? {});
  const tailoring = auto.price + extra;
  const { error } = await db
    .from("orders")
    .update({
      tailoring_price: tailoring,
      delivery_fee: auto.deliveryFee,
      total_amount: tailoring + auto.deliveryFee + fabricPrice,
      quote_ready_days: auto.readyDays,
      quote_auto: true,
    })
    .eq("id", orderId)
    .eq("status", "received")
    .eq("payment_status", "pending");
  return !error;
}

export type QuoteOrderState = { ok: true } | { ok: false; error: string };

/**
 * Le tailleur répond à une demande de devis : il fixe son prix et celui de la
 * livraison, le tissu étant déjà connu. Le client reçoit ce détail. La commande
 * reste « reçue » et impayée — la balle passe au client, qui accepte et paie
 * (`acceptQuote`) ou modifie sa demande (`reviseQuote`). Autorisé au seul tailleur
 * assigné.
 */
export async function quoteOrder(
  orderId: string,
  price: number,
  deliveryFee: number,
  readyDays: number,
  note?: string | null,
): Promise<QuoteOrderState> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const amount = Math.round(Number(price));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Indiquez un prix valide." };
  }
  const delivery = Math.round(Number(deliveryFee));
  if (!Number.isFinite(delivery) || delivery < 0) {
    return { ok: false, error: "Indiquez un prix de livraison valide." };
  }
  const days = Math.round(Number(readyDays));
  if (!Number.isFinite(days) || days < 1 || days > 120) {
    return { ok: false, error: "Indiquez en combien de jours la tenue sera prête (1 à 120)." };
  }
  // Pas de numéro ni d'e-mail : le client reste privé jusqu'au paiement.
  const cleanNote = stripContactInfo((note ?? "").trim()).slice(0, 200) || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: order } = await supabase
    .from("orders")
    .select("type, tailor_id, vendor_id, status, is_quote, payment_status, fabric_price")
    .eq("id", orderId)
    .single();
  const o = order as
    | {
        type: string;
        tailor_id: string | null;
        vendor_id: string | null;
        status: OrderStatus;
        is_quote: boolean;
        payment_status: string;
        fabric_price: number;
      }
    | null;
  if (!o) return { ok: false, error: "Commande introuvable." };
  if (o.tailor_id !== user.id) return { ok: false, error: "Cette commande n'est pas la vôtre." };
  if (!o.is_quote || o.status !== "received" || o.payment_status !== "pending") {
    return { ok: false, error: "Ce devis ne peut plus être chiffré." };
  }

  // Tissu d'un autre vendeur : une fois le devis payé, il partira à l'atelier. Le
  // vendeur doit donc toujours avoir une adresse où l'envoyer. Même chose quand
  // c'est le client qui envoie son propre tissu.
  const fabricComesToAtelier = o.type === "own_fabric";
  if ((o.vendor_id && o.vendor_id !== user.id) || fabricComesToAtelier) {
    const { data: atelier } = await supabase
      .from("tailor_ateliers")
      .select("tailor_id")
      .eq("tailor_id", user.id)
      .maybeSingle();
    if (!atelier) {
      return {
        ok: false,
        error: fabricComesToAtelier
          ? "Le client doit savoir où envoyer son tissu : indiquez l'adresse de votre atelier dans « Ma page publique »."
          : "JALOFA doit savoir où envoyer le tissu : indiquez l'adresse de votre atelier dans « Ma page publique ».",
      };
    }
  }

  // Le tailleur n'a pas le droit de toucher aux frais de livraison en base
  // (`guard_order_columns`), d'où le client de service, après les contrôles
  // d'identité ci-dessus.
  let db;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "L'envoi du devis est indisponible pour le moment." };
  }

  const total = amount + delivery + Number(o.fabric_price ?? 0);
  const priced = { tailoring_price: amount, delivery_fee: delivery, total_amount: total };
  const send = (patch: Record<string, unknown>) =>
    db
      .from("orders")
      .update(patch)
      .eq("id", orderId)
      .eq("tailor_id", user.id)
      .eq("status", "received")
      .eq("payment_status", "pending");

  let { error } = await send({ ...priced, quote_ready_days: days, quote_note: cleanNote });
  // Colonnes pas encore créées en prod (migration 20260812000001) : le prix
  // part quand même, le délai et la note arriveront après la migration.
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    ({ error } = await send(priced));
  }
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath(`/compte/commandes/${orderId}`);
  return { ok: true };
}

export type ReviseQuoteState = { ok: true } | { ok: false; error: string };

/**
 * Le client change le tissu ou un détail de sa demande et redemande un devis,
 * toujours gratuitement. Le nouveau devis remplace le précédent : le prix du
 * tailleur repart de zéro et il est prévenu. Autorisé au seul client propriétaire,
 * tant que rien n'est payé.
 */
export async function reviseQuote(
  orderId: string,
  input: {
    fabricId: string | null;
    fabricMeters: number | null;
    delivery: { address: string; city: string; country: string };
    notes: string;
  },
): Promise<ReviseQuoteState> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const delivery = cleanDelivery(input.delivery);
  if (!delivery) {
    return { ok: false, error: "Indiquez votre adresse de livraison et votre ville." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: order } = await supabase
    .from("orders")
    .select("client_id, type, status, is_quote, payment_status, quote_revision")
    .eq("id", orderId)
    .single();
  const o = order as
    | {
        client_id: string;
        type: OrderType;
        status: OrderStatus;
        is_quote: boolean;
        payment_status: string;
        quote_revision: number;
      }
    | null;
  if (!o) return { ok: false, error: "Commande introuvable." };
  if (o.client_id !== user.id) return { ok: false, error: "Cette commande n'est pas la vôtre." };
  if (!o.is_quote || o.status !== "received" || o.payment_status !== "pending") {
    return { ok: false, error: "Cette demande ne peut plus être modifiée." };
  }

  // Le tissu reste vide si le client apporte le sien.
  let fabricPatch: {
    fabric_id?: string;
    fabric_meters?: number;
    vendor_id?: string | null;
    fabric_price?: number;
  } = {};
  let fabricPrice = 0;
  if (o.type !== "own_fabric") {
    const meters = Number(input.fabricMeters);
    if (!input.fabricId || !Number.isFinite(meters) || meters <= 0) {
      return { ok: false, error: "Choisissez un tissu et le nombre de mètres." };
    }
    const { data } = await supabase
      .from("fabrics")
      .select("*")
      .eq("id", input.fabricId)
      .single();
    const fabric = data as Fabric | null;
    if (!fabric) return { ok: false, error: "Ce tissu n'existe plus." };
    if (isDemoFabric(fabric)) return { ok: false, error: demoFabricError(fabric.name) };
    if (!isFabricOnSale(fabric)) {
      return { ok: false, error: `Le tissu « ${fabric.name} » est épuisé. Choisissez-en un autre.` };
    }
    fabricPrice = Number(fabric.price_per_meter ?? 0) * meters;
    fabricPatch = {
      fabric_id: fabric.id,
      fabric_meters: meters,
      vendor_id: fabric.vendor_id ?? null,
      fabric_price: fabricPrice,
    };
  }

  // Le client n'a pas le droit de changer le tissu ni les montants en base
  // (`guard_order_columns`), d'où le client de service, après les contrôles
  // d'identité ci-dessus.
  let db;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "La modification est indisponible pour le moment." };
  }

  // Devis automatique : le prix fixe du tailleur ne dépend ni du tissu ni de
  // l'adresse, il reste acquis — seul le total suit le nouveau tissu. Lu à part :
  // tant que la colonne manque, la requête échoue sans rien casser.
  const { data: autoRow } = await db
    .from("orders")
    .select("quote_auto, tailoring_price, delivery_fee")
    .eq("id", orderId)
    .maybeSingle();
  const auto = autoRow as
    | { quote_auto: boolean; tailoring_price: number; delivery_fee: number }
    | null;
  const keepsPrice = Boolean(auto?.quote_auto) && Number(auto?.tailoring_price) > 0;
  const tailoring = keepsPrice ? Number(auto!.tailoring_price) : 0;
  const deliveryFee = keepsPrice ? Number(auto!.delivery_fee ?? 0) : 0;

  const { error } = await db
    .from("orders")
    .update({
      ...fabricPatch,
      delivery_address: delivery.address,
      delivery_city: delivery.city,
      delivery_country: delivery.country,
      notes: stripContactInfo(input.notes?.trim() ?? "") || null,
      tailoring_price: tailoring,
      delivery_fee: deliveryFee,
      total_amount: fabricPrice + tailoring + deliveryFee,
      quote_revision: Number(o.quote_revision ?? 0) + 1,
    })
    .eq("id", orderId)
    .eq("client_id", user.id)
    .eq("status", "received")
    .eq("payment_status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  return { ok: true };
}

export type AcceptQuoteState =
  | { ok: true; /** Bictorys : la page où le client paie. */ redirectUrl?: string }
  | { ok: false; error: string };

/**
 * Le client accepte le devis et paie le total en une fois : il devient une
 * commande ferme (`accepted`, payée), qui entre dans le pipeline normal. Le
 * tailleur et le vendeur sont prévenus par les triggers et commencent leur
 * travail. Autorisé au seul client propriétaire, sur un devis déjà chiffré et
 * encore impayé.
 */
export async function acceptQuote(
  orderId: string,
  deliveryOption: DeliveryOption = "economy",
): Promise<AcceptQuoteState> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: order } = await supabase
    .from("orders")
    .select(
      "client_id, tailor_id, vendor_id, type, is_quote, payment_status, tailoring_price, fabric_price, delivery_fee, total_amount, payment_id, fabric_id, delivery_address, delivery_city, delivery_country",
    )
    .eq("id", orderId)
    .single();
  const o = order as unknown as
    | {
        client_id: string;
        tailor_id: string | null;
        vendor_id: string | null;
        type: OrderType;
        is_quote: boolean;
        payment_status: string;
        tailoring_price: number;
        fabric_price: number;
        delivery_fee: number;
        total_amount: number;
        payment_id: string | null;
        fabric_id: string | null;
        delivery_address: string | null;
        delivery_city: string | null;
        delivery_country: string | null;
      }
    | null;
  if (!o) return { ok: false, error: "Commande introuvable." };
  if (o.client_id !== user.id) return { ok: false, error: "Cette commande n'est pas la vôtre." };
  if (!o.is_quote || o.payment_status !== "pending" || Number(o.tailoring_price ?? 0) <= 0) {
    return { ok: false, error: "Ce devis n'est pas prêt à être payé." };
  }

  // Le tailleur a chiffré la livraison vers cette adresse : pour en changer, le
  // client redemande un devis.
  if (!o.delivery_address || !o.delivery_city) {
    return { ok: false, error: "Ajoutez votre adresse avec « Modifier ma demande »." };
  }

  // Validation retirée entre-temps (pro suspect) : on n'encaisse pas.
  const unapproved = await findUnapprovedSeller(supabase, {
    tailorIds: [o.tailor_id],
    vendorIds: [o.vendor_id],
  });
  if (unapproved) return { ok: false, error: unapproved };

  const { data: privateContact } = await supabase
    .from("order_contacts")
    .select("first_name, last_name, phone")
    .eq("order_id", orderId)
    .maybeSingle();
  const contact = privateContact as OrderContact | null;

  // Le tissu a pu s'épuiser depuis la demande de devis : ne pas encaisser pour rien.
  if (o.fabric_id) {
    const { data: fabric } = await supabase
      .from("fabrics")
      .select("*")
      .eq("id", o.fabric_id)
      .maybeSingle();
    if (fabric && !isFabricAvailable(fabric as Fabric)) {
      return {
        ok: false,
        error: "Ce tissu est épuisé depuis votre demande. Contactez votre tailleur avant de payer.",
      };
    }
  }

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      recipient_name: [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || null,
      phone: contact?.phone ?? null,
      address_line: o.delivery_address,
      city: o.delivery_city,
      country: o.delivery_country ?? "Sénégal",
    })
    .select("id")
    .single();
  if (addressError) return { ok: false, error: addressError.message };

  // Option A / B (§3) : seul l'aller du tissu change, au tarif du vendeur ; la
  // livraison du vêtement est celle que le tailleur a mise dans son devis.
  const option: DeliveryOption = deliveryOption === "express" ? "express" : "economy";
  const [lineQuote] = await quoteLines(supabase, [
    { type: o.type, fabric_id: o.fabric_id, tailor_id: o.tailor_id },
  ]);
  const fees = lineQuote[option];
  if (!fees) {
    return { ok: false, error: "JALOFA ne propose pas l'express pour ce tissu. Choisissez l'économique." };
  }
  const fabricFee = fees.fabric;
  // Recalculé depuis ses parts (jamais « total + frais ») : un nouvel essai ne
  // rajoute pas l'envoi du tissu une deuxième fois.
  const total =
    Math.round(Number(o.fabric_price ?? 0)) +
    Math.round(Number(o.tailoring_price ?? 0)) +
    Math.round(Number(o.delivery_fee ?? 0)) +
    fabricFee;
  const viaBictorys = isBictorysConfigured();

  // Un paiement Bictorys déjà ouvert pour ce même montant : on y renvoie.
  if (viaBictorys && o.payment_id) {
    const { data: open } = await supabase
      .from("payments" as never)
      .select("status, amount, checkout_url")
      .eq("id", o.payment_id)
      .maybeSingle();
    const p = open as { status: string; amount: number; checkout_url: string | null } | null;
    if (p?.status === "pending" && Number(p.amount) === total && p.checkout_url) {
      return { ok: true, redirectUrl: p.checkout_url };
    }
  }

  const { data: paymentId, error: payErr } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: string | null; error: { message: string } | null }>;
  }).rpc("open_payment", {
    p_amount: total,
    // Stub : une clé fixe (un double clic ne paie pas deux fois). Bictorys : un
    // essai = un paiement (un essai échoué ne bloque pas le suivant).
    p_idempotency_key: viaBictorys ? `quote-${orderId}-${crypto.randomUUID()}` : `quote-${orderId}`,
    p_provider: viaBictorys ? "bictorys" : "manual",
  });
  if (payErr || !paymentId) {
    return { ok: false, error: "Le paiement n'a pas pu être ouvert. Réessayez." };
  }

  // Le total du devis fait foi : tissu, livraison et prix du tailleur y sont
  // déjà. Le paiement reste une écriture réservée au client de service.
  let db;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "Le paiement est indisponible pour le moment." };
  }

  const { error } = await db
    .from("orders")
    .update({
      // Bictorys : la commande reste un devis « en attente » jusqu'au webhook,
      // qui la passe payée et acceptée (`confirm_payment`).
      ...(viaBictorys ? {} : { payment_status: "paid" as const, status: "accepted" as OrderStatus }),
      address_id: address.id,
      delivery_method: "home",
      total_amount: total,
      ...({
        payment_id: paymentId,
        delivery_option: option,
        fabric_delivery_fee: fabricFee,
      } as Record<string, unknown>),
    })
    .eq("id", orderId)
    .eq("client_id", user.id)
    .eq("payment_status", "pending");
  if (error) return { ok: false, error: error.message };

  if (viaBictorys) {
    try {
      const { data: privateContact } = await supabase
        .from("order_contacts")
        .select("first_name, last_name, email, phone")
        .eq("order_id", orderId)
        .maybeSingle();
      const c = privateContact as OrderContact | null;
      const origin = await siteOrigin();
      const charge = await createCheckoutCharge({
        amount: total,
        paymentReference: paymentId,
        customer: {
          name: [c?.first_name, c?.last_name].filter(Boolean).join(" ") || "Client JALOFA",
          email: c?.email ?? user.email ?? "",
          phone: c?.phone ?? null,
        },
        successUrl: `${origin}/paiement/retour?p=${paymentId}`,
        errorUrl: `${origin}/paiement/retour?p=${paymentId}&e=1`,
      });
      await db
        .from("payments" as never)
        .update({ checkout_url: charge.link, provider_charge_id: charge.chargeId } as never)
        .eq("id", paymentId);
      return { ok: true, redirectUrl: charge.link };
    } catch (e) {
      await (db as unknown as { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown> }).rpc(
        "fail_payment",
        { p_payment_id: paymentId, p_provider_status: "charge_creation_failed" },
      );
      return { ok: false, error: e instanceof Error ? e.message : "Le paiement n'a pas pu être ouvert." };
    }
  }

  // Offre Pro échue : cette vente rouvre un mois, retenu sur le reversement.
  await renewProFromSale([o.tailor_id, o.vendor_id]);

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
async function updateOrderStatusImpl(orderId: string, status: OrderStatus) {
  const { supabase, order, isTailor } = await proOrder(orderId);

  // L'argent du vendeur dépend de la réception : ce n'est pas lui qui la déclare.
  if (
    !isTailor &&
    status !== "accepted" &&
    status !== "fabric_prepared" &&
    status !== "fabric_shipped"
  ) {
    throw new Error("La réception du tissu est confirmée par celui qui le reçoit.");
  }

  // La réception, c'est le client qui la confirme (`confirmOrderReceived`).
  if (status === "delivered") {
    throw new Error("C'est le client qui confirme qu'il a reçu sa commande.");
  }

  const timeline = timelineFor(pipelineType(order));
  const from = timeline.indexOf(order.status);
  const to = timeline.indexOf(status);
  if (to < 0) {
    throw new Error("Cette étape n'existe pas pour ce type de commande.");
  }
  if (to <= from) {
    throw new Error("Une commande ne peut pas revenir en arrière.");
  }

  // Cahier des charges §4 et §9 : l'envoi du tissu et la découpe ne partent
  // qu'aux conditions de `order-workflow` — expliquées ici, imposées par la base
  // (`orders_workflow_guard`) quoi qu'il arrive.
  await assertWorkflowAllows(supabase, orderId, order.status, status);

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("status", order.status);
  if (error) throw new Error(readableWorkflowError(error.message));
  revalidatePath(`/tailleur/espace`, "layout");
  revalidatePath(`/admin/boutique`, "layout");
  revalidatePath(`/compte/commandes/${orderId}`);
}

const PRE_CUT: OrderStatus[] = [
  "received",
  "accepted",
  "fabric_prepared",
  "fabric_shipped",
  "fabric_received_by_tailor",
];

/** Le passage de `from` à `to` est-il permis par le workflow, maintenant ? */
async function assertWorkflowAllows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
) {
  const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!data) throw new Error("Commande introuvable.");
  const [row] = await withCancellations(supabase, [data as unknown as Order]);
  const wf = toWorkflowOrder(row);
  const now = Date.now();

  if (wf.cancellation_pending) throw new Error(CUT_BLOCK_LABELS.cancellation_pending);
  if (wf.on_hold) throw new Error(CUT_BLOCK_LABELS.on_hold);

  if (to === "fabric_shipped") {
    const ship = shippingStatus(wf, now);
    if (!ship.allowed && ship.reason !== "not_applicable") {
      throw new Error(
        ship.reason === "waiting" && ship.availableAt
          ? `${SHIP_BLOCK_LABELS.waiting} ${formatWorkflowTime(ship.availableAt)}`
          : SHIP_BLOCK_LABELS[ship.reason!],
      );
    }
  }

  // Le vendeur peut oublier « Tissu envoyé » : le tailleur qui a le tissu en main
  // le dit lui-même, la base marque alors l'envoi « à vérifier » par JALOFA
  // (`fabric_vendor_check`), et le vendeur n'est payé qu'après vérification.
  if (to === "fabric_received_by_tailor" && wf.payment_status !== "paid") {
    throw new Error(CUT_BLOCK_LABELS.unpaid);
  }

  const cutting =
    row.type !== "fabric_only" &&
    PRE_CUT.includes(from) &&
    ["in_production", "sewing", "quality_check", "shipped", "delivered"].includes(to);
  if (cutting) {
    // Une réception déclarée en même temps compte (raccourci « J'ai reçu le tissu »).
    const cut = cuttingStatus(wf, now);
    if (!cut.allowed && cut.reason !== "already_started") {
      throw new Error(
        cut.reason === "waiting" && cut.availableAt
          ? `${CUT_BLOCK_LABELS.waiting} ${formatWorkflowTime(cut.availableAt)}`
          : CUT_BLOCK_LABELS[cut.reason!],
      );
    }
  }
}

/** « Possible à partir du 14 novembre à 08:00 » (heure de Dakar). */
function formatWorkflowTime(ms: number): string {
  return `Possible à partir du ${new Date(ms).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dakar",
  })}.`;
}

/** Les refus de la base portent un code entre parenthèses : on le traduit. */
function readableWorkflowError(message: string): string {
  const code = /\((\w+)\)\s*$/.exec(message)?.[1];
  if (code && message.startsWith("Découpe") && code in CUT_BLOCK_LABELS) {
    return CUT_BLOCK_LABELS[code as keyof typeof CUT_BLOCK_LABELS];
  }
  if (code && message.startsWith("Envoi") && code in SHIP_BLOCK_LABELS) {
    return SHIP_BLOCK_LABELS[code as keyof typeof SHIP_BLOCK_LABELS];
  }
  return message;
}

/**
 * Le tailleur remet la tenue à un livreur : nom, numéro et arrivée prévue. Le
 * client en est prévenu (trigger) et pourra appeler le livreur ; c'est ensuite
 * lui qui confirme la réception.
 */
async function handOverToCourierImpl(
  orderId: string,
  courier: { name: string; phone: string; eta: string },
) {
  const { supabase, order, isTailor } = await proOrder(orderId);
  if (!isTailor) throw new Error("C'est le tailleur qui remet la tenue au livreur.");

  const name = courier.name.trim().slice(0, 80);
  const phone = courier.phone.trim().slice(0, 30);
  const eta = new Date(courier.eta);
  if (!name) throw new Error("Indiquez le nom du livreur.");
  if (phone.replace(/\D/g, "").length < 7) throw new Error("Indiquez le numéro du livreur.");
  if (Number.isNaN(eta.getTime())) throw new Error("Indiquez quand la tenue arrivera.");

  const timeline = timelineFor(pipelineType(order));
  if (timeline.indexOf("shipped") <= timeline.indexOf(order.status)) {
    throw new Error("Cette commande est déjà en route.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "shipped" as OrderStatus,
      courier_name: name,
      courier_phone: phone,
      courier_eta: eta.toISOString(),
    })
    .eq("id", orderId)
    .eq("status", order.status);
  if (error) throw new Error(error.message);
  revalidatePath(`/tailleur/espace`, "layout");
  revalidatePath(`/compte/commandes/${orderId}`);
}

/** Le client a bien reçu sa tenue : la commande est terminée, avis et retouches s'ouvrent. */
export async function confirmOrderReceived(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const supabase = await createClient();
  // Fonction ajoutée par 20260814000001, pas encore dans `database.types.ts` ;
  // même signature que `confirm_fabric_received`.
  const { error } = await supabase.rpc(
    "confirm_order_received" as "confirm_fabric_received",
    { p_order_id: orderId },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte", "layout");
  revalidatePath("/tailleur/espace", "layout");
  return { ok: true };
}

/** Le client confirme qu'il a reçu son tissu : c'est ce qui paie le vendeur. */
export async function confirmFabricReceived(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Base de données non connectée." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_fabric_received", {
    p_order_id: orderId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  revalidatePath("/admin/boutique", "layout");
  return { ok: true };
}

/**
 * Le tailleur refuse une commande qu'il ne peut pas honorer, EN DONNANT un
 * motif. Le statut passe à `rejected` et le motif est enregistré : un trigger
 * `security definer` en prévient aussitôt le client (cf. la migration), qui
 * pourra relancer chez un autre tailleur. L'administration, elle, retrouve le
 * refus sur sa page dédiée.
 */
async function rejectOrderImpl(orderId: string, reason: RejectionReason) {
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
  revalidatePath(`/admin/boutique`, "layout");
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
    .select("client_id, status, model_id, fabric_price, delivery_fee, is_quote, payment_status")
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
  const unapproved = await findUnapprovedSeller(supabase, { tailorIds: [newTailorId] });
  if (unapproved) return { ok: false, error: unapproved };

  // Une demande de devis pas encore payée repart sans prix : le nouveau tailleur
  // fixe le sien, et celui de la livraison.
  const freshQuote = order.is_quote && order.payment_status === "pending";
  const tailoringPrice = freshQuote
    ? 0
    : await resolveTailoringPrice(supabase, order.model_id as string | null, newTailorId);
  const deliveryFee = freshQuote ? 0 : Number(order.delivery_fee ?? 0);
  const total = Number(order.fabric_price ?? 0) + tailoringPrice + deliveryFee;

  const { error } = await supabase
    .from("orders")
    .update({
      tailor_id: newTailorId,
      tailoring_price: tailoringPrice,
      total_amount: total,
      ...(freshQuote ? { delivery_fee: 0 } : {}),
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

// Wrappers exportés : le message d'erreur doit revenir en valeur, pas en exception
// (masquée en production) — cf. `src/lib/action-result.ts`.
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  return runAction(() => updateOrderStatusImpl(orderId, status));
}

export async function handOverToCourier(orderId: string, courier: { name: string; phone: string; eta: string }): Promise<ActionResult> {
  return runAction(() => handOverToCourierImpl(orderId, courier));
}

export async function rejectOrder(orderId: string, reason: RejectionReason): Promise<ActionResult> {
  return runAction(() => rejectOrderImpl(orderId, reason));
}
