import { Clock, Wallet } from "lucide-react";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent } from "@/components/ui/card";
import { PAYMENT_METHOD_LABELS, formatPrice } from "@/lib/constants";
import { getProOrders } from "@/lib/dashboard-data";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { getRevenueSeries } from "@/lib/revenue-data";
import {
  amountFor,
  moneyHeldForReceipt,
  moneyReleased,
  revenueOf,
} from "@/lib/pipeline";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/config";

const COPY: Record<ProRole, { subtitle: string; earned: string; chart: string }> = {
  tailor: {
    subtitle: "Ce que vous rapporte la confection, commande par commande.",
    earned: "Encaissé sur la confection",
    chart: "Revenus de la confection",
  },
  vendor: {
    subtitle:
      "Vous recevez votre argent quand le tissu est reçu par le tailleur ou le client.",
    earned: "Encaissé sur les tissus",
    chart: "Revenus des tissus",
  },
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** « Mon argent » : encaissé, en attente, et le détail par commande. */
export async function RevenueView({ role }: { role: ProRole }) {
  const [orders, series] = await Promise.all([
    getProOrders(role),
    getRevenueSeries(role),
  ]);
  const copy = COPY[role];
  const t = await getT();
  const locale = intlLocale(await getLocale());

  // La part qui revient à ce métier — la livraison et l'autre métier sont
  // exclus, d'où l'écart avec le total payé par le client.
  const paid = orders.filter((o) => moneyReleased(role, o));
  // Le vendeur attend la réception du tissu ; le tailleur, le paiement du client.
  const pending =
    role === "vendor"
      ? orders.filter((o) => moneyHeldForReceipt(role, o))
      : orders.filter((o) => o.payment_status === "pending");

  return (
    <DashboardPage title="Ce que j'ai gagné" subtitle={copy.subtitle}>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Card className="border-0 bg-emerald-500 text-white">
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm opacity-90">
              <Wallet className="size-4" /> {t(copy.earned)}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatPrice(revenueOf(role, paid))}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {paid.length > 1 ? t("{n} commandes payées", { n: paid.length }) : t("{n} commande payée", { n: paid.length })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="size-4" />{" "}
              {role === "vendor" ? t("En attente de réception du tissu") : t("En attente de paiement")}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatPrice(revenueOf(role, pending))}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {role === "vendor"
                ? pending.length > 1 ? t("{n} commandes", { n: pending.length }) : t("{n} commande", { n: pending.length })
                : pending.length > 1 ? t("{n} commandes non réglées", { n: pending.length }) : t("{n} commande non réglée", { n: pending.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <RevenueChart
          series={series}
          title={t(copy.chart)}
          subtitle={t("Vos ventes payées, par jour, par semaine ou par mois.")}
          accent="#10b981"
        />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">{t("Détail par commande")}</h2>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {t("Aucun revenu pour le moment.")}
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {orders.map((order) => (
            <RevenueRow key={order.id} order={order} role={role} t={t} locale={locale} />
          ))}
        </div>
      )}
    </DashboardPage>
  );
}

function RevenueRow({
  order,
  role,
  t,
  locale,
}: {
  order: OrderListItem;
  role: ProRole;
  t: (text: string) => string;
  locale: string;
}) {
  const paid = moneyReleased(role, order);
  const held = moneyHeldForReceipt(role, order);

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground font-mono text-xs">
          {order.order_number}
        </p>
        <p className="mt-0.5 truncate font-medium">
          {order.model?.name ?? order.fabric?.name ?? t("Commande")}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {new Date(order.created_at).toLocaleDateString(locale, DATE_OPTIONS)}
          {order.payment_method && ` · ${t(PAYMENT_METHOD_LABELS[order.payment_method])}`}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={paid ? "text-primary font-semibold" : "font-semibold"}>
          {formatPrice(amountFor(role, order))}
        </p>
        <p className="text-muted-foreground text-xs">
          {paid
            ? t("Encaissé")
            : held
              ? order.fabric_return
                ? t("Retour en cours")
                : t("Tissu pas encore reçu")
              : t("En attente")}
        </p>
      </div>
    </div>
  );
}
