import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor } from "@/lib/pipeline";

/**
 * Un client, tel que le pro le voit dans « Mes clients ».
 *
 * La plateforme n'a pas de fichier clients à part : ce sont les gens qui ont
 * commandé. On les reconstruit donc à partir des commandes — un même client
 * regroupe toutes les siennes — pour que le tailleur reconnaisse ses habitués,
 * les rappelle d'un geste, et voie combien chacun lui a rapporté.
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
};

function displayName(order: OrderListItem): string {
  const contact = [order.contact_first_name, order.contact_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return order.client?.full_name?.trim() || contact || "Client";
}

/**
 * Regroupe des commandes par client, la plus dépensière en tête. Un client se
 * reconnaît à son `client_id` ; à défaut (données de démo, contact libre), à son
 * nom, pour ne pas éclater un même client en plusieurs fiches.
 */
export function groupClients(
  role: ProRole,
  orders: OrderListItem[],
): ClientSummary[] {
  const byClient = new Map<string, ClientSummary>();

  for (const order of orders) {
    const name = displayName(order);
    const key = order.client_id || name.toLowerCase();
    const paid = order.payment_status === "paid";
    const share = paid ? amountFor(role, order) : 0;

    const existing = byClient.get(key);
    if (existing) {
      existing.orders += 1;
      existing.spent += share;
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
      });
    }
  }

  return [...byClient.values()].sort(
    (a, b) => b.spent - a.spent || b.orders - a.orders,
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
