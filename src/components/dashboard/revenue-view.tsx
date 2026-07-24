import { Clock, Wallet } from "lucide-react";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent } from "@/components/ui/card";
import { PAYMENT_METHOD_LABELS, formatPrice } from "@/lib/constants";
import { getProOrders } from "@/lib/dashboard-data";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { getRevenueSeries } from "@/lib/revenue-data";
import { amountFor, revenueOf } from "@/lib/pipeline";

const COPY: Record<ProRole, { subtitle: string; earned: string; chart: string }> = {
  tailor: {
    subtitle: "Ce que vous rapporte la confection, commande par commande.",
    earned: "Encaissé sur la confection",
    chart: "Revenus de la confection",
  },
  vendor: {
    subtitle: "Ce que vous rapportent vos tissus, commande par commande.",
    earned: "Encaissé sur les tissus",
    chart: "Revenus des tissus",
  },
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** « Mon argent » : encaissé, en attente, et le détail par commande. */
export async function RevenueView({ role }: { role: ProRole }) {
  const [orders, series] = await Promise.all([
    getProOrders(role),
    getRevenueSeries(role),
  ]);
  const copy = COPY[role];

  // La part qui revient à ce métier — la livraison et l'autre métier sont
  // exclus, d'où l'écart avec le total payé par le client.
  const paid = orders.filter((o) => o.payment_status === "paid");
  const pending = orders.filter((o) => o.payment_status === "pending");

  return (
    <DashboardPage title="Mes revenus" subtitle={copy.subtitle}>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Card className="border-0 bg-emerald-500 text-white">
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm opacity-90">
              <Wallet className="size-4" /> {copy.earned}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatPrice(revenueOf(role, paid))}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {paid.length} commande{paid.length > 1 ? "s" : ""} payée
              {paid.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="size-4" /> En attente de paiement
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatPrice(revenueOf(role, pending))}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {pending.length} commande{pending.length > 1 ? "s" : ""} non réglée
              {pending.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <RevenueChart
          series={series}
          title={copy.chart}
          subtitle="Vos ventes payées, par jour, par semaine ou par mois."
          accent="#10b981"
        />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Détail par commande</h2>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Aucun revenu pour le moment.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {orders.map((order) => (
            <RevenueRow key={order.id} order={order} role={role} />
          ))}
        </div>
      )}
    </DashboardPage>
  );
}

function RevenueRow({ order, role }: { order: OrderListItem; role: ProRole }) {
  const paid = order.payment_status === "paid";

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground font-mono text-xs">
          {order.order_number}
        </p>
        <p className="mt-0.5 truncate font-medium">
          {order.client?.full_name ?? "Client"}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {DATE_FORMAT.format(new Date(order.created_at))}
          {order.payment_method && ` · ${PAYMENT_METHOD_LABELS[order.payment_method]}`}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={paid ? "text-primary font-semibold" : "font-semibold"}>
          {formatPrice(amountFor(role, order))}
        </p>
        <p className="text-muted-foreground text-xs">
          {paid ? "Encaissé" : "En attente"}
        </p>
      </div>
    </div>
  );
}
