"use server";

import { revalidatePath } from "next/cache";

import {
  ALTERATION_REASON_LABELS,
  canAskAlteration,
  canCancelOrder,
  canReturnFabric,
  type AlterationReason,
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
      "id, order_number, client_id, tailor_id, vendor_id, type, status, payment_status, is_quote, created_at, fabric_return:fabric_returns(status), alterations:order_alterations(status)",
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

/** Le client annule dans le délai. Une commande payée sera remboursée par JALOFA. */
export async function cancelOrder(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const loaded = await loadOrder(orderId);
  if (!loaded || loaded.order.client_id !== loaded.userId) {
    return { ok: false, error: "Commande introuvable." };
  }
  const { supabase, order, history } = loaded;
  if (!canCancelOrder(order, history)) {
    return { ok: false, error: "Le délai pour annuler cette commande est passé." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("client_id", loaded.userId)
    .eq("status", order.status);
  if (error) return { ok: false, error: error.message };

  const message = {
    type: "order_cancelled",
    title: "Commande annulée par le client",
    body: `Ne travaillez plus sur la commande ${order.order_number}.`,
    order_id: orderId,
  };
  const pros = [
    { user_id: order.tailor_id, link: "/tailleur/espace/terminees" },
    ...(order.vendor_id !== order.tailor_id
      ? [{ user_id: order.vendor_id, link: "/vendeur/espace/terminees" }]
      : []),
  ];
  await notify(pros.map((pro) => ({ ...message, ...pro })));

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
 * JALOFA a joint le client sur WhatsApp, ou il n'a pas répondu après 48 h : le
 * tissu est considéré comme reçu, ce qui libère l'argent du vendeur.
 */
export async function adminMarkFabricReceived(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const admin = await adminDbOrError();
  if ("error" in admin) return { ok: false, error: admin.error ?? "Action non autorisée." };

  const { error } = await admin.db
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", orderId)
    .eq("type", "fabric_only")
    .eq("status", "fabric_shipped");
  if (error) return { ok: false, error: error.message };

  revalidateOrder(orderId);
  return { ok: true };
}

/** JALOFA a remboursé le client. */
export async function adminMarkRefunded(orderId: string): Promise<AfterSaleResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const admin = await adminDbOrError();
  if ("error" in admin) return { ok: false, error: admin.error ?? "Action non autorisée." };

  const { data: order, error } = await admin.db
    .from("orders")
    .update({ payment_status: "refunded" })
    .eq("id", orderId)
    .eq("payment_status", "paid")
    .select("client_id")
    .single();
  if (error) return { ok: false, error: error.message };

  await notify([
    {
      user_id: (order as { client_id: string }).client_id,
      type: "order_refunded",
      title: "Vous avez été remboursé",
      body: "JALOFA vous a renvoyé votre argent.",
      link: `/compte/commandes/${orderId}`,
      order_id: orderId,
    },
  ]);

  revalidateOrder(orderId);
  return { ok: true };
}
