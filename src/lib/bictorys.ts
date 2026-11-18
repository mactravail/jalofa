import "server-only";

import {
  bictorysPhone,
  readTransaction,
  verifyWebhookWith,
  type BictorysTransaction,
} from "@/lib/bictorys-core";
import { DIRECT_PAYMENT } from "@/lib/constants";

export {
  FAILED_STATUSES,
  SUCCESS_STATUSES,
  amountMatches,
  bictorysPhone,
  readTransaction,
  type BictorysTransaction,
} from "@/lib/bictorys-core";

/**
 * Bictorys — paiement des commandes (Wave, Orange Money, carte…), d'après
 * https://docs.bictorys.com/docs/integration (lu le 2026-11-13).
 *
 * Flux « Checkout » (page de paiement hébergée par Bictorys) :
 *   1. `createCheckoutCharge` → Bictorys renvoie le lien de paiement ;
 *   2. le client paie chez Bictorys, qui le renvoie sur `successRedirectUrl`
 *      ou `errorRedirectUrl` — ces retours ne prouvent RIEN ;
 *   3. Bictorys appelle notre webhook. On vérifie le secret (`X-Secret-Key`,
 *      et la signature HMAC quand elle est envoyée), puis on RELIT la
 *      transaction chez Bictorys (`getTransaction`) : c'est elle qui fait foi.
 *
 * Variables d'environnement (serveur uniquement, jamais dans le dépôt) :
 *   BICTORYS_API_URL        https://api.test.bictorys.com (test) | https://api.bictorys.com (live)
 *   BICTORYS_PUBLIC_KEY     clé publique (paiements, statut)
 *   BICTORYS_SECRET_KEY     clé secrète (remboursements ; payouts plus tard)
 *   BICTORYS_WEBHOOK_SECRET « Secret Key » saisie avec l'URL du webhook
 *
 * Points NON confirmés par la documentation (à vérifier avec Bictorys avant le
 * live) : remboursement partiel, split payment, séquestre, idempotence des
 * paiements et des remboursements, casse exacte de `errorRedirectUrl`.
 */

const DEFAULT_TEST_URL = "https://api.test.bictorys.com";

export function isBictorysConfigured(): boolean {
  // Paiement direct au pro : on n'encaisse rien, même si les clés sont là.
  if (DIRECT_PAYMENT) return false;
  return Boolean(process.env.BICTORYS_PUBLIC_KEY && process.env.BICTORYS_WEBHOOK_SECRET);
}

function baseUrl(): string {
  return (process.env.BICTORYS_API_URL || DEFAULT_TEST_URL).replace(/\/$/, "");
}

function key(kind: "public" | "secret"): string {
  const value = kind === "public" ? process.env.BICTORYS_PUBLIC_KEY : process.env.BICTORYS_SECRET_KEY;
  if (!value) throw new Error(`Bictorys n'est pas configuré (clé ${kind === "public" ? "publique" : "secrète"} manquante).`);
  return value;
}

/** Le pare-feu Bictorys renvoie un 403 HTML quand on va trop vite : on réessaie. */
async function call(path: string, init: RequestInit & { keyKind: "public" | "secret" }): Promise<Response> {
  const { keyKind, ...rest } = init;
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...rest,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-Api-Key": key(keyKind),
        ...(rest.headers ?? {}),
      },
    });
    const isWafBlock =
      res.status === 403 && !(res.headers.get("content-type") ?? "").includes("application/json");
    if (!isWafBlock) return res;
    last = res;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
  return last!;
}

export type CheckoutChargeInput = {
  /** FCFA, entier, minimum 100. */
  amount: number;
  /** Notre id de paiement : revient dans le webhook (`paymentReference`). */
  paymentReference: string;
  customer: { name: string; email: string; phone: string | null };
  successUrl: string;
  errorUrl: string;
};

export type CheckoutCharge = { link: string; chargeId: string | null };

/**
 * Le pare-feu Bictorys refuse (403 HTML) toute demande dont les liens de retour
 * visent une adresse locale (`localhost`, `127.0.0.1`, réseau `192.168.…`) :
 * en test sur la machine, aucun paiement ne s'ouvrait. On remplace alors
 * l'origine par `BICTORYS_RETURN_ORIGIN` (ex. un tunnel https vers la machine),
 * à défaut par le site en ligne.
 */
