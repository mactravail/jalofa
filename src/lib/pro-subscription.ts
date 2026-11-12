import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

import {
  confirmInvoice,
  createInvoice,
  isPaydunyaConfigured,
  type InvoiceStatus,
} from "@/lib/paydunya";
import {
  isLaunchPromoOpen,
  LAUNCH_PROMO_END,
  LAUNCH_PROMO_SLOTS,
} from "@/lib/launch-promo";
import { getPlan, PAID_PLAN_ID } from "@/lib/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * L'abonnement **Pro** payé via PayDunya. Tout passe par la clé de service :
 * `plan` / `plan_expires_at` sont des colonnes privilégiées (cf. migration
 * 20260804000001) qu'aucun utilisateur ne peut se donner lui-même.
 */

/** La page « Mon offre » où PayDunya renvoie le pro après paiement. */
export const OFFER_PAGE = "/tailleur/espace/offre";

/** Origine publique du site (https://jalofa.com en prod, localhost en dev). */
export async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && !fromEnv.includes("localhost")) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "jalofa.com";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Client service-role non typé : la table `subscription_payments` est récente. */
function db(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

export type ProBuyer = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

/**
 * Ouvre une facture PayDunya d'un mois d'abonnement Pro et renvoie l'URL de la
 * page de paiement. `null` si PayDunya n'est pas configuré.
 */
export async function startProCheckout(buyer: ProBuyer): Promise<string | null> {
  if (!isPaydunyaConfigured()) return null;
  const plan = getPlan(PAID_PLAN_ID);
  if (!plan) return null;

  const admin = db();
  const { data: payment, error } = await admin
    .from("subscription_payments")
    .insert({ pro_id: buyer.id, plan: plan.id, months: 1, amount: plan.monthlyPrice })
    .select("id")
    .single();
  if (error || !payment) {
    throw new Error(`Paiement non enregistré : ${error?.message ?? "inconnu"}`);
  }

  const origin = await siteOrigin();
  const invoice = await createInvoice({
    amount: plan.monthlyPrice,
    description: `Abonnement JALOFA ${plan.name} — 1 mois`,
    customer: { name: buyer.name, email: buyer.email, phone: buyer.phone },
    customData: { payment_id: payment.id as string, pro_id: buyer.id },
    returnUrl: `${origin}${OFFER_PAGE}`,
    cancelUrl: `${origin}${OFFER_PAGE}?annule=1`,
    callbackUrl: `${origin}/api/paydunya/ipn`,
  });

  await admin
    .from("subscription_payments")
    .update({ token: invoice.token })
    .eq("id", payment.id);

  return invoice.checkoutUrl;
}

/**
 * Ajoute un mois d'offre Pro au frais différé du pro (`provider = 'sale'`,
 * `status = 'deferred'`), retenu sur ses reversements (cf. `applyDeferredFees`).
 * Une seule ligne différée ouverte par pro (index unique) : on la grossit.
 */
async function addDeferredMonth(admin: SupabaseClient, proId: string): Promise<void> {
  const plan = getPlan(PAID_PLAN_ID);
  if (!plan) throw new Error("Offre Pro introuvable");

  const { data: open } = await admin
    .from("subscription_payments")
    .select("id, months, amount")
    .eq("pro_id", proId)
    .eq("status", "deferred")
    .maybeSingle();

  const { error } = open
    ? await admin
        .from("subscription_payments")
        .update({
          months: (Number(open.months) || 0) + 1,
          amount: Number(open.amount ?? 0) + plan.monthlyPrice,
        })
        .eq("id", open.id)
    : await admin.from("subscription_payments").insert({
        pro_id: proId,
        plan: plan.id,
        months: 1,
        amount: plan.monthlyPrice,
        provider: "sale",
        status: "deferred",
      });
  if (error) throw new Error(`Frais différé non enregistré : ${error.message}`);
}

/**
 * Renouvellement de l'offre Pro sur les ventes : le 1er mois a été payé à
 * l'inscription ; ensuite, quand un mois Pro est échu, la première commande
 * payée du pro ouvre un nouveau mois (à partir d'aujourd'hui) et son prix est
 * retenu sur le reversement — sauf s'il l'a déjà payé en mobile money (son
 * échéance est alors dans le futur). Rien ne se
 * passe si le pro a arrêté son offre (`plan_auto_renew = false`).
 *
 * Appelé après chaque paiement de commande ; ne lève jamais — une erreur ici ne
 * doit pas faire échouer l'achat du client.
 */
export async function renewProFromSale(
  proIds: (string | null | undefined)[],
): Promise<void> {
  const ids = [...new Set(proIds.filter((id): id is string => !!id))];
  if (!ids.length) return;
  let admin: SupabaseClient;
  try {
    admin = db();
  } catch {
    return; // pas de clé de service (démo) : rien à renouveler
  }

  for (const proId of ids) {
    try {
      const row = await currentPlanRow(admin, proId);
      if (row.plan !== PAID_PLAN_ID || !row.autoRenew || !row.table) continue;
      // Sans échéance = offre accordée sans limite (admin) : rien à facturer.
      if (!row.expiresAt || new Date(row.expiresAt).getTime() > Date.now()) continue;

      // Verrou : seule la commande qui fait bouger l'échéance facture le mois
      // (deux paiements simultanés n'en facturent qu'un).
      const expires = addMonths(new Date(), 1).toISOString();
      const { data: claimed } = await admin
        .from(row.table)
        .update({ plan_expires_at: expires })
        .eq("id", proId)
        .eq("plan", PAID_PLAN_ID)
        .eq("plan_expires_at", row.expiresAt)
        .select("id");
      if (!claimed?.length) continue;

      const other = row.table === "tailors" ? "vendors" : "tailors";
      await admin
        .from(other)
        .update({ plan: PAID_PLAN_ID, plan_expires_at: expires })
        .eq("id", proId);
      await addDeferredMonth(admin, proId);
    } catch (err) {
      console.error("[pro renew from sale]", err);
    }
  }
}

/**
 * Places restantes de l'offre de lancement (cf. `launch-promo.ts`). Une place
 * prise = un atelier dont l'offre Pro expire exactement à `LAUNCH_PROMO_END`.
 * 0 si la promo est finie ou si la base est injoignable.
 */
export async function launchPromoSlotsLeft(): Promise<number> {
  if (!isLaunchPromoOpen()) return 0;
  try {
    const { count, error } = await db()
      .from("tailors")
      .select("id", { count: "exact", head: true })
      .eq("plan", PAID_PLAN_ID)
      .eq("plan_expires_at", LAUNCH_PROMO_END);
    if (error) return 0;
    return Math.max(0, LAUNCH_PROMO_SLOTS - (count ?? 0));
  } catch {
    return 0; // pas de clé de service (démo)
  }
}

/**
 * Donne l'offre Pro jusqu'au 1er décembre à un pro qui vient de s'inscrire, s'il
 * reste une place. Rien à payer maintenant : à l'échéance, son premier mois
 * repart sur sa première vente (`renewProFromSale`). Renvoie `true` si la
 * place est attribuée. Deux inscriptions simultanées sur la 100e place peuvent
 * en prendre une de trop — sans gravité pour une promo.
 */
export async function grantLaunchPromo(proId: string): Promise<boolean> {
  if ((await launchPromoSlotsLeft()) <= 0) return false;
  const admin = db();
  const patch = { plan: PAID_PLAN_ID, plan_expires_at: LAUNCH_PROMO_END };
  const [tailor] = await Promise.all([
    admin.from("tailors").update(patch).eq("id", proId).select("id"),
    admin.from("vendors").update(patch).eq("id", proId),
  ]);
  return !tailor.error && (tailor.data?.length ?? 0) > 0;
}

/**
 * Sélection JALOFA (cf. `selection.ts`) : l'accès PRO offert, **sans échéance**,
 * à un pro qui vient de candidater. Sans échéance, `renewProFromSale` ne
 * facture jamais rien et le plan Pro ne prend aucune commission. Renvoie `true`
 * si l'atelier a bien été mis à jour.
 */
export async function grantSelectionAccess(proId: string): Promise<boolean> {
  const admin = db();
  const patch = { plan: PAID_PLAN_ID, plan_expires_at: null };
  const [tailor] = await Promise.all([
    admin.from("tailors").update(patch).eq("id", proId).select("id"),
    admin.from("vendors").update(patch).eq("id", proId),
  ]);
  return !tailor.error && (tailor.data?.length ?? 0) > 0;
}

/** « Sans engagement » : arrêter (ou reprendre) le renouvellement de l'offre Pro. */
export async function setProAutoRenew(proId: string, on: boolean): Promise<void> {
  const admin = db();
  const results = await Promise.all([
    admin.from("tailors").update({ plan_auto_renew: on }).eq("id", proId),
    admin.from("vendors").update({ plan_auto_renew: on }).eq("id", proId),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

/** Le frais d'offre Pro encore dû par un pro (0 s'il n'a rien à payer). */
export async function readDeferredFee(proId: string): Promise<number> {
  const { data } = await db()
    .from("subscription_payments")
    .select("amount")
    .eq("pro_id", proId)
    .eq("status", "deferred");
  return (data ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
}

/** Tous les frais différés ouverts, par pro — pour les reversements de l'admin. */
export async function readDeferredFees(): Promise<Map<string, number>> {
  const dues = new Map<string, number>();
  const { data, error } = await db()
    .from("subscription_payments")
    .select("pro_id, amount")
    .eq("status", "deferred");
  if (error) return dues; // migration pas encore appliquée : rien de différé
  for (const r of data ?? []) {
    const id = r.pro_id as string;
    dues.set(id, (dues.get(id) ?? 0) + Number(r.amount ?? 0));
  }
  return dues;
}

type PlanRow = {
  plan: string;
  expiresAt: string | null;
  /** Le pro n'a pas arrêté son offre (vrai tant que la colonne n'existe pas). */
  autoRenew: boolean;
  table: "tailors" | "vendors" | null;
};

/** Le plan en cours du pro — lu sur l'atelier, sinon sur la boutique de tissus. */
async function currentPlanRow(admin: SupabaseClient, proId: string): Promise<PlanRow> {
  for (const table of ["tailors", "vendors"] as const) {
    let { data, error } = await admin
      .from(table)
      .select("plan, plan_expires_at, plan_auto_renew")
      .eq("id", proId)
      .maybeSingle();
    // Migration 20260815000001 pas encore appliquée : sans la colonne.
    if (error?.code === "42703") {
      ({ data, error } = await admin
        .from(table)
        .select("plan, plan_expires_at")
        .eq("id", proId)
        .maybeSingle());
    }
    if (data) {
      return {
        plan: (data.plan as string) ?? "free",
        expiresAt: (data.plan_expires_at as string | null) ?? null,
        autoRenew: (data as { plan_auto_renew?: boolean }).plan_auto_renew !== false,
        table,
      };
    }
  }
  return { plan: "free", expiresAt: null, autoRenew: true, table: null };
}

function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Règle une facture : interroge PayDunya (seule source de vérité) et, si elle
 * est payée, passe le pro sur l'offre Pro. Idempotent — l'IPN et le retour du
 * navigateur peuvent arriver tous les deux, l'abonnement n'est prolongé qu'une
 * fois. Renvoie l'état de la facture (`null` si le token est inconnu).
 */
export async function settleProPayment(
  token: string,
): Promise<InvoiceStatus | null> {
  if (!isPaydunyaConfigured() || !token) return null;
  const admin = db();

  const { data: payment } = await admin
    .from("subscription_payments")
    .select("id, pro_id, plan, months, amount, status")
    .eq("token", token)
    .maybeSingle();
  if (!payment) return null;
  if (payment.status === "completed") return "completed";

  const invoice = await confirmInvoice(token);

  if (invoice.status !== "completed") {
    if (invoice.status === "cancelled" || invoice.status === "failed") {
      await admin
        .from("subscription_payments")
        .update({ status: invoice.status })
        .eq("id", payment.id)
        .eq("status", "pending");
    }
    return invoice.status;
  }

  // Montant ou facture qui ne correspondent pas : on ne donne rien.
  if (
    invoice.amount < Number(payment.amount) ||
    String(invoice.customData.payment_id ?? "") !== String(payment.id)
  ) {
    await admin
      .from("subscription_payments")
      .update({ status: "failed" })
      .eq("id", payment.id)
      .eq("status", "pending");
    return "failed";
  }

  // Verrou : seule la première confirmation passe la ligne en « completed ».
  const { data: claimed } = await admin
    .from("subscription_payments")
    .update({ status: "completed", paid_at: new Date().toISOString() })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id");
  if (!claimed?.length) return "completed";

  // Un frais différé ouvert (mois déjà accordés, pas encore retenus sur une
  // vente) est réglé en priorité : ces mois-là sont déjà actifs, le paiement
  // les solde au lieu d'en ajouter.
  const paidMonths = Number(payment.months) || 1;
  let alreadyGranted = 0;
  const { data: open } = await admin
    .from("subscription_payments")
    .select("id, months, amount")
    .eq("pro_id", payment.pro_id)
    .eq("status", "deferred")
    .maybeSingle();
  if (open) {
    const owedMonths = Number(open.months) || 1;
    alreadyGranted = Math.min(paidMonths, owedMonths);
    const leftMonths = owedMonths - alreadyGranted;
    const perMonth = Number(open.amount ?? 0) / owedMonths;
    await admin
      .from("subscription_payments")
      .update(
        leftMonths > 0
          ? { months: leftMonths, amount: Math.round(perMonth * leftMonths) }
          : { status: "cancelled" },
      )
      .eq("id", open.id)
      .eq("status", "deferred");
  }
  const extraMonths = Math.max(0, paidMonths - alreadyGranted);

  // Prolonge l'abonnement à partir de l'échéance en cours (si encore active).
  const shop = await currentPlanRow(admin, payment.pro_id as string);
  const current =
    shop.plan === payment.plan && shop.expiresAt ? new Date(shop.expiresAt) : null;
  const active = current && current.getTime() > Date.now() ? current : null;
  if (active && extraMonths === 0) return "completed";
  const expires = addMonths(active ?? new Date(), active ? extraMonths : Number(payment.months) || 1).toISOString();

  const patch = { plan: payment.plan, plan_expires_at: expires };
  await Promise.all([
    admin.from("tailors").update(patch).eq("id", payment.pro_id),
    admin.from("vendors").update(patch).eq("id", payment.pro_id),
  ]);

  return "completed";
}

export type ProSubscription = {
  plan: "free" | "premium" | "standard";
  expiresAt: string | null;
  /** Le pro n'a pas arrêté son offre : elle repart sur sa prochaine vente. */
  autoRenew: boolean;
  /** Mois Pro échu, en attente de la prochaine vente pour repartir. */
  waitingForSale: boolean;
};

/**
 * L'abonnement d'un pro, échéance appliquée. Un Pro échu qui n'a pas arrêté son
 * offre reste Pro « en attente de vente » : sa prochaine commande payée rouvre
 * un mois (cf. `renewProFromSale`). S'il l'a arrêtée, il repasse sur l'offre
 * Gratuit (écrit en base pour que commissions et reversements suivent).
 */
export async function readProSubscription(proId: string): Promise<ProSubscription> {
  const admin = db();
  const row = await currentPlanRow(admin, proId);
  const plan = row.plan as ProSubscription["plan"];
  const expiresAt = row.expiresAt;
  const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();

  if (plan === PAID_PLAN_ID && expired && row.autoRenew) {
    return { plan, expiresAt, autoRenew: true, waitingForSale: true };
  }

  if (plan !== "free" && expired) {
    const patch = { plan: "free", plan_expires_at: null };
    await Promise.all([
      admin.from("tailors").update(patch).eq("id", proId),
      admin.from("vendors").update(patch).eq("id", proId),
    ]);
    return { plan: "free", expiresAt: null, autoRenew: row.autoRenew, waitingForSale: false };
  }
  return { plan, expiresAt, autoRenew: row.autoRenew, waitingForSale: false };
}
