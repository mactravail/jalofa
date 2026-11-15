import type { Metadata } from "next";
import { OctagonX } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { CancellationDecision } from "@/components/admin/cancellation-decision";
import { getAllOrders, getCancellationRequests } from "@/lib/admin-data";
import { clientNameOf } from "@/lib/clients";
import { ORDER_STATUS_LABELS, formatPrice } from "@/lib/constants";
import { DELIVERY_OPTION_LABELS, fabricOwnerOf, optionOf, toWorkflowOrder } from "@/lib/order-workflow";

export const metadata: Metadata = { title: "Annulations" };

const STAGE_LABELS: Record<string, string> = {
  before_shipment: "Avant l'envoi du tissu",
  fabric_travelled: "Tissu déjà envoyé ou reçu, pas coupé",
  after_authorized_cut: "Après une découpe AUTORISÉE",
  after_unauthorized_cut: "Après une découpe NON autorisée",
};

const OWNER_LABELS = { vendor: "du vendeur", tailor: "du tailleur", client: "du client" } as const;

function when(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dakar",
  });
}

/**
 * Les demandes d'annulation (cahier des charges §4) : la commande est bloquée
 * dès la demande ; JALOFA décide, avec un motif, et la décision est historisée.
 */
export default async function AdminCancellationsPage() {
  const [requests, orders] = await Promise.all([getCancellationRequests(), getAllOrders()]);
  // Toutes les commandes annulées, y compris les devis abandonnés avant paiement.
  const cancelledOrders = orders
    .filter((o) => o.status === "cancelled")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <AdminPage
      title="Annulations"
      subtitle="Chaque demande bloque la commande tout de suite. Décidez vite : le tailleur et le vendeur attendent."
    >
      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <OctagonX className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((r) => {
            const order = r.order;
            if (!order) return null;
            const wf = toWorkflowOrder(order);
            return (
              <div key={r.id} className="bg-card space-y-3 rounded-xl border border-amber-500/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-muted-foreground font-mono text-xs">{order.order_number}</p>
                    <p className="font-medium">{clientNameOf(order)}</p>
                    <p className="text-muted-foreground text-sm">
                      {STAGE_LABELS[r.stage] ?? r.stage} · {ORDER_STATUS_LABELS[order.status]} ·{" "}
                      {DELIVERY_OPTION_LABELS[optionOf(wf)]} · tissu {OWNER_LABELS[fabricOwnerOf(wf)]}
                    </p>
                  </div>
                  <p className="text-sm whitespace-nowrap">Demandée le {when(r.requested_at)}</p>
                </div>
                {r.reason && <p className="bg-muted/40 rounded-lg p-2 text-sm">« {r.reason} »</p>}
                <ul className="text-muted-foreground grid gap-x-4 text-xs sm:grid-cols-2">
                  <li>Payé : {when(order.paid_at ?? null)}</li>
                  <li>Tissu envoyé : {when(order.fabric_shipped_at ?? null)}</li>
                  <li>Tissu reçu : {when(order.fabric_received_at ?? null)}</li>
                  <li>
                    Découpe : {when(order.cut_started_at ?? null)}
                    {order.cut_started_at && (order.cut_was_authorized ? " (autorisée)" : " (non vérifiée)")}
                  </li>
                </ul>
                <CancellationDecision
                  requestId={r.id}
                  order={wf}
                  travelled={Boolean(order.fabric_shipped_at || order.fabric_received_at)}
                />
              </div>
            );
          })}
        </div>
      )}

      {decided.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Décisions récentes</h2>
          <ul className="divide-y rounded-xl border">
            {decided.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span className="font-mono text-xs">{r.order?.order_number ?? r.order_id}</span>
                <span className={r.status === "accepted" ? "text-emerald-500" : "text-red-500"}>
                  {r.status === "accepted" ? "Acceptée" : "Refusée"} le {when(r.decided_at)}
                </span>
                {r.status === "accepted" && (
                  <span className="whitespace-nowrap">Remboursement : {formatPrice(r.refund_amount ?? 0)}</span>
                )}
                {r.decision_reason && <span className="text-muted-foreground w-full">{r.decision_reason}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Commandes annulées ({cancelledOrders.length})</h2>
        {cancelledOrders.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">Aucune commande annulée.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {cancelledOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span className="font-mono text-xs">{o.order_number}</span>
                <span className="font-medium">{clientNameOf(o)}</span>
                <span className="text-muted-foreground">
                  {o.is_quote ? "Devis" : "Commande"} · {o.model?.name ?? o.fabric?.name ?? "—"}
                </span>
                <span className="text-muted-foreground">
                  {o.payment_status === "paid" ? "Payée" : "Non payée"} · créée le {when(o.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}
