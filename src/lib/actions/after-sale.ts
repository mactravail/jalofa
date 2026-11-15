"use server";

import { revalidatePath } from "next/cache";

import {
  ALTERATION_REASON_LABELS,
  canAskAlteration,
  canCancelForLateness,
  canReturnFabric,
  isSatisfactionIssue,
  SATISFACTION_ISSUES,
  type AlterationReason,
  type SatisfactionIssue,
  type SatisfactionVerdict,
} from "@/lib/after-sale";
import type { OrderStatus, OrderType } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AfterSaleResult = { ok: true } | { ok: false; error: string };

const NOT_CONNECTED = "Base de données non connectée.";

type OrderRow = {
  id: string;
  order_number: string;
  client_id: string;
  tailor_id: string | null;
  vendor_id: string | null;
  type: OrderType;
  status: OrderStatus;
  payment_status: string;
  is_quote: boolean;
  created_at: string;
  quote_ready_days: number | null;
  fabric_return: { status: string } | null;
  alterations: { status: string }[] | null;
};

/** La commande telle que l'utilisateur a le droit de la lire, avec son historique. */
async function loadOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, client_id, tailor_id, vendor_id, type, status, payment_status, is_quote, created_at, quote_ready_days, fabric_return:fabric_returns(status), alterations:order_alterations(status)",
    )
    .eq("id", orderId)
    .single();
  const order = data as unknown as OrderRow | null;
  if (!order) return null;

  const { data: history } = await supabase
    .from("order_status_history")
    .select("status, created_at")
    .eq("order_id", orderId);

  return {
    supabase,
    userId: user.id,
    order,
    history: (history ?? []) as { status: OrderStatus; created_at: string }[],
  };
}

type NewNotification = {
  user_id: string | null;
  type: string;
  title: string;
  body: string;
  link: string;
  order_id: string;
};

/** Prévenir n'est pas vital : un échec ne doit pas annuler le geste du client. */
async function notify(rows: NewNotification[]) {
  const valid = rows.filter((r) => r.user_id);
  if (valid.length === 0) return;
  try {
    await createAdminClient().from("notifications").insert(valid);
  } catch {
    // Clé de service absente : le geste reste enregistré.
  }
}

function revalidateOrder(orderId: string) {
  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/admin", "layout");
}

/**
 * Le client demande l'annulation. Depuis le cahier des charges du 2026-11-13,
 * ce n'est plus une annulation directe : la commande est BLOQUÉE tout de suite
 * (plus de découpe ni d'envoi, trigger `orders_workflow_guard`) et JALOFA
 * examine (`/admin/annulations`), qui calcule le remboursement. Sans paiement,
 * l'annulation reste immédiate. Plus d'une semaine de retard : le motif est noté.
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.client_id !== loaded.userId) {
    return { ok: false, error: "Commande introuvable." };
  }
  const { supabase, order, history } = loaded;
  const late = canCancelForLateness(order, history);
  const motive = [late ? "Plus d'une semaine de retard." : null, reason?.trim() || null]
    .filter(Boolean)
    .join(" ");

  const { error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  }).rpc("request_order_cancellation", {
    p_order_id: orderId,
    p_reason: motive.slice(0, 500) || null,
  });
  if (error) return { ok: false, error: error.message };

  // Rien payé (devis, commande en attente de paiement) : la fonction SQL annule
  // tout de suite mais ne prévient personne. Le tailleur (et le vendeur) doivent
  // savoir que le client renonce, et JALOFA aussi.
  if (order.payment_status === "pending" && order.status !== "rejected") {
    const what = order.is_quote ? "la demande de devis" : "la commande";
    const body = `Le client a annulé ${what} ${order.order_number}.${
      reason?.trim() ? ` Motif : ${reason.trim().slice(0, 200)}` : ""
    }`;
    // Seul le tailleur voit un devis non payé (un achat non payé reste invisible
    // des pros, cf. `unpaidPurchase`) : c'est lui qu'on prévient.
    const pros = order.is_quote && order.tailor_id ? [order.tailor_id] : [];
    let admins: string[] = [];
    try {
      const { data } = await createAdminClient().from("profiles").select("id").eq("role", "admin");
      admins = ((data ?? []) as { id: string }[]).map((p) => p.id);
    } catch {
      // Clé de service absente : on prévient au moins les pros.
    }
    await notify([
      ...pros.map((id) => ({
        user_id: id,
        type: "order_cancelled",
        title: order.is_quote ? "Devis annulé par le client" : "Commande annulée par le client",
        body,
        link:
          id === order.vendor_id && id !== order.tailor_id
            ? "/vendeur/espace/annulees"
            : "/tailleur/espace/annulees",
        order_id: orderId,
      })),
      ...admins.map((id) => ({
        user_id: id,
        type: "order_cancelled",
        title: order.is_quote ? "Devis annulé par le client" : "Commande annulée par le client",
        body,
        link: "/admin/annulations",
        order_id: orderId,
      })),
    ]);
  }

  revalidateOrder(orderId);
  return { ok: true };
}

/** Le client demande à rendre un tissu reçu. Il paie le renvoi. */
export async function requestFabricReturn(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.client_id !== loaded.userId) {
    return { ok: false, error: "Commande introuvable." };
  }
  const { order, history, userId } = loaded;
  if (!order.vendor_id || !canReturnFabric(order, history)) {
    return { ok: false, error: "Le délai pour rendre ce tissu est passé." };
  }

  try {
    const { error } = await createAdminClient().from("fabric_returns").insert({
      order_id: orderId,
      client_id: userId,
      vendor_id: order.vendor_id,
    });
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "Le retour est indisponible pour le moment." };
  }

  await notify([
    {
      user_id: order.vendor_id,
      type: "fabric_return",
      title: "Un client vous renvoie un tissu",
      body: `Commande ${order.order_number}. À l'arrivée, touchez « J'ai reçu le tissu retourné ».`,
      link: "/vendeur/espace/a-traiter",
      order_id: orderId,
    },
  ]);

  revalidateOrder(orderId);
  return { ok: true };
}

