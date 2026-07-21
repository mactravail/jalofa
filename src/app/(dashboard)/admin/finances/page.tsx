import Link from "next/link";
import {
  ArrowRight,
  Clock,
  CreditCard,
  HandCoins,
  Repeat,
  Truck,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent } from "@/components/ui/card";
import { getAllOrders } from "@/lib/admin-data";
import { getPlatformFinance } from "@/lib/payouts-data";
import { getRevenueSeries } from "@/lib/revenue-data";
import {
  PAYMENT_METHOD_LABELS,
  formatPrice,
  type PaymentMethod,
} from "@/lib/constants";

export default async function AdminFinancePage() {
  const [finance, orders, series] = await Promise.all([
    getPlatformFinance(),
    getAllOrders(),
    getRevenueSeries("platform"),
  ]);

  // Ventilation par moyen de paiement, sur les commandes réglées.
  const paid = orders.filter((o) => o.payment_status === "paid");
  const byMethod = new Map<PaymentMethod | "unknown", { total: number; count: number }>();
  for (const o of paid) {
    const key = o.payment_method ?? "unknown";
    const acc = byMethod.get(key) ?? { total: 0, count: 0 };
    acc.total += o.total_amount;
    acc.count += 1;
    byMethod.set(key, acc);
  }
  const methods = [...byMethod.entries()].sort((a, b) => b[1].total - a[1].total);

  return (
    <AdminPage
      title="Revenus"
      subtitle="Le volume d'affaires de la place et la part qui revient vraiment à JALOFA."
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          label="Volume d'affaires"
          value={formatPrice(finance.gmv)}
          hint={`${finance.paidCount} commande${finance.paidCount > 1 ? "s" : ""} réglée${finance.paidCount > 1 ? "s" : ""}`}
          accent
        />
        <StatCard
          icon={Wallet}
          label="Revenus JALOFA"
          value={formatPrice(finance.platformTotal)}
          hint="Commissions + abonnements + livraison"
        />
        <StatCard
          icon={Clock}
          label="En attente de règlement"
          value={formatPrice(finance.pendingVolume)}
          hint={`${finance.pendingCount} commande${finance.pendingCount > 1 ? "s" : ""} non réglée${finance.pendingCount > 1 ? "s" : ""}`}
        />
      </div>

      <div className="mt-4">
        <RevenueChart
          series={series}
          title="Volume d'affaires encaissé"
          subtitle="Le total payé par les clients, par jour, par semaine ou par mois."
          unit="commande"
        />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Revenus propres à JALOFA</h2>
      <Card>
        <CardContent className="divide-y p-0">
          <SourceRow
            icon={HandCoins}
            label="Commissions"
            hint="5% sur les ventes des pros au plan Gratuit"
            value={finance.commission}
            total={finance.platformTotal}
          />
          <SourceRow
            icon={Repeat}
            label="Abonnements"
            hint="Standard & Premium — 100% JALOFA"
            value={finance.subscriptions}
            total={finance.platformTotal}
          />
          <SourceRow
            icon={Truck}
            label="Frais de livraison"
            hint="Encaissés puis gardés par la plateforme"
            value={finance.delivery}
            total={finance.platformTotal}
          />
        </CardContent>
      </Card>

      <Link
        href="/admin/reversements"
        className="bg-card hover:border-primary/40 mt-3 flex items-center gap-3 rounded-xl border p-4 transition-colors"
      >
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <HandCoins className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">À reverser aux prestataires</p>
          <p className="text-muted-foreground text-xs">
            Le reste du volume encaissé, dû aux vendeurs et aux tailleurs.
          </p>
        </div>
        <span className="shrink-0 font-semibold">{formatPrice(finance.netOwed)}</span>
        <ArrowRight className="text-muted-foreground size-4 shrink-0" />
      </Link>

      <h2 className="mt-10 mb-4 text-lg font-semibold">
        Répartition du volume encaissé
      </h2>
      <p className="text-muted-foreground -mt-2 mb-4 text-sm">
        Où va l’argent payé par les clients : la part des tissus revient aux
        vendeurs, la confection aux tailleurs, la livraison à JALOFA.
      </p>
      <Card>
        <CardContent className="divide-y p-0">
          <BreakdownRow label="Tissus (part vendeurs)" value={finance.fabricRevenue} total={finance.gmv} />
          <BreakdownRow label="Confection (part tailleurs)" value={finance.tailoringRevenue} total={finance.gmv} />
          <BreakdownRow label="Frais de livraison" value={finance.delivery} total={finance.gmv} />
        </CardContent>
      </Card>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Par moyen de paiement</h2>
      {methods.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun paiement encaissé.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {methods.map(([method, { total, count }]) => (
            <div key={method} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="text-muted-foreground size-4" />
                <div>
                  <p className="font-medium">
                    {method === "unknown"
                      ? "Autre"
                      : PAYMENT_METHOD_LABELS[method]}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {count} commande{count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <p className="font-semibold">{formatPrice(total)}</p>
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function SourceRow({
  icon: Icon,
  label,
  hint,
  value,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm font-semibold">{formatPrice(value)}</p>
        </div>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <span className="text-muted-foreground w-10 shrink-0 text-right text-xs">
        {pct} %
      </span>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm font-semibold">{formatPrice(value)}</p>
        </div>
        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-muted-foreground w-10 shrink-0 text-right text-xs">
        {pct} %
      </span>
    </div>
  );
}
