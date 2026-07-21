import Link from "next/link";

import { OrderStatusBadge } from "@/components/order/order-status";
import { ORDER_TYPE_LABELS, formatPrice } from "@/lib/constants";
import type { OrderListItem } from "@/lib/orders-data";

export function OrderCard({
  order,
  href,
  clientName,
}: {
  order: OrderListItem;
  href: string;
  clientName?: string | null;
}) {
  const title =
    order.model?.name ??
    order.fabric?.name ??
    ORDER_TYPE_LABELS[order.type];

  return (
    <Link
      href={href}
      className="bg-card hover:bg-muted/40 flex items-center gap-4 rounded-xl border p-4 transition-colors"
    >
      <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
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
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs">
            {order.order_number}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 truncate font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-sm">
          {clientName
            ? clientName
            : order.tailor?.shop_name ?? ORDER_TYPE_LABELS[order.type]}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatPrice(order.total_amount)}</p>
        <p className="text-muted-foreground text-xs">
          {new Date(order.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
