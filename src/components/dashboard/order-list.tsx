"use client";

import { ChevronRight, Clock, PackageOpen } from "lucide-react";

import { AfterSaleProActions } from "@/components/dashboard/after-sale-pro-actions";
import { FabricComesFrom, FabricShipTo } from "@/components/dashboard/fabric-ship-to";
import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { OrderStatusBadge } from "@/components/order/order-status";
import { clientNameOf } from "@/lib/clients";
import { ORDER_TYPE_LABELS, formatPrice, formatReceivedAt } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import {
  amountFor,
  deliversToClient,
  isTerminal,
  pipelineType,
  tailorAwaitingFabric,
  tailorOwnsFabric,
  type OrderBucket,
} from "@/lib/pipeline";

/** Les commandes d'une pile du pipeline, avec le contrôle d'avancement. */
export function OrderList({
  bucket,
  empty,
  max,
}: {
  bucket: OrderBucket;
  empty: string;
  /** Vue d'ensemble : n'en montrer que les premières. */
  max?: number;
}) {
  const { role } = usePipeline();
  const orders = useBucket(bucket);

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <PackageOpen className="text-muted-foreground mx-auto size-7" />
        <p className="text-muted-foreground mt-3 text-sm">{empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(max ? orders.slice(0, max) : orders).map((order) => (
        <OrderRow key={order.id} order={order} role={role} />
      ))}
    </div>
  );
}

function OrderRow({ order, role }: { order: OrderListItem; role: ProRole }) {
  const title =
    order.model?.name ?? order.fabric?.name ?? ORDER_TYPE_LABELS[order.type];

  // Each pro sees the revenue line relevant to them.
  const baseLabel =
    role === "vendor"
      ? "Tissu"
      : tailorOwnsFabric(order)
        ? "Tissu et confection"
        : "Confection";
  // Celui qui livre encaisse aussi la livraison.
  const amountLabel =
    order.delivery_fee > 0 && deliversToClient(role, order.type)
      ? `${baseLabel} et livraison`
      : baseLabel;
  // Un devis pas encore accepté n'a pas de prix ferme à afficher.
  const quotePending = order.is_quote && order.payment_status === "pending";
  const flow = pipelineType(order);
  // Le vendeur d'une commande complète livre l'atelier, pas le client.
  const sendsToAtelier = role === "vendor" && flow === "full";
  const waitsForFabric =
    role === "tailor" && !quotePending && tailorAwaitingFabric(order.status, flow);

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:flex-wrap sm:items-center">
      {sendsToAtelier && !isTerminal(order.status) && (
        <div className="w-full">
          <FabricShipTo order={order} />
        </div>
      )}
      {waitsForFabric && order.vendor_id && (
        <div className="w-full">
          <FabricComesFrom order={order} />
        </div>
      )}
      <AfterSaleProActions order={order} role={role} />
      <OrderDetailSheet order={order}>
        <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-lg max-sm:hidden">
          {order.fabric?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.fabric.image_url}
              alt=""
              className="size-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">
              Code {order.order_number}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 truncate font-medium">{title}</p>
          <p className="text-muted-foreground truncate text-sm">
            {(order.contact_first_name || order.contact_last_name) && (
              <>{clientNameOf(order)} · </>
            )}
            <span className="text-foreground/70">
              {quotePending
                ? order.tailoring_price > 0
                  ? `Prix envoyé · ${formatPrice(order.tailoring_price)}`
                  : "Sans prix"
                : `${amountLabel} ${formatPrice(amountFor(role, order))}`}
            </span>
          </p>
          <p
            className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs"
            suppressHydrationWarning
          >
            <Clock className="size-3 shrink-0" />
            Reçue {formatReceivedAt(order.created_at)}
          </p>
        </div>

        <ChevronRight className="text-muted-foreground size-4 shrink-0 max-sm:hidden" />
      </OrderDetailSheet>

      <OrderStatusControl
        orderId={order.id}
        status={order.status}
        type={flow}
        isQuote={order.is_quote}
        tailoringPrice={order.tailoring_price}
        fabricPrice={order.fabric_price}
        deliveryAddress={order.delivery_address}
        deliveryCity={order.delivery_city}
        deliveryCountry={order.delivery_country}
        deliveryZone={order.model?.delivery_zone}
        paymentStatus={order.payment_status}
      />
    </div>
  );
}
