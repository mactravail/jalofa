import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Les règles PURES de l'intégration Bictorys (testées par
 * `bictorys-core.test.ts`) : authentification du webhook, lecture d'une
 * transaction, contrôle du montant, format du téléphone. Aucun accès réseau ni
 * variable d'environnement ici — cf. `bictorys.ts`.
 */

/** « 77 123 45 67 » → « +221771234567 » (format exigé par Bictorys). */
export function bictorysPhone(phone: string | null | undefined): string | undefined {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `221${digits}`;
  return `+${digits}`;
}

/** Une transaction telle que Bictorys la décrit (champs utiles seulement). */
export type BictorysTransaction = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentReference: string | null;
  merchantReference: string | null;
  merchantFees: number | null;
  customerFees: number | null;
  pspName: string | null;
};

export function readTransaction(raw: Record<string, unknown>): BictorysTransaction | null {
  const id = raw.id ?? raw.transactionId;
  if (typeof id !== "string" || !id) return null;
  const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    id,
    status: String(raw.status ?? "").toLowerCase(),
    amount: num(raw.amount) ?? 0,
    currency: String(raw.currency ?? "XOF").toUpperCase(),
    paymentReference: (raw.paymentReference as string | undefined) ?? null,
    merchantReference: (raw.merchantReference as string | undefined) ?? null,
    merchantFees: num(raw.merchantFees),
    customerFees: num(raw.customerFees),
    pspName: (raw.pspName as string | undefined) ?? null,
  };
}

/** Les statuts lus dans la documentation (anglais du webhook, français de la page statuts). */
export const SUCCESS_STATUSES = new Set(["succeeded", "authorized", "succès", "réussi"]);
export const FAILED_STATUSES = new Set(["failed", "cancelled", "échoué", "expiré", "expired", "reversed"]);

/**
 * Le montant Bictorys correspond-il à notre paiement ? Selon la page lue, le
 * montant inclut les frais du client (s'il les supporte) ou est net des frais
 * du marchand : on accepte ces trois lectures, rien d'autre. Devise XOF exigée.
 */
export function amountMatches(expected: number, tx: BictorysTransaction): boolean {
  if (tx.currency !== "XOF") return false;
  const candidates = [
    tx.amount,
    tx.amount - (tx.customerFees ?? 0),
    tx.amount + (tx.merchantFees ?? 0),
  ].map((v) => Math.round(v));
  return candidates.includes(Math.round(expected));
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * Le webhook vient-il de Bictorys ? Si `X-Webhook-Signature` est envoyé (HMAC
 * activé), la signature HMAC-SHA256 de `${timestamp}.${corps brut}` doit être
 * juste et le timestamp récent (5 min). Sinon `X-Secret-Key` doit valoir notre
 * secret (méthode officielle).
 */
export function verifyWebhookWith(
  secret: string | undefined,
  rawBody: string,
  headers: Headers,
  now: number,
): boolean {
  if (!secret) return false;

  const signature = headers.get("x-webhook-signature");
  if (signature) {
    const timestamp = headers.get("x-webhook-timestamp") ?? "";
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60_000) return false;
    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    return safeEqual(expected, signature.trim().toLowerCase());
  }

  const header = headers.get("x-secret-key");
  return Boolean(header) && safeEqual(header!, secret);
}
