import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { OrderCancellationSummary } from "@/lib/types";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Attache à chaque commande sa dernière demande d'annulation. Lu à part : tant
 * que la migration 20260826000001 n'est pas jouée, la table manque et les
 * commandes s'affichent comme avant (sans blocage côté interface ; la base, elle,
 * n'a alors pas encore de règle).
 */
export async function withCancellations<T extends { id: string }>(
  supabase: ServerClient,
  orders: T[],
): Promise<(T & { cancellation: OrderCancellationSummary | null })[]> {
  if (orders.length === 0) return [];
  const { data, error } = await supabase
    .from("order_cancellations" as never)
    .select("id, order_id, status, stage, reason, requested_at, decided_at, decision_reason, refund_amount")
    .in("order_id", orders.map((o) => o.id))
    .order("requested_at", { ascending: false });

  const latest = new Map<string, OrderCancellationSummary>();
  if (!error) {
    for (const row of (data ?? []) as unknown as (OrderCancellationSummary & { order_id: string })[]) {
      // Une demande en cours prime sur une décision plus ancienne.
      const current = latest.get(row.order_id);
      if (!current || (row.status === "pending" && current.status !== "pending")) {
        latest.set(row.order_id, {
          ...row,
          refund_amount: row.refund_amount == null ? null : Number(row.refund_amount),
        });
      }
    }
  }
  return orders.map((o) => ({ ...o, cancellation: latest.get(o.id) ?? null }));
}
