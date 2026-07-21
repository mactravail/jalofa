import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE,
  type OrderStatus,
} from "@/lib/constants";
import type { OrderStatusHistory } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Partial<Record<OrderStatus, string>> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  in_production: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  sewing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  shipped: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      className={cn(
        "border-0",
        STATUS_TONE[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function OrderTimeline({
  status,
  history,
}: {
  status: OrderStatus;
  history: OrderStatusHistory[];
}) {
  if (status === "rejected" || status === "cancelled") {
    return (
      <div className="text-destructive rounded-lg border border-dashed p-4 text-sm">
        Cette commande a été {ORDER_STATUS_LABELS[status].toLowerCase()}.
      </div>
    );
  }

  const currentIndex = ORDER_TIMELINE.indexOf(status);
  const timeByStatus = new Map(
    history.map((h) => [h.status, h.created_at]),
  );

  return (
    <ol className="relative ml-3 space-y-6 border-l pl-6">
      {ORDER_TIMELINE.map((s, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const at = timeByStatus.get(s);
        return (
          <li key={s} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] flex size-6 items-center justify-center rounded-full border-2",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background",
              )}
            >
              {done && <Check className="size-3.5" />}
            </span>
            <p
              className={cn(
                "text-sm font-medium",
                isCurrent && "text-primary",
                !done && "text-muted-foreground",
              )}
            >
              {ORDER_STATUS_LABELS[s]}
            </p>
            {at && (
              <p className="text-muted-foreground text-xs">
                {new Date(at).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
