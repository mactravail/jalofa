import {
  ALTERATION_REASON_LABELS,
  SATISFACTION_ISSUES,
  isSatisfactionIssue,
} from "@/lib/after-sale";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor } from "@/lib/pipeline";

/**
 * Un client, tel que le pro le voit dans « Mes clients ».
 *
 * La plateforme n'a pas de fichier clients à part : ce sont les gens qui ont
 * commandé. On les reconstruit donc à partir des commandes — un même client
 * regroupe toutes les siennes — pour que le tailleur reconnaisse ses habitués,
 * les rappelle d'un geste, voie ce qu'il leur a fait et ce qu'ils lui ont
 * renvoyé. Seuls ceux qui ont payé y figurent : avant, le pro n'a qu'un code.
 */
export type ClientSummary = {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  /** Nombre total de commandes passées chez ce pro. */
  orders: number;
  /** La part encaissée par ce pro sur les commandes payées de ce client. */
  spent: number;
  /** Date ISO de la commande la plus récente. */
  lastOrderAt: string;
  /** Ses commandes chez ce pro, la plus récente en tête. */
  orderList: OrderListItem[];
  /** Retours encore à traiter (retouche demandée, tissu renvoyé). */
  openFeedback: number;
};

/** Un retour du client sur une commande. */
export type ClientFeedback = {
  id: string;
  kind: "alteration" | "problem" | "perfect" | "fabric_return";
  title: string;
  note: string | null;
  /** Encore à traiter par le pro. */
  open: boolean;
  at: string;
};

/**
 * Tout ce que le client a fait remonter sur une commande, du plus récent au plus
 * ancien : retouches (tailleur), tissu renvoyé (vendeur) et la réponse « La
 * tenue vous va ? » (les deux, chacun ne lisant que les problèmes qui le
 * concernent).
 */
export function feedbackOf(role: ProRole, order: OrderListItem): ClientFeedback[] {
  const items: ClientFeedback[] = [];

  if (role === "tailor") {
    for (const a of order.alterations ?? []) {
      items.push({
        id: a.id,
        kind: "alteration",
        title: `Retouche : ${ALTERATION_REASON_LABELS[a.reason] ?? "à faire"}`,
        note: a.note,
        open: a.status === "requested",
        at: a.created_at,
      });
    }
  }

  if (role === "vendor" && order.fabric_return) {
    items.push({
      id: `${order.id}-return`,
      kind: "fabric_return",
      title: "Tissu renvoyé par le client",
      note: null,
      open: order.fabric_return.status === "requested",
      at: order.updated_at ?? order.created_at,
    });
  }

  const s = order.satisfaction;
  if (s) {
    if (s.verdict === "perfect") {
      items.push({
        id: `${order.id}-ok`,
        kind: "perfect",
        title: "Le client trouve sa tenue parfaite",
        note: s.comment,
        open: false,
        at: s.created_at,
      });
    } else {
      const labels = s.issues
        .filter(isSatisfactionIssue)
        .filter((i) => SATISFACTION_ISSUES[i].who === role)
        .map((i) => SATISFACTION_ISSUES[i].label);
      if (labels.length > 0 || s.comment) {
        items.push({
          id: `${order.id}-ko`,
          kind: "problem",
          title: labels.length > 0 ? `Problème : ${labels.join(", ")}` : "Problème signalé",
          note: s.comment,
          // Un problème retouchable se suit par la retouche elle-même.
          open: false,
          at: s.created_at,
        });
      }
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Le nom du client sur une commande. L'admin lit son profil ; le pro n'a que les
 * coordonnées reçues une fois la commande payée (`contact_*`, cf. `forPro`).
 */
export function clientNameOf(order: OrderListItem): string {
  const contact = [order.contact_first_name, order.contact_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return order.client?.full_name?.trim() || contact || "Client";
}

/**
 * Regroupe des commandes par client : d'abord ceux qui attendent une retouche,
 * puis le plus dépensier. Un client se reconnaît à son `client_id` ; à défaut
 * (données de démo, contact libre), à son nom, pour ne pas éclater un même
 * client en plusieurs fiches.
 */
export function groupClients(
  role: ProRole,
  orders: OrderListItem[],
): ClientSummary[] {
  const byClient = new Map<string, ClientSummary>();

  for (const order of orders) {
    if (!order.contact_first_name && !order.contact_last_name && !order.contact_phone) {
      continue;
    }
    const name = clientNameOf(order);
    const key = order.client_id || name.toLowerCase();
    const paid = order.payment_status === "paid";
    const share = paid ? amountFor(role, order) : 0;
    const open = feedbackOf(role, order).filter((f) => f.open).length;

    const existing = byClient.get(key);
    if (existing) {
      existing.orders += 1;
      existing.spent += share;
      existing.openFeedback += open;
      existing.orderList.push(order);
      if (order.created_at > existing.lastOrderAt) {
        existing.lastOrderAt = order.created_at;
        existing.city = order.delivery_city?.trim() || existing.city;
        existing.phone = order.contact_phone || existing.phone;
      }
    } else {
      byClient.set(key, {
        id: key,
        name,
        phone: order.contact_phone ?? order.client?.phone ?? null,
        city: order.delivery_city?.trim() || null,
        orders: 1,
        spent: share,
        lastOrderAt: order.created_at,
        orderList: [order],
        openFeedback: open,
      });
    }
  }

  for (const client of byClient.values()) {
    client.orderList.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return [...byClient.values()].sort(
    (a, b) =>
      Number(b.openFeedback > 0) - Number(a.openFeedback > 0) ||
      b.spent - a.spent ||
      b.orders - a.orders,
  );
}

/** Les initiales pour l'avatar : « Aïssatou Diallo » → « AD ». */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
