"use client";

import { useTransition } from "react";
import { BellOff, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markFabricSalesRead } from "@/lib/actions/notifications";
import { formatPrice, formatTimeAgo } from "@/lib/constants";
import type { FabricSale } from "@/lib/notifications-data";
import { cn } from "@/lib/utils";

/**
 * « Un client a acheté votre tissu » — the vendor's sales feed, showing the
 * swatch to cut from and what the sale earned, newest first.
 */
export function FabricSalesPanel({ sales }: { sales: FabricSale[] }) {
  const [isPending, startTransition] = useTransition();
  const unread = sales.filter((s) => !s.is_read).length;

  const markRead = () =>
    startTransition(async () => {
      try {
        await markFabricSalesRead();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de mise à jour");
      }
    });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
          {sales.length} vente{sales.length > 1 ? "s" : ""}
          {unread > 0 && (
            <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
              {unread} nouvelle{unread > 1 ? "s" : ""}
            </span>
          )}
        </p>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markRead} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {sales.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <BellOff className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">
            Aucune vente de tissu pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </section>
  );
}

function SaleRow({ sale }: { sale: FabricSale }) {
  const meters =
    sale.fabric_meters === null ? null : `${sale.fabric_meters.toLocaleString("fr-FR")} m`;

  return (
    <div
      className={cn(
        "bg-card flex items-center gap-3 rounded-xl border p-4 sm:gap-4",
        !sale.is_read && "border-primary/40 bg-primary/[0.03]",
      )}
    >
      <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-lg sm:size-16">
        {sale.fabric_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sale.fabric_image}
            alt={sale.fabric_name}
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {!sale.is_read && (
            <span className="bg-primary size-2 shrink-0 rounded-full" aria-hidden />
          )}
          <p className="truncate font-medium">{sale.fabric_name}</p>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">
          {sale.client_name ?? "Un client"} a acheté{meters ? ` ${meters}` : ""} de ce
          tissu
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {sale.order_number && <span className="font-mono">{sale.order_number}</span>}
          {sale.order_number && " · "}
          <span suppressHydrationWarning>{formatTimeAgo(sale.created_at)}</span>
        </p>
        {/* Too narrow to sit beside the text: the price drops under it. */}
        <p className="text-primary mt-1 font-semibold sm:hidden">
          {formatPrice(sale.fabric_price)}
        </p>
      </div>

      <span className="text-primary hidden shrink-0 font-semibold sm:block">
        {formatPrice(sale.fabric_price)}
      </span>
    </div>
  );
}
