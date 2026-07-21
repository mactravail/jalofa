"use client";

import { MapPin, PackageOpen } from "lucide-react";

import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet";
import { usePipeline } from "@/components/dashboard/pipeline-store";
import { OrderStatusBadge } from "@/components/order/order-status";
import { ORDER_TYPE_LABELS } from "@/lib/constants";
import type { OrderListItem } from "@/lib/orders-data";
import {
  deliversToClient,
  groupByCity,
  isTerminal,
  timelineFor,
} from "@/lib/pipeline";

/**
 * Le tri des expéditions par ville. On ne garde que ce que ce métier livre
 * lui-même au client, en livraison à domicile et pas encore livré / annulé :
 * ce sont les colis qui restent à faire partir. Chaque ville forme un lot que
 * le pro peut expédier d'un bloc.
 */
export function ShippingByCityList({ empty }: { empty: string }) {
  const { role, orders } = usePipeline();

  const toShip = orders.filter(
    (o) =>
      deliversToClient(role, o.type) &&
      o.delivery_method === "home" &&
      !isTerminal(o.status),
  );
  const groups = groupByCity(toShip);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <PackageOpen className="text-muted-foreground mx-auto size-7" />
        <p className="text-muted-foreground mt-3 text-sm">{empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <CityGroupCard
          key={group.city}
          city={group.city}
          orders={group.orders}
        />
      ))}
    </div>
  );
}

function CityGroupCard({
  city,
  orders,
}: {
  city: string;
  orders: OrderListItem[];
}) {
  // Les plus avancées d'abord : celles qui sont prêtes à partir remontent en
  // tête du lot, celles qui se font encore attendent en dessous.
  const sorted = [...orders].sort(
    (a, b) =>
      timelineFor(b.type).indexOf(b.status) -
      timelineFor(a.type).indexOf(a.status),
  );
  const count = sorted.length;

  return (
    <section className="bg-card overflow-hidden rounded-xl border">
      <header className="bg-muted/40 flex items-center gap-2 border-b px-4 py-3">
        <MapPin className="text-primary size-4 shrink-0" />
        <h2 className="font-semibold">{city}</h2>
        <span className="bg-primary/10 text-primary ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold">
          {count} colis
        </span>
      </header>
      <ul className="divide-y">
        {sorted.map((order) => (
          <li key={order.id} className="p-2">
            <ShippingRow order={order} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShippingRow({ order }: { order: OrderListItem }) {
  const title =
    order.model?.name ?? order.fabric?.name ?? ORDER_TYPE_LABELS[order.type];
  const client =
    [order.contact_first_name, order.contact_last_name]
      .filter(Boolean)
      .join(" ") ||
    order.client?.full_name ||
    "Client";

  return (
    <OrderDetailSheet order={order}>
      <div className="bg-muted size-11 shrink-0 overflow-hidden rounded-lg max-sm:hidden">
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
        <p className="mt-0.5 truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {client}
          {order.contact_phone ? ` · ${order.contact_phone}` : ""}
        </p>
      </div>
    </OrderDetailSheet>
  );
}
