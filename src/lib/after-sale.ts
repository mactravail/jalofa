import type { OrderStatus, OrderType } from "@/lib/constants";

/**
 * Les règles de l'après-vente. Les durées sont ici, et seulement ici.
 *
 * - Annulation : remboursée pendant `CANCEL_WINDOW_HOURS` après le paiement, tant
 *   que le tissu n'est pas parti.
 * - Tissu seul : il peut être rendu pendant `RETURN_WINDOW_DAYS` après réception.
 *   Le client paie le renvoi ; il est remboursé quand le vendeur l'a reçu.
 * - Vêtement : jamais repris. Le tailleur le retouche.
 * - Tissu seul expédié : JALOFA contacte le client ; sans réponse après
 *   `RECEIPT_CONFIRM_HOURS`, le tissu est considéré comme reçu.
 */
export const CANCEL_WINDOW_HOURS = 24;
export const RETURN_WINDOW_DAYS = 3;
export const RECEIPT_CONFIRM_HOURS = 48;

/**
 * Le tailleur et le vendeur de tissu sont payés 72 h après la livraison : c'est
 * le temps qu'a le client (ou son GP, s'il vit à l'étranger) pour signaler un
 * problème à JALOFA.
 */
export const PAYOUT_DELAY_HOURS = 72;

// Les délais choisis d'après le marché (2026-11-10). Tous tiennent dans la même
// logique : le retour d'un tissu (3 j) et le signalement d'un problème (3 j) se
// ferment au moment où le pro est payé (72 h). Ainsi, JALOFA n'a jamais à
// reprendre de l'argent déjà versé.
//
// Engagements du pro, écrits dans /conditions (B3). Pas encore de relance ni
// d'annulation automatique : c'est une règle, pas un minuteur.
/** Accepter ou refuser une nouvelle commande ou un devis (standard des places de marché : 24 h). */
export const PRO_RESPONSE_HOURS = 24;
/** Le vendeur expédie le tissu après le paiement (standard e-commerce : 1 à 2 jours). */
export const FABRIC_SHIP_HOURS = 48;

/** Plafond de confection écrit dans /conditions (A4, B5). */
export const MAX_MAKING_DAYS = 12;
/**
 * Plus d'une semaine de retard sur la date promise : le client peut annuler et
 * être remboursé, quel que soit l'avancement, tant que l'habit n'est pas parti.
 */
export const LATE_CANCEL_GRACE_DAYS = 7;

// --- « La tenue vous va ? » ------------------------------------------------

export type SatisfactionVerdict = "perfect" | "problem";

/**
 * Les problèmes proposés au client. `who` = le prestataire concerné (il est
 * prévenu, et c'est sur lui que le problème compte). `alteration` = ce que le
 * tailleur peut retoucher : une demande de retouche part avec.
 */
export const SATISFACTION_ISSUES = {
  too_big: { label: "Trop grande", who: "tailor", alteration: "too_big" },
  too_small: { label: "Trop petite", who: "tailor", alteration: "too_small" },
  slit_too_wide: { label: "Fente trop large", who: "tailor", alteration: "slit_too_wide" },
  wrong_length: { label: "Longueur pas bonne", who: "tailor", alteration: "other" },
  bad_finish: { label: "Couture mal finie", who: "tailor", alteration: "other" },
  not_like_model: { label: "Pas comme le modèle", who: "tailor", alteration: null },
  fabric_different: { label: "Tissu différent de la photo", who: "vendor", alteration: null },
  fabric_damaged: { label: "Tissu abîmé", who: "vendor", alteration: null },
  late: { label: "Livrée en retard", who: "tailor", alteration: null },
  other: { label: "Autre chose", who: "tailor", alteration: null },
} as const satisfies Record<
  string,
  { label: string; who: "tailor" | "vendor"; alteration: AlterationReason | null }
>;

export type SatisfactionIssue = keyof typeof SATISFACTION_ISSUES;

export const isSatisfactionIssue = (v: string): v is SatisfactionIssue =>
  Object.prototype.hasOwnProperty.call(SATISFACTION_ISSUES, v);

/** Le WhatsApp de l'équipe JALOFA — seul moyen de contact affiché au client. */
export const JALOFA_WHATSAPP = "00393291114442";
export const JALOFA_WHATSAPP_DISPLAY = "+39 329 111 4442";

export type AlterationReason = "too_big" | "too_small" | "slit_too_wide" | "other";

export const ALTERATION_REASON_LABELS: Record<AlterationReason, string> = {
  too_big: "Trop grand",
  too_small: "Trop petit",
  slit_too_wide: "Fente trop large",
  other: "Autre chose",
};

