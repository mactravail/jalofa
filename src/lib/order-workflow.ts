import type { OrderStatus, OrderType } from "./constants";
import type { Order } from "./types";

/**
 * Le workflow d'une commande : délais d'attente, autorisation de découpe,
 * blocage par une demande d'annulation, indemnisation et proposition de
 * règlement. Cahier des charges JALOFA (2026-11-13), §3 à §9.
 *
 * Ce module est PUR (aucun accès réseau, aucune horloge implicite : `now` est
 * toujours passé) pour être testé avec des horloges fictives
 * (`order-workflow.test.ts`) et réutilisé partout : server actions, écrans pro,
 * écran client, administration. La base applique les mêmes règles dans le
 * trigger `orders_workflow_guard` (migration 20260826000001) : l'interface ne
 * fait qu'expliquer ce que le serveur autorise.
 *
 * Montants : le FCFA (XOF) n'a pas de sous-unité — tous les montants sont des
 * entiers en francs. Les pourcentages sont arrondis au franc le plus proche
 * (`Math.round`, demi vers le haut) ; un remboursement n'est jamais négatif.
 *
 * Horodatages : chaînes ISO en UTC, écrites par la base (`now()`), jamais par le
 * navigateur.
 */

// --- Constantes (§17 : configurables, ici et seulement ici) -----------------

/** Option A : le vendeur attend 24 h après le paiement avant d'expédier. */
export const SELLER_WAIT_HOURS = 24;
/** Délai avant la découpe (son point de départ dépend du scénario, §9). */
export const CUT_WAIT_HOURS = 24;
/** Indemnité du tailleur après une découpe autorisée : 35 % de la couture SEULE. */
export const CUT_COMPENSATION_RATE = 0.35;
/**
 * Commission JALOFA. Sélection JALOFA (novembre 2026) : accès PRO offert, aucune
 * commission. Taux à valider avant toute mise en place (§17).
 */
export const JALOFA_COMMISSION_RATE = 0;

const HOUR_MS = 3_600_000;

// --- Types --------------------------------------------------------------------

/** A = économique, B = express (§3). */
export type DeliveryOption = "economy" | "express";
export type FabricOwner = "vendor" | "tailor" | "client";

export type WorkflowOrder = {
  type: OrderType;
  status: OrderStatus;
  payment_status: string;
  tailor_id: string | null;
  vendor_id: string | null;
  delivery_option: DeliveryOption | null;
  paid_at: string | null;
  fabric_shipped_at: string | null;
  fabric_received_at: string | null;
  /** Réception déclarée par le tailleur sans envoi déclaré : JALOFA vérifie. */
  vendor_check?: "pending" | "confirmed" | "denied" | null;
  cut_started_at: string | null;
  /** Instantané pris par la base au moment de la découpe. */
  cut_was_authorized: boolean | null;
  fabric_price: number;
  tailoring_price: number;
  /** Livraison aller du tissu (vendeur → tailleur, ou → client pour un tissu seul). */
  fabric_delivery_fee: number | null;
  /** Livraison du vêtement fini au client. */
  delivery_fee: number;
  total_amount: number;
  /** Ce qui a réellement été encaissé ; à défaut, le total de la commande. */
  amount_paid: number | null;
  /** Une demande d'annulation est en cours d'examen. */
  cancellation_pending: boolean;
  /** Litige ou blocage décidé par JALOFA (`orders.workflow_hold`). */
  on_hold?: boolean;
};

export type CutBlock =
  | "not_applicable"
  | "closed"
  | "unpaid"
  | "cancellation_pending"
  | "on_hold"
  | "fabric_not_received"
  | "waiting"
  | "already_started";

export type CutStatus = {
  allowed: boolean;
  reason: CutBlock | null;
  /** Quand la découpe deviendra possible (si la seule attente est le délai). */
  availableAt: number | null;
};

export type ShipBlock =
  | "not_applicable"
  | "closed"
  | "unpaid"
  | "cancellation_pending"
  | "on_hold"
  | "waiting"
  | "already_shipped";

export type ShipStatus = {
  allowed: boolean;
  reason: ShipBlock | null;
  availableAt: number | null;
};

