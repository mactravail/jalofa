import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

import {
  confirmInvoice,
  createInvoice,
  isPaydunyaConfigured,
  type InvoiceStatus,
} from "@/lib/paydunya";
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
 * « Payer à ma première vente » : l'offre Pro s'active tout de suite (un mois),
 * et son prix est enregistré comme frais différé (`provider = 'sale'`,
 * `status = 'deferred'`), retenu sur le reversement de la première vente
 * (cf. `applyDeferredFees`). Un seul frais différé ouvert par pro : si un autre
 * existe déjà, on ne réactive rien.
 */
export async function startDeferredProOffer(proId: string): Promise<void> {
  const plan = getPlan(PAID_PLAN_ID);
  if (!plan) throw new Error("Offre Pro introuvable");
  const admin = db();

  const { data: open } = await admin
    .from("subscription_payments")
    .select("id")
    .eq("pro_id", proId)
    .eq("status", "deferred")
    .limit(1);
  if (open?.length) return;

  const { error } = await admin.from("subscription_payments").insert({
    pro_id: proId,
    plan: plan.id,
    months: 1,
    amount: plan.monthlyPrice,
    provider: "sale",
    status: "deferred",
  });
  if (error) throw new Error(`Frais différé non enregistré : ${error.message}`);

  const patch = {
    plan: plan.id,
    plan_expires_at: addMonths(new Date(), 1).toISOString(),
  };
  await Promise.all([
    admin.from("tailors").update(patch).eq("id", proId),
    admin.from("vendors").update(patch).eq("id", proId),
  ]);
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

/** Le plan en cours du pro — lu sur l'atelier, sinon sur la boutique de tissus. */
async function currentPlanRow(admin: SupabaseClient, proId: string) {
  for (const table of ["tailors", "vendors"]) {
    const { data } = await admin
      .from(table)
      .select("plan, plan_expires_at")
      .eq("id", proId)
      .maybeSingle();
    if (data) {
      return {
        plan: (data.plan as string) ?? "free",
        expiresAt: (data.plan_expires_at as string | null) ?? null,
      };
    }
  }
  return { plan: "free", expiresAt: null };
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

  // Payé en ligne : plus rien à retenir sur la première vente. Ce paiement
  // règle alors le mois déjà ouvert par le frais différé — il ne s'y ajoute pas.
  const { data: settledDeferred } = await admin
    .from("subscription_payments")
    .update({ status: "cancelled" })
    .eq("pro_id", payment.pro_id)
    .eq("status", "deferred")
    .select("months");
  const alreadyGranted = (settledDeferred ?? []).reduce(
    (sum, r) => sum + (Number(r.months) || 0),
    0,
  );
  const extraMonths = Math.max(0, (Number(payment.months) || 1) - alreadyGranted);

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
};

/**
 * L'abonnement d'un pro, échéance appliquée : un Pro échu repasse sur l'offre
 * Gratuit (écrit en base pour que commissions et reversements suivent).
 */
export async function readProSubscription(proId: string): Promise<ProSubscription> {
  const admin = db();
  const row = await currentPlanRow(admin, proId);
  const plan = row.plan as ProSubscription["plan"];
  const expiresAt = row.expiresAt;

  if (plan !== "free" && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    const patch = { plan: "free", plan_expires_at: null };
    await Promise.all([
      admin.from("tailors").update(patch).eq("id", proId),
      admin.from("vendors").update(patch).eq("id", proId),
    ]);
    return { plan: "free", expiresAt: null };
  }
  return { plan, expiresAt };
}