/** Le vendeur a reçu le tissu retourné : JALOFA peut rembourser le client. */
export async function confirmFabricReturnReceived(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.vendor_id !== loaded.userId) {
    return { ok: false, error: "Cette commande ne vous est pas confiée." };
  }
  if (loaded.order.fabric_return?.status !== "requested") {
    return { ok: false, error: "Aucun retour en attente sur cette commande." };
  }

  try {
    const { error } = await createAdminClient()
      .from("fabric_returns")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("status", "requested");
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "Le retour est indisponible pour le moment." };
  }

  await notify([
    {
      user_id: loaded.order.client_id,
      type: "fabric_return_received",
      title: "Le vendeur a reçu votre tissu",
      body: "JALOFA va vous rembourser.",
      link: `/compte/commandes/${orderId}`,
      order_id: orderId,
    },
  ]);

  revalidateOrder(orderId);
  return { ok: true };
}

/** Le client demande une retouche sur son vêtement livré. */
export async function requestAlteration(
  orderId: string,
  reason: AlterationReason,
  note: string,
): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  if (!(reason in ALTERATION_REASON_LABELS)) {
    return { ok: false, error: "Dites-nous ce qui ne va pas." };
  }

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.client_id !== loaded.userId) {
    return { ok: false, error: "Commande introuvable." };
  }
  const { order, userId } = loaded;
  if (!order.tailor_id || !canAskAlteration(order)) {
    return { ok: false, error: "Une retouche n'est pas possible sur cette commande." };
  }

  try {
    const { error } = await createAdminClient().from("order_alterations").insert({
      order_id: orderId,
      client_id: userId,
      tailor_id: order.tailor_id,
      reason,
      note: note.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "La retouche est indisponible pour le moment." };
  }

  await notify([
    {
      user_id: order.tailor_id,
      type: "order_alteration",
      title: "Un client demande une retouche",
      body: `${ALTERATION_REASON_LABELS[reason]} — commande ${order.order_number}.`,
      link: "/tailleur/espace/a-traiter",
      order_id: orderId,
    },
  ]);

  revalidateOrder(orderId);
  return { ok: true };
}

/**
 * « La tenue vous va ? » — Parfaite, ou un problème (suggestions et/ou mot
 * libre). Une réponse par commande. Le tailleur (et le vendeur si le tissu est
 * en cause) est prévenu ; JALOFA la retrouve dans `/admin/satisfaction` pour
 * évaluer les prestataires. Un problème retouchable ouvre aussi une retouche.
 */