function publicReturnUrl(url: string): string {
  const u = new URL(url);
  const local =
    u.hostname === "localhost" ||
    /^127\./.test(u.hostname) ||
    /^10\./.test(u.hostname) ||
    /^192\.168\./.test(u.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname) ||
    u.hostname.endsWith(".local");
  if (!local) return url;
  const base = new URL(process.env.BICTORYS_RETURN_ORIGIN || "https://jalofa.com");
  u.protocol = base.protocol;
  u.host = base.host;
  return u.toString();
}

export async function createCheckoutCharge(input: CheckoutChargeInput): Promise<CheckoutCharge> {
  if (!Number.isInteger(input.amount) || input.amount < 100) {
    throw new Error("Montant minimum Bictorys : 100 FCFA.");
  }
  const successUrl = publicReturnUrl(input.successUrl);
  const errorUrl = publicReturnUrl(input.errorUrl);
  const res = await call("/pay/v1/charges", {
    keyKind: "public",
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "XOF",
      country: "SN",
      paymentReference: input.paymentReference,
      merchantReference: input.paymentReference,
      successRedirectUrl: successUrl,
      // La doc écrit les deux casses : on envoie les deux.
      errorRedirectUrl: errorUrl,
      ErrorRedirectUrl: errorUrl,
      customerObject: {
        name: input.customer.name,
        email: input.customer.email,
        phone: bictorysPhone(input.customer.phone),
        country: "SN",
      },
    }),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    console.error("[bictorys charge]", res.status, json);
    throw new Error("Le paiement n'a pas pu être ouvert. Réessayez.");
  }
  const link = (json.link ?? json.redirectUrl) as string | undefined;
  if (!link) {
    console.error("[bictorys charge] pas de lien", json);
    throw new Error("Le paiement n'a pas pu être ouvert. Réessayez.");
  }
  return {
    link,
    chargeId: ((json.chargeId ?? json.transactionId ?? null) as string | null) ?? null,
  };
}

/**
 * Retrouve la transaction qui porte notre référence de paiement. Constaté le
 * 2026-11-13 en test : la lecture des transactions exige la clé SECRÈTE (la
 * publique → 403 « Access right not sufficient »), l'id de charge renvoyé à la
 * création n'est PAS l'id de transaction, et les filtres de la liste sont
 * ignorés — on filtre donc nous-mêmes sur `paymentReference`.
 */
export async function findTransactionByReference(reference: string): Promise<BictorysTransaction | null> {
  const res = await call(`/pay/v1/transactions?paymentReference=${encodeURIComponent(reference)}`, {
    keyKind: "secret",
    method: "GET",
  });
  if (!res.ok) {
    console.error("[bictorys transactions]", res.status);
    return null;
  }
  const json = (await res.json().catch(() => null)) as unknown;
  const list = Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: unknown } | null)?.content)
      ? (json as { content: unknown[] }).content
      : [];
  const match = (list as Record<string, unknown>[]).find(
    (t) => t.paymentReference === reference || t.merchantReference === reference,
  );
  // Relue une à une : c'est la fiche de la transaction qui fait foi.
  return match && typeof match.id === "string" ? getTransaction(match.id) : null;
}

/** Relit une transaction chez Bictorys : la seule source qui fait foi. */
export async function getTransaction(transactionId: string): Promise<BictorysTransaction | null> {
  const res = await call(`/pay/v1/transactions/${encodeURIComponent(transactionId)}`, {
    keyKind: "secret",
    method: "GET",
  });
  if (!res.ok) {
    console.error("[bictorys transaction]", res.status);
    return null;
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return json ? readTransaction(json) : null;
}

/** Authentifie un webhook avec notre secret (cf. `verifyWebhookWith`). */
export function verifyWebhook(rawBody: string, headers: Headers, now: number = Date.now()): boolean {
  return verifyWebhookWith(process.env.BICTORYS_WEBHOOK_SECRET, rawBody, headers, now);
}

/**
 * Rembourse une transaction (PUT …/refund, réponse 202). La documentation ne
 * prévoit pas de montant : c'est un remboursement TOTAL de la transaction.
 */
export async function refundTransaction(transactionId: string): Promise<void> {
  const res = await call(`/pay/v1/transactions/${encodeURIComponent(transactionId)}/refund`, {
    keyKind: "secret",
    method: "PUT",
  });
  if (res.status !== 202 && !res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[bictorys refund]", res.status, body);
    throw new Error("Bictorys a refusé le remboursement. Faites-le à la main.");
  }
}
