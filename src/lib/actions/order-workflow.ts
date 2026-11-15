"use server";

import { revalidatePath } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { refundTransaction } from "@/lib/bictorys";
import { withCancellations } from "@/lib/order-cancellations";
import {
  CUT_BLOCK_LABELS,
  SHIP_BLOCK_LABELS,
  proposeSettlement,
  toWorkflowOrder,
  type CutBlock,
  type ShipBlock,
} from "@/lib/order-workflow";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

/**
 * Les gestes du workflow de commande (cahier des charges §4, §5, §10, §12).
 * Chaque geste passe par une fonction SQL qui vérifie l'identité, verrouille la
 * commande et écrit le journal : l'interface ne décide jamais seule.
 */

const NOT_CONNECTED = "Base de données non connectée.";

/** Les fonctions SQL ajoutées par 20260826000001 ne sont pas encore dans `database.types.ts`. */
type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};
const rpc = (client: unknown) => client as RpcClient;

/** « Découpe pas encore autorisée (waiting) » → la phrase française du motif. */
function readableDbError(message: string): string {
  const match = /\((\w+)\)\s*$/.exec(message);
  const code = match?.[1];
  if (code && code in CUT_BLOCK_LABELS && message.startsWith("Découpe")) {
    return CUT_BLOCK_LABELS[code as CutBlock];
  }
  if (code && code in SHIP_BLOCK_LABELS && message.startsWith("Envoi")) {
    return SHIP_BLOCK_LABELS[code as ShipBlock];
  }
  return message;
}

function revalidateOrder(orderId: string) {
  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/admin", "layout");
}

async function call(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await rpc(supabase).rpc(fn, args);
  if (error) throw new Error(readableDbError(error.message));
  return data;
}

// --- Client -------------------------------------------------------------------

/**
 * Le client demande l'annulation : la commande est bloquée À L'INSTANT (plus de
 * découpe, plus d'envoi), le tailleur, le vendeur et JALOFA sont prévenus.
 * Sans paiement, l'annulation est immédiate.
 */
export async function requestCancellation(orderId: string, reason: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    await call("request_order_cancellation", {
      p_order_id: orderId,
      p_reason: reason.trim().slice(0, 500) || null,
    });
    revalidateOrder(orderId);
  });
}

// --- Tailleur -----------------------------------------------------------------

/** Le tailleur a reçu le tissu que le client lui a envoyé : les 24 h commencent. */
export async function confirmClientFabricReceived(orderId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    await call("confirm_client_fabric_received", { p_order_id: orderId });
    revalidateOrder(orderId);
  });
}

const PROOF_KINDS = ["shipping", "reception", "cut_before", "cut_after", "return", "other"] as const;
export type ProofKind = (typeof PROOF_KINDS)[number];
const MAX_PROOF_BYTES = 3 * 1024 * 1024;

/**
 * Une preuve photo (envoi, réception, tissu avant/après découpe), horodatée par
 * la base et rangée dans le bucket privé `order-proofs/<uid>/<commande>/`.
 */