/** Une commande lue en base, vue par les règles du workflow. */
export function toWorkflowOrder(order: Order): WorkflowOrder {
  return {
    type: order.type,
    status: order.status,
    payment_status: order.payment_status,
    tailor_id: order.tailor_id,
    vendor_id: order.vendor_id,
    delivery_option: order.delivery_option ?? null,
    paid_at: order.paid_at ?? null,
    fabric_shipped_at: order.fabric_shipped_at ?? null,
    fabric_received_at: order.fabric_received_at ?? null,
    vendor_check: order.fabric_vendor_check ?? null,
    cut_started_at: order.cut_started_at ?? null,
    cut_was_authorized: order.cut_was_authorized ?? null,
    fabric_price: Number(order.fabric_price ?? 0),
    tailoring_price: Number(order.tailoring_price ?? 0),
    fabric_delivery_fee: Number(order.fabric_delivery_fee ?? 0),
    delivery_fee: Number(order.delivery_fee ?? 0),
    total_amount: Number(order.total_amount ?? 0),
    amount_paid: order.amount_paid == null ? null : Number(order.amount_paid),
    cancellation_pending: order.cancellation?.status === "pending",
    on_hold: Boolean(order.workflow_hold),
  };
}

// --- Qui possède le tissu -----------------------------------------------------

export function fabricOwnerOf(order: Pick<WorkflowOrder, "type" | "tailor_id" | "vendor_id">): FabricOwner {
  if (order.type === "own_fabric") return "client";
  if (order.type === "full" && order.tailor_id && order.tailor_id === order.vendor_id) {
    return "tailor";
  }
  return "vendor";
}

/** Le tissu doit-il voyager jusqu'au tailleur avant la découpe ? */
export function needsFabricReception(order: WorkflowOrder): boolean {
  if (order.type === "fabric_only") return false;
  return fabricOwnerOf(order) !== "tailor";
}

const ms = (iso: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
};

const CLOSED: OrderStatus[] = ["cancelled", "rejected", "delivered"];
const CUT_OR_LATER: OrderStatus[] = ["in_production", "sewing", "quality_check", "shipped", "delivered"];

export function optionOf(order: Pick<WorkflowOrder, "delivery_option">): DeliveryOption {
  return order.delivery_option === "express" ? "express" : "economy";
}

/**
 * Le point de départ des 24 h avant découpe (tableau du §9) :
 * - option A, tissu du vendeur ou du client : la réception confirmée par le tailleur ;
 * - tous les autres cas : la confirmation du paiement.
 */
export function cutClockStart(order: WorkflowOrder): number | null {
  const owner = fabricOwnerOf(order);
  if (optionOf(order) === "economy" && owner !== "tailor") return ms(order.fabric_received_at);
  return ms(order.paid_at);
}

/**
 * `canAuthorizeCutting` du cahier des charges (§9). La découpe correspond au
 * passage de la commande à « en production ».
 */
export function cuttingStatus(order: WorkflowOrder, now: number): CutStatus {
  const no = (reason: CutBlock, availableAt: number | null = null): CutStatus => ({
    allowed: false,
    reason,
    availableAt,
  });

  if (order.type === "fabric_only") return no("not_applicable");
  if (order.cut_started_at || CUT_OR_LATER.includes(order.status)) return no("already_started");
  if (CLOSED.includes(order.status)) return no("closed");
  if (order.payment_status !== "paid" || !order.paid_at) return no("unpaid");
  if (order.cancellation_pending) return no("cancellation_pending");
  if (order.on_hold) return no("on_hold");

  const start = cutClockStart(order);
  const availableAt = start === null ? null : start + CUT_WAIT_HOURS * HOUR_MS;
  if (needsFabricReception(order) && !order.fabric_received_at) {
    return no("fabric_not_received", availableAt);
  }
  if (availableAt === null) return no("waiting");
  if (now < availableAt) return no("waiting", availableAt);
  return { allowed: true, reason: null, availableAt };
}

export function canAuthorizeCutting(order: WorkflowOrder, now: number): boolean {
  return cuttingStatus(order, now).allowed;
}

/**
 * Le vendeur peut-il expédier ? Seulement un tissu qui voyage (pas celui du
 * tailleur lui-même), après paiement, sans annulation en cours. Option A : 24 h
 * après le paiement ; option B : tout de suite.
 */
export function shippingStatus(order: WorkflowOrder, now: number): ShipStatus {
  const no = (reason: ShipBlock, availableAt: number | null = null): ShipStatus => ({
    allowed: false,
    reason,
    availableAt,
  });

  const owner = fabricOwnerOf(order);
  if (owner !== "vendor") return no("not_applicable");
  if (order.fabric_shipped_at) return no("already_shipped");
  if (CLOSED.includes(order.status)) return no("closed");
  if (order.payment_status !== "paid" || !order.paid_at) return no("unpaid");
  if (order.cancellation_pending) return no("cancellation_pending");
  if (order.on_hold) return no("on_hold");

  const paidAt = ms(order.paid_at)!;
  const availableAt =
    optionOf(order) === "economy" ? paidAt + SELLER_WAIT_HOURS * HOUR_MS : paidAt;
  if (now < availableAt) return no("waiting", availableAt);
  return { allowed: true, reason: null, availableAt };
}

// --- Argent -------------------------------------------------------------------

