"use client";

import { Clock, PartyPopper, Sparkles } from "lucide-react";

import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { ORDER_TYPE_LABELS, formatPrice, formatReceivedAt, formatTimeAgo } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor } from "@/lib/pipeline";
import { TONE } from "@/lib/dashboard-tone";
import { cn } from "@/lib/utils";

/**
 * Le fil des nouvelles commandes — le cœur de l'espace pro. Chaque commande qui
 * tombe s'affiche comme une notification : le nom du client, ce qu'il veut, et
 * surtout **quand** elle est arrivée (le jour et l'heure). Les deux gros boutons
 * « Accepter » / « Refuser » sont là, sur la carte : rien à chercher.
 *
 * Il lit la pile « À traiter » du pipeline partagé, donc une commande acceptée
 * quitte le fil aussitôt — le tailleur voit fondre sa liste au fil de la journée.
 */
export function NewOrdersFeed({ max }: { max?: number }) {
  const { role } = usePipeline();
  const todo = useBucket("todo");

  if (todo.length === 0) {
    return (
      <div className={cn("rounded-2xl border p-8 text-center", TONE.emerald.border)}>
        <span
          className={cn(
            "mx-auto flex size-14 items-center justify-center rounded-2xl",
            TONE.emerald.soft,
          )}
        >
          <PartyPopper className="size-7" />
        </span>
        <p className="mt-4 text-base font-semibold">Tout est à jour 🎉</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
          Aucune nouvelle commande à regarder. Dès qu&apos;un client commande,
          elle apparaît ici.
        </p>
      </div>
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
  const client = order.client?.full_name ?? order.contact_first_name ?? "Client";
  const amountLabel = role === "vendor" ? "Tissu" : "Confection";
  // Une commande qui n'a pas encore été acceptée est « nouvelle » au sens fort :
  // elle mérite la pastille et l'accent chaud.
  const isFresh = order.status === "received";

  return (
    <article
      className={cn(
        "bg-card overflow-hidden rounded-2xl border shadow-sm",
        isFresh ? TONE.amber.border : "border-border",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="relative shrink-0">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl",
              isFresh ? TONE.amber.solid : TONE.blue.soft,
            )}
          >
            <Sparkles className="size-6" />
          </span>
          {isFresh && (
            <span className="border-card absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 bg-rose-500">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
            </span>
          )}
        </span>

        <OrderDetailSheet order={order}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  isFresh ? TONE.amber.tint : TONE.blue.tint,
                )}
              >
                {isFresh ? "Nouvelle commande" : "À suivre"}
              </span>
              <span
                className="text-muted-foreground text-xs"
                suppressHydrationWarning
              >
                {formatTimeAgo(order.created_at)}
              </span>
            </div>

            <p className="mt-1.5 truncate text-base font-semibold">{client}</p>
            <p className="text-muted-foreground truncate text-sm">
              {title} · {ORDER_TYPE_LABELS[order.type]}
            </p>

            <p
              className={cn(
                "mt-1.5 flex items-center gap-1.5 text-sm font-medium",
                isFresh ? TONE.amber.text : "text-muted-foreground",
              )}
              suppressHydrationWarning
            >
              <Clock className="size-3.5 shrink-0" />
              Reçue {formatReceivedAt(order.created_at)}
            </p>
          </div>
        </OrderDetailSheet>

        <div className="shrink-0 text-right">
          <p className="text-muted-foreground text-[11px]">{amountLabel}</p>
          <p className="font-semibold">{formatPrice(amountFor(role, order))}</p>
        </div>
      </div>

      <div className="bg-muted/40 flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3">
        <OrderStatusControl
          orderId={order.id}
          status={order.status}
          type={order.type}
        />
      </div>
    </article>
  );
}
