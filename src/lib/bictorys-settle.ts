import "server-only";

import {
  FAILED_STATUSES,
  SUCCESS_STATUSES,
  amountMatches,
  findTransactionByReference,
  getTransaction,
  readTransaction,
  type BictorysTransaction,
} from "@/lib/bictorys";
import { renewProFromSale } from "@/lib/pro-subscription";
import { createAdminClient } from "@/lib/supabase/admin";

type Rpc = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SettleResult = "paid" | "failed" | "pending" | "ignored" | "amount_mismatch";

/**
 * Traite un événement Bictorys DÉJÀ authentifié (`verifyWebhook`). La
 * transaction est relue chez Bictorys ; à défaut (API indisponible), on s'en
 * tient au corps authentifié. Idempotent : un webhook rejoué ne paie rien deux
 * fois (`confirm_payment` sort si le paiement est déjà réglé).
 */
export async function settleBictorysEvent(payload: Record<string, unknown>): Promise<SettleResult> {
  const fromWebhook = readTransaction(payload);
  if (!fromWebhook) return "ignored";
  const tx = (await getTransaction(fromWebhook.id)) ?? fromWebhook;

  const paymentId = [tx.paymentReference, tx.merchantReference, fromWebhook.paymentReference, fromWebhook.merchantReference].find(
    (v): v is string => typeof v === "string" && UUID.test(v),
  );
  if (!paymentId) return "ignored";
  return settlePayment(paymentId, tx);
}

/**
 * Le client revient de la page Bictorys : on relit nous-mêmes la transaction
 * (le webhook peut tarder, ou ne pas joindre un poste de développement). La
 * relecture vient de l'API Bictorys : elle fait foi, pas l'URL de retour.
 */
export async function reconcilePayment(paymentId: string): Promise<SettleResult> {
  if (!UUID.test(paymentId)) return "ignored";
  const db = createAdminClient();
  const { data } = await db
    .from("payments" as never)
    .select("status, provider, provider_charge_id")
    .eq("id", paymentId)
    .maybeSingle();
  const p = data as { status: string; provider: string; provider_charge_id: string | null } | null;
  if (!p || p.provider !== "bictorys" || p.status !== "pending") return "ignored";
  // L'id de charge n'est pas un id de transaction : on cherche par notre référence.
  const tx = await findTransactionByReference(paymentId);
  if (!tx) return "pending";
  // La transaction doit bien porter notre référence.
  if (tx.paymentReference && tx.paymentReference !== paymentId && tx.merchantReference !== paymentId) {
    return "ignored";
  }
  return settlePayment(paymentId, tx);
}

/** Moyen utilisé chez Bictorys → nos libellés de paiement. */
function paymentMethodOf(pspName: string | null): string | null {
  if (!pspName) return null;
  if (pspName.startsWith("wave")) return "wave";
  if (pspName.startsWith("orange") || pspName === "maxit") return "orange_money";
  if (pspName.startsWith("free")) return "free_money";
  if (pspName === "card") return "card";
  return null;
}

async function settlePayment(paymentId: string, tx: BictorysTransaction): Promise<SettleResult> {

  const db = createAdminClient();
  const { data } = await db
    .from("payments" as never)
    .select("id, amount, status, provider")
    .eq("id", paymentId)
    .maybeSingle();
  const payment = data as { id: string; amount: number; status: string; provider: string } | null;
  if (!payment || payment.provider !== "bictorys") return "ignored";
  if (payment.status === "paid") return "paid";

  if (SUCCESS_STATUSES.has(tx.status)) {
    if (!amountMatches(Number(payment.amount), tx)) {
      console.error("[bictorys] montant inattendu", { paymentId, expected: payment.amount, tx });
      return "amount_mismatch";
    }
    const { error } = await (db as unknown as Rpc).rpc("confirm_payment", {
      p_payment_id: payment.id,
      p_provider_ref: tx.id,
      p_amount: Number(payment.amount),
      p_currency: "XOF",
      p_provider_fee: tx.merchantFees,
      p_customer_fee: tx.customerFees,
      p_provider_status: tx.status,
    });
    if (error) throw new Error(error.message);

    const method = paymentMethodOf(tx.pspName);
    if (method) {
      await db.from("orders").update({ payment_method: method } as never).eq("payment_id" as never, payment.id);
    }

    // Offre Pro échue : la vente rouvre un mois (comme le paiement manuel).
    const { data: orders } = await db.from("orders").select("tailor_id, vendor_id").eq("payment_id" as never, payment.id);
    await renewProFromSale(
      ((orders ?? []) as { tailor_id: string | null; vendor_id: string | null }[]).flatMap((o) => [o.tailor_id, o.vendor_id]),
    );
    return "paid";
  }

  if (FAILED_STATUSES.has(tx.status)) {
    const { error } = await (db as unknown as Rpc).rpc("fail_payment", {
      p_payment_id: payment.id,
      p_provider_status: tx.status,
    });
    if (error) throw new Error(error.message);
    return "failed";
  }

  return "pending";
}
