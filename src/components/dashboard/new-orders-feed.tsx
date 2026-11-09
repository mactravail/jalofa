"use client";

import { Price } from "@/components/cart/price";
import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { pipelineType } from "@/lib/pipeline";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { clientNameOf } from "@/lib/clients";
import { ORDER_TYPE_LABELS, formatReceivedAt } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor } from "@/lib/pipeline";

/**
 * Le fil des nouvelles commandes : qui, quoi, quand, combien — puis les deux
 * boutons pour répondre, sur la carte. Il lit la pile « Nouvelles commandes » du
 * pipeline partagé, donc une commande acceptée quitte le fil aussitôt.
 */
export function NewOrdersFeed({ max }: { max?: number }) {
  const { role } = usePipeline();
  const todo = useBucket("todo");

  if (todo.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-base">
        Aucune nouvelle commande.
      </p>
    );
  }

  const shown = max ? todo.slice(0, max) : todo;

  return (
    <ul className="space-y-3">
      {shown.map((order) => (
        <li key={order.id}>
          <NewOrderCard order={order} role={role} />
        </li>
      ))}
    </ul>
  );
}

function NewOrderCard({
  order,
  role,
}: {
  order: OrderListItem;
  role: ProRole;
}) {
  const title =
    order.model?.name ?? order.fabric?.name ?? ORDER_TYPE_LABELS[order.type];
  // Un devis pas encore payé n'a pas de prix ferme : c'est au tailleur de le donner.
  const quotePending = order.is_quote && order.payment_status === "pending";
  const amount = quotePending ? order.tailoring_price : amountFor(role, order);

  return (
    <article className="bg-card overflow-hidden rounded-xl border">
      <div className="flex p-4">
        <OrderDetailSheet order={order}>
          {order.fabric?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.fabric.image_url}
              alt=""
              className="bg-muted size-16 shrink-0 rounded-lg object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{title}</p>
            <p className="text-muted-foreground truncate font-mono text-sm">
              Code {order.order_number}
            </p>
            {(order.contact_first_name || order.contact_last_name) && (
              <p className="text-muted-foreground truncate text-sm">{clientNameOf(order)}</p>
            )}
            <p
              className="text-muted-foreground mt-1 text-sm first-letter:uppercase"
              suppressHydrationWarning
            >
              {formatReceivedAt(order.created_at)}
            </p>
          </div>

          <div className="shrink-0 text-right text-lg font-bold">
            {quotePending && amount === 0 ? (
              <span className="text-base font-semibold text-amber-500">
                Sans prix
              </span>
            ) : (
              <Price amount={amount} />
            )}
          </div>
        </OrderDetailSheet>
      </div>

      <div className="border-t p-3">
        <OrderStatusControl
          orderId={order.id}
          status={order.status}
          type={pipelineType(order)}
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
    </article>
  );
}