export async function uploadOrderProof(
  orderId: string,
  kind: ProofKind,
  dataUrl: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    if (!PROOF_KINDS.includes(kind)) throw new Error("Type de preuve inconnu.");
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) throw new Error("Envoyez une photo (JPEG, PNG ou WebP).");
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length === 0 || bytes.length > MAX_PROOF_BYTES) {
      throw new Error("Photo trop lourde (3 Mo maximum).");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Vous devez être connecté.");

    // La RLS ne laisse lire que ses propres commandes : la lecture vaut contrôle.
    const { data: order } = await supabase
      .from("orders")
      .select("id, client_id, tailor_id, vendor_id")
      .eq("id", orderId)
      .maybeSingle();
    const o = order as { client_id: string; tailor_id: string | null; vendor_id: string | null } | null;
    if (!o || ![o.client_id, o.tailor_id, o.vendor_id].includes(user.id)) {
      throw new Error("Cette commande ne vous concerne pas.");
    }

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const path = `${user.id}/${orderId}/${kind}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("order-proofs")
      .upload(path, bytes, { contentType: `image/${match[1]}`, upsert: false });
    if (upErr) throw new Error("La photo n'a pas pu être envoyée. Réessayez.");

    const db = createAdminClient();
    const { error } = await db.from("order_proofs" as never).insert({
      order_id: orderId,
      kind,
      path,
      uploaded_by: user.id,
    } as never);
    if (error) throw new Error(error.message);
    await db.from("order_events" as never).insert({
      order_id: orderId,
      event_type: "proof_added",
      actor_id: user.id,
      actor_role: user.id === o.client_id ? "client" : user.id === o.tailor_id ? "tailor" : "vendor",
      new_value: kind,
      proof_path: path,
    } as never);
    revalidateOrder(orderId);
  });
}

// --- JALOFA -------------------------------------------------------------------

async function adminOnly() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connectez-vous.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "admin") throw new Error("Action non autorisée.");
  return { supabase, db: createAdminClient(), userId: user.id };
}

/**
 * JALOFA tranche une demande d'annulation. Acceptée : la proposition calculée
 * par `proposeSettlement` (35 % de la couture après découpe autorisée, trajets
 * effectués, retour) est inscrite au registre et le remboursement passe « à
 * faire ». Refusée : la commande est débloquée ; les délais repartent de l'état
 * réel (les horodatages n'ont jamais bougé).
 */
export async function adminDecideCancellation(input: {
  requestId: string;
  accept: boolean;
  reason: string;
  /** Coût réel du retour du tissu, justifié ; null si sans objet. */
  returnFee: number | null;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    const { supabase, db } = await adminOnly();
    const reason = input.reason.trim();
    if (!reason) throw new Error("Indiquez le motif de la décision.");

    const { data: request } = await db
      .from("order_cancellations" as never)
      .select("id, order_id, status")
      .eq("id", input.requestId)
      .single();
    const req = request as { id: string; order_id: string; status: string } | null;
    if (!req || req.status !== "pending") throw new Error("Cette demande a déjà été traitée.");

    let refund = 0;
    let lines: unknown[] = [];
    if (input.accept) {
      const { data: row } = await db.from("orders").select("*").eq("id", req.order_id).single();
      const [order] = await withCancellations(supabase, [row as unknown as Order]);
      const fee = input.returnFee == null || !Number.isFinite(input.returnFee) ? null : Math.max(0, Math.round(input.returnFee));
      const proposal = proposeSettlement(toWorkflowOrder(order), { returnFee: fee });
      if (proposal.flags.includes("return_fee_missing")) {
        throw new Error("Le tissu a voyagé : indiquez le coût réel du retour (0 si le client le récupère lui-même).");
      }
      if (proposal.flags.includes("deductions_exceed_payment")) {
        throw new Error("Les retenues dépassent ce que le client a payé : arbitrage manuel nécessaire.");
      }
      refund = proposal.refund;
      lines = proposal.lines.map((l) => ({ party: l.party, party_id: l.partyId ?? "", kind: l.kind, amount: l.amount }));
    }

    await rpc(supabase)
      .rpc("decide_order_cancellation", {
        p_request_id: req.id,
        p_accept: input.accept,
        p_reason: reason,
        p_refund: refund,
        p_return_fee: input.returnFee,
        p_lines: lines,
      })
      .then(({ error }) => {
        if (error) throw new Error(error.message);
      });
    revalidateOrder(req.order_id);
  });
}

/**
 * JALOFA a remboursé le client (tout ou partie). La clé d'idempotence vient du
 * formulaire : un double clic n'enregistre qu'un seul remboursement.
 */
export async function adminRecordRefund(input: {
  orderId: string;
  amount: number;
  externalRef: string | null;
  idempotencyKey: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    const { supabase } = await adminOnly();
    if (!/^[\w-]{8,80}$/.test(input.idempotencyKey)) throw new Error("Clé de requête invalide.");
    const { error } = await rpc(supabase).rpc("record_order_refund", {
      p_order_id: input.orderId,
      p_amount: Math.round(input.amount),
      p_external_ref: input.externalRef?.trim() || null,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw new Error(error.message);
    revalidateOrder(input.orderId);
  });
}

/**
 * JALOFA a versé à un pro ce qui lui reste dû. Les montants sont RECALCULÉS ici
 * (`getPayoutBoard`), jamais repris du navigateur ; `record_payout` n'inscrit
 * chaque commande qu'une fois par métier, même si on clique deux fois.
 */
export async function adminRecordPayout(input: {
  proId: string;
  role: "tailor" | "vendor";
  method: string;
  reference: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    const { supabase } = await adminOnly();
    const reference = input.reference.trim();
    if (!reference) throw new Error("Indiquez la référence du virement (Wave, Orange Money…).");
    const { getPayoutBoard } = await import("@/lib/payouts-data");
    const board = await getPayoutBoard();
    const row = (input.role === "vendor" ? board.vendors : board.tailors).find((r) => r.id === input.proId);
    if (!row || row.lines.length === 0) throw new Error("Rien à verser à ce pro.");

    const { error } = await rpc(supabase).rpc("record_payout", {
      p_pro_id: input.proId,
      p_role: input.role,
      p_method: input.method.trim().slice(0, 100) || null,
      p_reference: reference.slice(0, 200),
      p_lines: row.lines.map((l) => ({ order_id: l.orderId, amount: l.amount })),
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

/**
 * Rembourse via Bictorys. L'API documentée ne rembourse que la TRANSACTION
 * ENTIÈRE (aucun montant) : on ne l'appelle que si la transaction ne couvre
 * que cette commande et que tout le payé est dû. Sinon, remboursement à la
 * main (Wave / Orange Money) puis « Marquer remboursé ».
 */
export async function adminRefundViaBictorys(orderId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    const { supabase, db } = await adminOnly();
    const { data: row } = await db
      .from("orders")
      .select("amount_paid, total_amount, payment_id, status" as "status")
      .eq("id", orderId)
      .single();
    const o = row as unknown as
      | { amount_paid: number | null; total_amount: number; payment_id: string | null; status: string }
      | null;
    if (!o?.payment_id) throw new Error("Cette commande n'a pas de paiement Bictorys.");

    const [{ data: pay }, { count }, { data: cancellation }, { data: refunds }] = await Promise.all([
      db.from("payments" as never).select("provider, provider_ref, status").eq("id", o.payment_id).single(),
      db.from("orders").select("id", { count: "exact", head: true }).eq("payment_id" as never, o.payment_id),
      db
        .from("order_cancellations" as never)
        .select("refund_amount")
        .eq("order_id", orderId)
        .eq("status", "accepted")
        .order("decided_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.from("order_ledger" as never).select("amount").eq("order_id", orderId).eq("entry_type", "refund"),
    ]);
    const p = pay as { provider: string; provider_ref: string | null; status: string } | null;
    if (p?.provider !== "bictorys" || !p.provider_ref || p.status !== "paid") {
      throw new Error("Paiement Bictorys introuvable ou pas encore confirmé.");
    }
    if ((count ?? 0) !== 1) {
      throw new Error("Ce paiement couvre plusieurs commandes : remboursez à la main, puis « Marquer remboursé ».");
    }
    const paid = Math.round(Number(o.amount_paid ?? o.total_amount));
    const decided = (cancellation as { refund_amount: number | null } | null)?.refund_amount;
    const due = decided != null ? Math.round(Number(decided)) : paid;
    const done = ((refunds ?? []) as { amount: number }[]).reduce((s, r) => s + Number(r.amount), 0);
    if (done > 0 || due !== paid) {
      throw new Error("Remboursement partiel : Bictorys ne le permet pas. Faites-le à la main, puis « Marquer remboursé ».");
    }

    await refundTransaction(p.provider_ref);
    const { error } = await rpc(supabase).rpc("record_order_refund", {
      p_order_id: orderId,
      p_amount: paid,
      p_external_ref: `bictorys:${p.provider_ref}`,
      p_idempotency_key: `bictorys-${p.provider_ref}`,
    });
    if (error) throw new Error(`Bictorys a remboursé, mais l'enregistrement a échoué : ${error.message}`);
    revalidateOrder(orderId);
  });
}

/**
 * JALOFA a appelé le vendeur dont le tailleur a déclaré avoir reçu le tissu.
 * Confirmé : l'argent du tissu est libéré. Démenti : il reste bloqué.
 */
export async function adminVerifyVendorShipment(
  orderId: string,
  confirmed: boolean,
  note = "",
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    const { supabase } = await adminOnly();
    const { error } = await rpc(supabase).rpc("verify_vendor_fabric_shipment", {
      p_order_id: orderId,
      p_confirmed: confirmed,
      p_note: note.trim().slice(0, 500) || null,
    });
    if (error) throw new Error(error.message);
    revalidateOrder(orderId);
  });
}

/** Litige : JALOFA gèle (ou dégèle) toute intervention sur la commande. */
export async function adminSetHold(orderId: string, hold: boolean, reason: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  return runAction(async () => {
    const { supabase } = await adminOnly();
    if (!reason.trim()) throw new Error("Indiquez le motif.");
    const { error } = await rpc(supabase).rpc("set_order_hold", {
      p_order_id: orderId,
      p_hold: hold,
      p_reason: reason.trim(),
    });
    if (error) throw new Error(error.message);
    revalidateOrder(orderId);
  });
}