const HOUR_MS = 3_600_000;

type AfterSaleOrder = {
  type: OrderType;
  status: OrderStatus;
  payment_status: string;
  is_quote: boolean;
  created_at: string;
  /** Délai donné par le tailleur sur un devis ; sinon le plafond de 12 jours. */
  quote_ready_days?: number | null;
  fabric_return?: { status: string } | null;
  alterations?: { status: string }[] | null;
};

type HistoryRow = { status: OrderStatus; created_at: string };

function statusTime(history: HistoryRow[], status: OrderStatus): number | null {
  const row = history.find((h) => h.status === status);
  return row ? new Date(row.created_at).getTime() : null;
}

/** Fin du délai d'annulation d'une commande payée, en millisecondes. */
export function cancelDeadline(order: AfterSaleOrder, history: HistoryRow[]): number | null {
  if (order.payment_status !== "paid") return null;
  const paidAt = order.is_quote
    ? statusTime(history, "accepted")
    : new Date(order.created_at).getTime();
  return paidAt === null ? null : paidAt + CANCEL_WINDOW_HOURS * HOUR_MS;
}

export function canCancelOrder(
  order: AfterSaleOrder,
  history: HistoryRow[],
  now: number = Date.now(),
): boolean {
  // Refusée par le tailleur : le client peut toujours récupérer son argent.
  if (order.status === "rejected") return true;
  // Devis pas encore payé : le client n'a rien engagé.
  if (order.payment_status === "pending") {
    return order.is_quote && order.status === "received";
  }
  if (order.payment_status !== "paid") return false;
  if (!["received", "accepted", "fabric_prepared"].includes(order.status)) return false;
  const deadline = cancelDeadline(order, history);
  return deadline !== null && now <= deadline;
}

/**
 * La date où l'habit devait être prêt : à partir de l'acceptation par le
 * tailleur (ou du paiement), plus le délai du devis, sinon 12 jours.
 */
export function promisedReadyAt(order: AfterSaleOrder, history: HistoryRow[]): number | null {
  if (order.type === "fabric_only" || order.payment_status !== "paid") return null;
  const start = statusTime(history, "accepted") ?? new Date(order.created_at).getTime();
  return start + (order.quote_ready_days ?? MAX_MAKING_DAYS) * 24 * HOUR_MS;
}

/** À partir de quand le retard permet d'annuler, en millisecondes. */
export function lateCancelFrom(order: AfterSaleOrder, history: HistoryRow[]): number | null {
  const promised = promisedReadyAt(order, history);
  return promised === null ? null : promised + LATE_CANCEL_GRACE_DAYS * 24 * HOUR_MS;
}

/** Plus d'une semaine de retard, habit pas encore parti : annulation remboursée. */
export function canCancelForLateness(
  order: AfterSaleOrder,
  history: HistoryRow[],
  now: number = Date.now(),
): boolean {
  if (["shipped", "delivered", "cancelled", "rejected"].includes(order.status)) return false;
  const from = lateCancelFrom(order, history);
  return from !== null && now >= from;
}

/** Fin du délai de retour d'un tissu reçu, en millisecondes. */
export function returnDeadline(order: AfterSaleOrder, history: HistoryRow[]): number | null {
  if (order.type !== "fabric_only" || order.status !== "delivered") return null;
  const deliveredAt = statusTime(history, "delivered");
  return deliveredAt === null ? null : deliveredAt + RETURN_WINDOW_DAYS * 24 * HOUR_MS;
}

export function canReturnFabric(
  order: AfterSaleOrder,
  history: HistoryRow[],
  now: number = Date.now(),
): boolean {
  if (order.payment_status !== "paid" || order.fabric_return) return false;
  const deadline = returnDeadline(order, history);
  return deadline !== null && now <= deadline;
}

/** Un vêtement livré se retouche, une demande à la fois. */
export function canAskAlteration(order: AfterSaleOrder): boolean {
  return (
    order.type !== "fabric_only" &&
    order.status === "delivered" &&
    order.payment_status === "paid" &&
    !(order.alterations ?? []).some((a) => a.status === "requested")
  );
}

/** Lien WhatsApp vers le numéro donné au paiement, ou null s'il est inutilisable. */
export function whatsappHref(phone: string | null | undefined, message: string): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Numéro sénégalais écrit sans indicatif : 77 123 45 67.
  if (digits.length === 9) digits = `221${digits}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Date lue à l'heure du Sénégal, où que tourne le serveur. */
export function formatDeadline(ms: number, locale = "fr-FR"): string {
  return new Date(ms).toLocaleString(locale, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dakar",
  });
}