/** 35 % du prix de la couture, et de rien d'autre (§5.1). */
export function cutCompensation(tailoringPrice: number): number {
  return Math.round(Math.max(0, tailoringPrice) * CUT_COMPENSATION_RATE);
}

export function amountPaidOf(order: Pick<WorkflowOrder, "amount_paid" | "total_amount">): number {
  return Math.max(0, Math.round(Number(order.amount_paid ?? order.total_amount ?? 0)));
}

export type LedgerParty = "client" | "vendor" | "tailor" | "carrier" | "jalofa";

export type LedgerKind =
  | "fabric"
  | "tailoring"
  | "delivery_out"
  | "delivery_garment"
  | "delivery_return"
  | "compensation"
  | "commission";

/** Une part due à quelqu'un sur une commande. */
export type ShareLine = {
  party: LedgerParty;
  /** L'id du pro concerné ; null pour le transporteur, JALOFA ou le client. */
  partyId: string | null;
  kind: LedgerKind;
  amount: number;
};

/**
 * Ce que chacun reçoit quand la commande aboutit (§3.4, §7). Vendeur et
 * tailleur sont comptés sur des lignes distinctes même quand c'est la même
 * personne.
 */
export function completionShares(order: WorkflowOrder): ShareLine[] {
  const lines: ShareLine[] = [];
  const owner = fabricOwnerOf(order);
  const fabricTo = owner === "tailor" ? order.tailor_id : order.vendor_id;
  const fabricParty: LedgerParty = owner === "tailor" ? "tailor" : "vendor";

  if (order.type !== "own_fabric" && order.fabric_price > 0) {
    lines.push({ party: fabricParty, partyId: fabricTo, kind: "fabric", amount: Math.round(order.fabric_price) });
  }
  if (order.type !== "own_fabric" && (order.fabric_delivery_fee ?? 0) > 0) {
    // Le vendeur a avancé l'envoi : il récupère le tarif annoncé au client.
    lines.push({
      party: fabricParty,
      partyId: fabricTo,
      kind: "delivery_out",
      amount: Math.round(order.fabric_delivery_fee ?? 0),
    });
  }
  if (order.type !== "fabric_only" && order.tailoring_price > 0) {
    lines.push({ party: "tailor", partyId: order.tailor_id, kind: "tailoring", amount: Math.round(order.tailoring_price) });
  }
  if (order.type !== "fabric_only" && order.delivery_fee > 0) {
    lines.push({ party: "tailor", partyId: order.tailor_id, kind: "delivery_garment", amount: Math.round(order.delivery_fee) });
  }
  return lines;
}

// --- Annulation : proposition de règlement ------------------------------------

export type CancellationStage =
  | "unpaid"
  | "before_shipment"
  | "fabric_travelled"
  | "after_authorized_cut"
  | "after_unauthorized_cut"
  | "garment_shipped";

/** Où en est la commande au moment où le client demande l'annulation. */
export function cancellationStage(order: WorkflowOrder): CancellationStage {
  if (order.payment_status !== "paid") return "unpaid";
  if (order.status === "shipped" || order.status === "delivered") return "garment_shipped";
  if (order.cut_started_at || CUT_OR_LATER.includes(order.status)) {
    return order.cut_was_authorized ? "after_authorized_cut" : "after_unauthorized_cut";
  }
  if (order.fabric_shipped_at || order.fabric_received_at) return "fabric_travelled";
  return "before_shipment";
}

/** Ce qui demande la décision d'une personne de JALOFA (§13, règle finale). */
export type ReviewFlag =
  | "return_fee_missing"
  | "unauthorized_cut"
  | "sewing_started"
  | "fabric_ownership_legal"
  | "garment_already_shipped"
  | "deductions_exceed_payment";

export type SettlementProposal = {
  stage: CancellationStage;
  paid: number;
  /** Parts retenues sur le paiement (indemnité, trajets effectués, tissu…). */
  lines: ShareLine[];
  refund: number;
  flags: ReviewFlag[];
};

export type SettlementInput = {
  /**
   * Coût réel du retour du tissu (ou des pièces), justifié par un tarif
   * transporteur ou une preuve. null = pas encore connu.
   */
  returnFee: number | null;
};

/**
 * Proposition de règlement d'une annulation (§3.4, §3.8, §5). Ce n'est qu'une
 * PROPOSITION : JALOFA l'examine et la valide (`decide_order_cancellation`).
 *
 * - Avant toute expédition : remboursement total, aucun trajet non effectué
 *   n'est facturé.
 * - Tissu déjà parti, pas de découpe : en A le vendeur supporte l'aller, en B
 *   l'aller payé d'avance revient au vendeur (trajet effectué) ; le client paie
 *   le retour. La livraison du vêtement, jamais faite, est remboursée.
 * - Découpe autorisée : le tailleur reçoit 35 % de la couture ; le tissu du
 *   vendeur ou du tailleur reste dû à son propriétaire (transfert de propriété :
 *   validation juridique requise, signalée).
 * - Découpe non autorisée : aucune indemnité à la charge du client ; JALOFA
 *   examine la responsabilité du prestataire.
 */
