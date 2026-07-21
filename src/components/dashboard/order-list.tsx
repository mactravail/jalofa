"use client";

import { ChevronRight, PackageOpen } from "lucide-react";

import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { OrderStatusBadge } from "@/components/order/order-status";
import { ORDER_TYPE_LABELS, formatPrice } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor, type OrderBucket } from "@/lib/pipeline";

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
  const amountLabel = role === "vendor" ? "Tissu" : "Confection";

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
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
              {order.order_number}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 truncate font-medium">{title}</p>
          <p className="text-muted-foreground truncate text-sm">
            {order.client?.full_name ?? "Client"} ·{" "}
            <span className="text-foreground/70">
              {amountLabel} {formatPrice(amountFor(role, order))}
            </span>
          </p>
        </div>

        <ChevronRight className="text-muted-foreground size-4 shrink-0 max-sm:hidden" />
      </OrderDetailSheet>

      <OrderStatusControl
        orderId={order.id}
        status={order.status}
        type={order.type}
      />
    </div>
  );
}