export async function submitSatisfaction(
  orderId: string,
  verdict: SatisfactionVerdict,
  rawIssues: string[],
  rawComment: string,
): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const issues = [...new Set(rawIssues)].filter(isSatisfactionIssue) as SatisfactionIssue[];
  const comment = rawComment.trim().slice(0, 1000) || null;
  if (verdict !== "perfect" && verdict !== "problem") {
    return { ok: false, error: "Choisissez une réponse." };
  }
  if (verdict === "problem" && issues.length === 0 && !comment) {
    return { ok: false, error: "Dites-nous ce qui ne va pas." };
  }

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.client_id !== loaded.userId) {
    return { ok: false, error: "Commande introuvable." };
  }
  const { order, userId } = loaded;
  if (order.status !== "delivered") {
    return { ok: false, error: "Vous pourrez répondre une fois la tenue reçue." };
  }

  const vendorId =
    order.vendor_id && order.vendor_id !== order.tailor_id ? order.vendor_id : null;

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "Indisponible pour le moment." };
  }

  const { error } = await db.from("order_satisfaction").insert({
    order_id: orderId,
    client_id: userId,
    tailor_id: order.tailor_id,
    vendor_id: vendorId,
    verdict,
    issues: verdict === "problem" ? issues : [],
    comment,
  });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Vous avez déjà répondu." : error.message,
    };
  }

  // Une retouche possible ? Elle part chez le tailleur avec le mot du client.
  const retouch = issues
    .map((i) => SATISFACTION_ISSUES[i].alteration)
    .find((a): a is AlterationReason => a !== null);
  if (verdict === "problem" && retouch && order.tailor_id && canAskAlteration(order)) {
    await db.from("order_alterations").insert({
      order_id: orderId,
      client_id: userId,
      tailor_id: order.tailor_id,
      reason: retouch,
      note: [issues.map((i) => SATISFACTION_ISSUES[i].label).join(", "), comment]
        .filter(Boolean)
        .join(" — "),
    });
  }

  const labelsFor = (who: "tailor" | "vendor") =>
    issues.filter((i) => SATISFACTION_ISSUES[i].who === who).map((i) => SATISFACTION_ISSUES[i].label);
  const body = (labels: string[]) =>
    [`Commande ${order.order_number}.`, labels.join(", "), comment ? `« ${comment} »` : null]
      .filter(Boolean)
      .join(" ");

  if (verdict === "perfect") {
    await notify([
      {
        user_id: order.tailor_id,
        type: "satisfaction_perfect",
        title: "Le client trouve sa tenue parfaite",
        body: body([]),
        link: "/tailleur/espace/terminees",
        order_id: orderId,
      },
    ]);
  } else {
    const tailorIssues = labelsFor("tailor");
    const vendorIssues = labelsFor("vendor");
    await notify([
      {
        user_id: tailorIssues.length > 0 || comment || !vendorId ? order.tailor_id : null,
        type: "satisfaction_problem",
        title: retouch ? "Un client demande une retouche" : "Un client signale un problème",
        body: body(tailorIssues),
        link: retouch ? "/tailleur/espace/a-traiter" : "/tailleur/espace/terminees",
        order_id: orderId,
      },
      {
        user_id: vendorIssues.length > 0 ? vendorId : null,
        type: "satisfaction_problem",
        title: "Un client signale un problème de tissu",
        body: body(vendorIssues),
        link: "/vendeur/espace/terminees",
        order_id: orderId,
      },
    ]);
  }

  revalidateOrder(orderId);
  revalidatePath("/admin/satisfaction");
  return { ok: true };
}

/** Le tailleur a fait la retouche. */
export async function markAlterationDone(
  orderId: string,
  alterationId: string,
): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.tailor_id !== loaded.userId) {
    return { ok: false, error: "Cette commande ne vous est pas confiée." };
  }

  try {
    const { error } = await createAdminClient()
      .from("order_alterations")
      .update({ status: "done", done_at: new Date().toISOString() })
      .eq("id", alterationId)
      .eq("order_id", orderId)
      .eq("status", "requested");
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "La retouche est indisponible pour le moment." };
  }

  await notify([
    {
      user_id: loaded.order.client_id,
      type: "order_alteration_done",
      title: "Votre retouche est faite",
      body: "Votre tailleur a terminé la retouche de votre tenue.",
      link: `/compte/commandes/${orderId}`,
      order_id: orderId,
    },
  ]);

  revalidateOrder(orderId);
  return { ok: true };
}

/** Le client de service, TOUJOURS derrière un contrôle de rôle admin. */
async function adminDbOrError() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    return { error: "Action non autorisée." };
  }

  try {
    return { db: createAdminClient() };
  } catch {
    return { error: "Clé de service manquante : l'action est indisponible." };
  }
}

/**
 * JALOFA a demandé au client s'il a reçu sa commande (tenue ou tissu seul) :
 * il a dit oui, ou n'a pas répondu dans les 24 h. La commande passe à
 * « livrée », ce qui libère l'argent du tailleur et du vendeur. Efface un
 * « pas reçue » enregistré avant (le colis a fini par arriver).
 */
