import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";

import {
  SatisfactionPanel,
  CancelOrderPanel,
  FabricReturnPanel,
} from "@/components/order/after-sale-panels";
import { ConfirmFabricReceived } from "@/components/order/confirm-fabric-received";
import { OrderStatusBadge, OrderTimeline } from "@/components/order/order-status";
import { pipelineType, timelineFor } from "@/lib/pipeline";
import { QuotePayPanel } from "@/components/order/quote-pay-panel";
import { ReassignTailorPanel } from "@/components/order/reassign-tailor-panel";
import { ReviseQuotePanel } from "@/components/order/revise-quote-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import { getFabrics, getTailors } from "@/lib/data";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import {

  canCancelOrder,
  canReturnFabric,
  cancelDeadline,
  formatDeadline,
  returnDeadline,
} from "@/lib/after-sale";
import {
  getFabricReturnAddress,
  getOrderDetail,
  getOrderReviewState,
  getOrderSatisfaction,
} from "@/lib/orders-data";
import { TailorReviewForm } from "@/components/catalog/tailor-review-form";
import { VendorReviewForm } from "@/components/catalog/vendor-review-form";
import { InTransitPanel, PayoutDelayNotice } from "@/components/order/delivery-panels";
import { JalofaWhatsApp } from "@/components/order/jalofa-whatsapp";
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

  // Tant que rien n'est payé, le client peut changer sa demande et redemander un
  // devis. Le tissu n'est à choisir que s'il ne vient pas du client.
  const canRevise =
    order?.is_quote && order.status === "received" && order.payment_status === "pending";
  const revisableFabrics =
    canRevise && order?.type !== "own_fabric"
      ? (await getFabrics()).filter(
          (f) => isFabricAvailable(f) && f.vendor_id,
        )
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

  const satisfaction =
    order.status === "delivered" ? await getOrderSatisfaction(order.id) : null;
  const reviewed =
    order.status === "delivered" ? await getOrderReviewState(order.id) : null;
  const cancelEnd = cancelDeadline(order, order.history);
  const returnEnd = returnDeadline(order, order.history);
  const returnAddress =
    order.fabric_return?.status === "requested" ? await getFabricReturnAddress(order) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/compte"
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
      {canRevise && (
        <QuotePayPanel
          orderId={order.id}
          revision={order.quote_revision ?? 0}
          tailoringPrice={order.tailoring_price}
          fabricPrice={order.fabric_price}
          deliveryFee={order.delivery_fee}
          totalAmount={order.total_amount}
          deliveryPlace={[order.delivery_address, order.delivery_city, order.delivery_country]
            .filter(Boolean)
            .join(", ")}
          hasAddress={Boolean(order.delivery_address && order.delivery_city)}
          readyDays={order.quote_ready_days}
          note={order.quote_note}
        />
      )}

      {canRevise && (
        <ReviseQuotePanel
          orderId={order.id}
          fabrics={revisableFabrics}
          tailorId={order.tailor_id}
          tailorName={order.tailor?.shop_name ?? null}
          fabricId={order.fabric_id}
          fabricMeters={order.fabric_meters}
          address={order.delivery_address}
          city={order.delivery_city}
          country={order.delivery_country}
          notes={order.notes}
          ownFabric={order.type === "own_fabric"}
          hasPrice={order.tailoring_price > 0}
        />
      )}

      {order.type === "fabric_only" && order.status === "fabric_shipped" && (
        <ConfirmFabricReceived orderId={order.id} />
      )}

      {canCancelOrder(order, order.history) && (
        <CancelOrderPanel
          orderId={order.id}
          paid={order.payment_status === "paid"}
          deadlineLabel={
            order.status !== "rejected" && cancelEnd !== null ? formatDeadline(cancelEnd) : null
          }
        />
      )}

      {(order.fabric_return || canReturnFabric(order, order.history)) && (
        <FabricReturnPanel
          orderId={order.id}
          status={order.fabric_return?.status ?? null}
          deadlineLabel={returnEnd !== null ? formatDeadline(returnEnd) : null}
          returnAddress={returnAddress}
        />
      )}

      {/* En route : le livreur, puis « Reçue » / « Pas reçue ». */}
      {order.type !== "fabric_only" && order.status === "shipped" && (
        <InTransitPanel
          orderId={order.id}
          orderNumber={order.order_number}
          courierName={order.courier_name ?? null}
          courierPhone={order.courier_phone ?? null}
          courierEta={order.courier_eta ?? null}
        />
      )}

      {/* Reçue : « La tenue vous va ? » — Parfaite ou Un problème. */}
      {order.type !== "fabric_only" && order.status === "delivered" && (
        <SatisfactionPanel
          orderId={order.id}
          answer={satisfaction}
          alterations={order.alterations ?? []}
        />
      )}

      {/* Reçue : l'avis sur le tailleur et le tissu ne s'ouvre qu'ici. */}
      {order.status === "delivered" && reviewed && (
        <div className="space-y-4">
          {order.tailor_id && !reviewed.tailor && (
            <div className="rounded-xl border p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Star className="size-4 text-amber-400" /> Votre avis sur{" "}
                {order.tailor?.shop_name ?? "votre tailleur"}
              </p>
              <div className="mt-3">
                <TailorReviewForm tailorId={order.tailor_id} />
              </div>
            </div>
          )}
          {order.vendor_id &&
            order.vendor_id !== order.tailor_id &&
            order.type !== "own_fabric" &&
            !reviewed.fabric && (
              <div className="rounded-xl border p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <Star className="size-4 text-amber-400" /> Votre avis sur le tissu
                  {order.fabric?.name ? ` « ${order.fabric.name} »` : ""}
                </p>
                <div className="mt-3">
                  <VendorReviewForm vendorId={order.vendor_id} />
                </div>
              </div>
            )}
        </div>
      )}

      {order.status === "delivered" && (
        <div className="space-y-3">
          <PayoutDelayNotice />
          <JalofaWhatsApp
            orderNumber={order.order_number}
            message="J'ai un problème avec ma commande :"
            label="Un problème ? Contacter un membre de JALOFA"
            className="w-full"
          />
        </div>
      )}

      {order.payment_status === "refunded" && (
        <p className="rounded-xl border p-4 font-semibold">Vous avez été remboursé.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline
              status={order.status}
              history={order.history}
              timeline={timelineFor(pipelineType(order))}
            />
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
            {order.delivery_city && <Row label="Ville" value={order.delivery_city} />}
            {/* Sans prix du tailleur, il n'y a pas encore de montant à annoncer. */}
            {!(canRevise && order.tailoring_price <= 0) && (
              <>
                <div className="my-3 h-px bg-border" />
                {order.fabric_price > 0 && (
                  <Row label="Tissu" value={formatPrice(order.fabric_price)} />
                )}
                {order.tailoring_price > 0 && (
                  <Row label="Tailleur" value={formatPrice(order.tailoring_price)} />
                )}
                <Row
                  label="Livraison"
                  value={
                    order.delivery_fee > 0
                      ? formatPrice(order.delivery_fee)
                      : order.delivery_method === "pickup" || order.is_quote
                        ? "Gratuite"
                        : "Selon le pro"
                  }
                />
                <div className="my-3 h-px bg-border" />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total_amount)}</span>
                </div>
              </>
            )}
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
