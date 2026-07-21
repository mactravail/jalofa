import { Check, Scissors, Store } from "lucide-react";

import { OrderStatusBadge, PaymentBadge } from "@/components/admin/status-badges";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ORDER_TYPE_LABELS, formatPrice } from "@/lib/constants";
import type { OrderListItem } from "@/lib/orders-data";
import { legStage, type LegStage } from "@/lib/pipeline";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Variant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

const LEG_VARIANT: Record<LegStage, Variant> = {
  done: "default",
  active: "secondary",
  cancelled: "destructive",
};

/**
 * La part d'un métier sur une commande — vendeur (tissu) ou tailleur (couture) —
 * avec son état de contrôle : c'est ici que l'admin voit « terminé & livré » dès
 * que le prestataire l'a marqué dans son espace.
 */
function LegBlock({
  icon: Icon,
  role,
  name,
  detail,
  stage,
  doneLabel,
  activeLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  role: string;
  name: string;
  detail?: string | null;
  stage: LegStage;
  doneLabel: string;
  activeLabel: string;
}) {
  const label =
    stage === "done" ? doneLabel : stage === "cancelled" ? "Annulé" : activeLabel;

  return (
    <div className="bg-muted/40 min-w-0 flex-1 rounded-lg border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Icon className="size-3.5" />
        {role}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{name}</p>
      {detail ? (
        <p className="text-muted-foreground truncate text-xs">{detail}</p>
      ) : null}
      <div className="mt-2">
        <Badge variant={LEG_VARIANT[stage]}>
          {stage === "done" ? <Check className="mr-1 size-3" /> : null}
          {label}
        </Badge>
      </div>
    </div>
  );
}

/** Une commande de la place de marché, vue par l'admin : client, prestataires et
 *  état de chaque part pour le contrôle. */
export function OrderRow({ order }: { order: OrderListItem }) {
  const garment =
    order.model?.name ?? order.fabric?.name ?? ORDER_TYPE_LABELS[order.type];

  const vendorStage = legStage("vendor", order.status, order.type);
  const tailorStage = legStage("tailor", order.status, order.type);

  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground font-mono text-xs">
              {order.order_number}
            </p>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-0.5 truncate font-medium">
            {order.client?.full_name ?? "Client"}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {garment} · {ORDER_TYPE_LABELS[order.type]} ·{" "}
            {DATE_FORMAT.format(new Date(order.created_at))}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatPrice(order.total_amount)}</p>
          <div className="mt-1 flex justify-end">
            <PaymentBadge status={order.payment_status} />
          </div>
        </div>
      </div>

      {(vendorStage || tailorStage) && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {vendorStage && (
            <LegBlock
              icon={Store}
              role="Vendeur de tissu"
              name={order.vendor?.shop_name ?? "Boutique"}
              detail={order.fabric?.name ? `Tissu : ${order.fabric.name}` : null}
              stage={vendorStage}
              doneLabel={order.type === "fabric_only" ? "Livré au client" : "Tissu expédié"}
              activeLabel="Préparation en cours"
            />
          )}
          {tailorStage && (
            <LegBlock
              icon={Scissors}
              role="Tailleur"
              name={order.tailor?.shop_name ?? "Atelier"}
              detail={
                order.type === "own_fabric"
                  ? `${garment} · Tissu fourni par le client`
                  : garment
              }
              stage={tailorStage}
              doneLabel="Livré au client"
              activeLabel="Confection en cours"
            />
          )}
        </div>
      )}
    </div>
  );
}