export async function adminMarkOrderReceived(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const admin = await adminDbOrError();
  if ("error" in admin) return { ok: false, error: admin.error ?? "Action non autorisée." };

  const { data: order } = await admin.db
    .from("orders")
    .select("type, status")
    .eq("id", orderId)
    .single();
  const o = order as { type: OrderType; status: OrderStatus } | null;
  const enRoute = o && (o.type === "fabric_only" ? o.status === "fabric_shipped" : o.status === "shipped");
  if (!enRoute) return { ok: false, error: "Cette commande n'est pas en route." };

  const { error } = await admin.db
    .from("orders")
    .update({ status: "delivered", receipt_disputed_at: null } as never)
    .eq("id", orderId)
    .eq("status", o.status);
  if (error) return { ok: false, error: missingColumn(error) ?? error.message };

  revalidateOrder(orderId);
  return { ok: true };
}

/**
 * Le client dit qu'il n'a PAS reçu son colis (dans les 24 h). La commande reste
 * « en route » : ni le tailleur ni le vendeur ne sont payés tant que JALOFA
 * n'a pas tiré l'affaire au clair (livreur, tailleur). Si le colis n'arrive
 * jamais, le remboursement passe par « Annulations ».
 */
export async function adminMarkOrderNotReceived(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const admin = await adminDbOrError();
  if ("error" in admin) return { ok: false, error: admin.error ?? "Action non autorisée." };

  const { error } = await admin.db
    .from("orders")
    .update({ receipt_disputed_at: new Date().toISOString() } as never)
    .eq("id", orderId)
    .in("status", ["shipped", "fabric_shipped"]);
  if (error) return { ok: false, error: missingColumn(error) ?? error.message };

  revalidateOrder(orderId);
  return { ok: true };
}

/** La colonne `receipt_disputed_at` vient de 20260905000001 : message clair si absente. */
function missingColumn(error: { code?: string; message: string }): string | null {
  return error.code === "42703" || error.message.includes("receipt_disputed_at")
    ? "Base pas à jour : appliquez la migration 20260905000001."
    : null;
}

/**
 * JALOFA a remboursé au client tout ce qui lui reste dû (décision d'annulation,
 * ou tout le payé pour un refus du tailleur). Inscrit au registre par
 * `record_order_refund` : la clé fixe `full` empêche un double remboursement.
 * Un remboursement partiel passe par `adminRecordRefund`.
 */
export async function adminMarkRefunded(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const admin = await adminDbOrError();
  if ("error" in admin) return { ok: false, error: admin.error ?? "Action non autorisée." };

  const [{ data: order }, { data: cancellation }, { data: refunds }, { data: fabricReturn }] = await Promise.all([
    admin.db
      .from("orders")
      .select("amount_paid, total_amount, fabric_price, status" as "status")
      .eq("id", orderId)
      .single(),
    admin.db
      .from("order_cancellations" as never)
      .select("refund_amount")
      .eq("order_id", orderId)
      .eq("status", "accepted")
      .order("decided_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.db.from("order_ledger" as never).select("amount").eq("order_id", orderId).eq("entry_type", "refund"),
    admin.db.from("fabric_returns").select("status").eq("order_id", orderId).maybeSingle(),
  ]);
  const o = order as unknown as
    | { amount_paid: number | null; total_amount: number; fabric_price: number; status: string }
    | null;
  if (!o) return { ok: false, error: "Commande introuvable." };
  const decided = (cancellation as { refund_amount: number | null } | null)?.refund_amount;
  // Même règle que `record_order_refund` : décision d'annulation, sinon tout le
  // payé (refus, ancienne annulation), sinon le tissu rendu.
  const due =
    decided != null
      ? Number(decided)
      : o.status === "cancelled" || o.status === "rejected"
        ? Number(o.amount_paid ?? o.total_amount)
        : (fabricReturn as { status: string } | null)?.status === "received"
          ? Number(o.fabric_price)
          : 0;
  const done = ((refunds ?? []) as { amount: number }[]).reduce((s, r) => s + Number(r.amount), 0);
  const left = Math.round(due - done);
  if (left <= 0) return { ok: false, error: "Rien à rembourser sur cette commande." };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  }).rpc("record_order_refund", {
    p_order_id: orderId,
    p_amount: left,
    p_external_ref: null,
    p_idempotency_key: "full",
  });
  if (error) return { ok: false, error: error.message };

  revalidateOrder(orderId);
  return { ok: true };
}