export function proposeSettlement(order: WorkflowOrder, input: SettlementInput): SettlementProposal {
  const stage = cancellationStage(order);
  const paid = amountPaidOf(order);
  const lines: ShareLine[] = [];
  const flags: ReviewFlag[] = [];
  const owner = fabricOwnerOf(order);
  const express = optionOf(order) === "express";
  const fabricOut = Math.round(order.fabric_delivery_fee ?? 0);
  const fabricTo = owner === "tailor" ? order.tailor_id : order.vendor_id;
  const fabricParty: LedgerParty = owner === "tailor" ? "tailor" : "vendor";

  const chargeReturn = () => {
    if (input.returnFee === null) {
      flags.push("return_fee_missing");
      return;
    }
    if (input.returnFee > 0) {
      lines.push({ party: "carrier", partyId: null, kind: "delivery_return", amount: Math.round(input.returnFee) });
    }
  };

  switch (stage) {
    case "unpaid":
    case "before_shipment":
      break;

    case "fabric_travelled":
      if (owner === "vendor" && express && fabricOut > 0) {
        lines.push({ party: "vendor", partyId: order.vendor_id, kind: "delivery_out", amount: fabricOut });
      }
      chargeReturn();
      break;

    case "after_authorized_cut":
      if (order.status !== "in_production") flags.push("sewing_started");
      lines.push({
        party: "tailor",
        partyId: order.tailor_id,
        kind: "compensation",
        amount: cutCompensation(order.tailoring_price),
      });
      if (owner !== "client" && order.fabric_price > 0) {
        lines.push({ party: fabricParty, partyId: fabricTo, kind: "fabric", amount: Math.round(order.fabric_price) });
        flags.push("fabric_ownership_legal");
      }
      if (owner === "vendor" && express && fabricOut > 0) {
        lines.push({ party: "vendor", partyId: order.vendor_id, kind: "delivery_out", amount: fabricOut });
      }
      chargeReturn();
      break;

    case "after_unauthorized_cut":
      flags.push("unauthorized_cut");
      break;

    case "garment_shipped":
      flags.push("garment_already_shipped");
      break;
  }

  const kept = lines.reduce((sum, l) => sum + l.amount, 0);
  if (kept > paid) flags.push("deductions_exceed_payment");
  return { stage, paid, lines, refund: Math.max(0, paid - kept), flags };
}

// --- Libellés (français, public peu lettré) -----------------------------------

export const CUT_BLOCK_LABELS: Record<CutBlock, string> = {
  not_applicable: "Pas de couture sur cette commande.",
  closed: "Commande terminée.",
  unpaid: "Paiement pas encore confirmé.",
  cancellation_pending: "Bloqué : le client a demandé l'annulation. JALOFA examine.",
  on_hold: "Bloqué par JALOFA (litige en cours).",
  fabric_not_received: "Confirmez d'abord la réception du tissu.",
  waiting: "Attendez 24 h avant de couper le tissu.",
  already_started: "Découpe déjà commencée.",
};

export const SHIP_BLOCK_LABELS: Record<ShipBlock, string> = {
  not_applicable: "Pas d'envoi de tissu.",
  closed: "Commande terminée.",
  unpaid: "Paiement pas encore confirmé.",
  cancellation_pending: "Bloqué : le client a demandé l'annulation. JALOFA examine.",
  on_hold: "Bloqué par JALOFA (litige en cours).",
  waiting: "Livraison économique : attendez 24 h après le paiement avant d'envoyer.",
  already_shipped: "Tissu déjà envoyé.",
};

export const REVIEW_FLAG_LABELS: Record<ReviewFlag, string> = {
  return_fee_missing: "Coût du retour à renseigner (tarif ou preuve du transporteur).",
  unauthorized_cut: "Découpe NON autorisée : aucune indemnité pour le client, responsabilité du prestataire à examiner.",
  sewing_started: "La couture avait commencé : vérifier les preuves.",
  fabric_ownership_legal: "Tissu dû à son propriétaire : transfert de propriété à valider juridiquement.",
  garment_already_shipped: "Vêtement déjà parti : ce n'est plus une annulation, traiter comme litige.",
  deductions_exceed_payment: "Les retenues dépassent le montant payé : arbitrage nécessaire.",
};

export const DELIVERY_OPTION_LABELS: Record<DeliveryOption, string> = {
  economy: "Économique",
  express: "Express",
};
