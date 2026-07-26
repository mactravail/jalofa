import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { OrderStatusBadge, OrderTimeline } from "@/components/order/order-status";
import { QuotePayPanel } from "@/components/order/quote-pay-panel";
import { ReassignTailorPanel } from "@/components/order/reassign-tailor-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import { getTailors } from "@/lib/data";
import { getOrderDetail } from "@/lib/orders-data";
import { isSupabaseConfigured } from "@/lib/queries";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  // Une commande refusée peut repartir chez un autre tailleur : on charge les
  // ateliers ouverts (sauf celui qui a refusé). Seul cas où le client rechoisit.
  const canReassign = order?.status === "rejected";
  const otherTailors = canReassign
    ? (await getTailors()).filter((t) => t.id !== order?.tailor_id)
    : [];

  if (!order) {
    if (isSupabaseConfigured()) notFound();
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground">
          Le suivi de commande sera disponible une fois la base de données connectée.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/compte/commandes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Mes commandes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold">{order.order_number}</h1>
          <p className="text-muted-foreground text-sm">
            {new Date(order.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {canReassign && (
        <ReassignTailorPanel
          orderId={order.id}
          reason={order.rejection_reason}
          tailors={otherTailors}
        />
      )}

      {/* Devis en privé : en attente du prix, ou prêt à accepter et payer. */}
      {order.is_quote && order.payment_status === "pending" && (
        <QuotePayPanel orderId={order.id} tailoringPrice={order.tailoring_price} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} history={order.history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Type" value={ORDER_TYPE_LABELS[order.type]} />
            {order.model?.name && <Row label="Modèle" value={order.model.name} />}
            {order.style?.name && <Row label="Style" value={order.style.name} />}
            {order.fabric?.name && <Row label="Tissu" value={order.fabric.name} />}
            {order.tailor?.shop_name && (
              <Row label="Tailleur" value={order.tailor.shop_name} />
            )}
            <Row
              label="Livraison"
              value={DELIVERY_METHOD_LABELS[order.delivery_method]}
            />
            <div className="my-3 h-px bg-border" />
            {order.fabric_price > 0 && (
              <Row label="Tissu" value={formatPrice(order.fabric_price)} />
            )}
            {order.tailoring_price > 0 && (
              <Row label="Confection" value={formatPrice(order.tailoring_price)} />
            )}
            <Row
              label="Livraison"
              value={
                order.delivery_fee > 0
                  ? formatPrice(order.delivery_fee)
                  : order.delivery_method === "home"
                    ? "Offerte"
                    : "Gratuit"
              }
            />
            <div className="my-3 h-px bg-border" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total_amount)}</span>
            </div>
            <Row
              label="Paiement"
              value={`${order.payment_method ? PAYMENT_METHOD_LABELS[order.payment_method] : "—"} · ${PAYMENT_STATUS_LABELS[order.payment_status]}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
