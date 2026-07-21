import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Scissors,
  ShoppingBag,
  Shirt,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { OrderRow } from "@/components/admin/order-row";
import { RoleBadge } from "@/components/admin/status-badges";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getAdminStats, getAllOrders, getAllUsers } from "@/lib/admin-data";
import { getRevenueSeries } from "@/lib/revenue-data";
import { formatPrice, formatTimeAgo } from "@/lib/constants";

export default async function AdminOverviewPage() {
  const [stats, orders, users, series] = await Promise.all([
    getAdminStats(),
    getAllOrders(),
    getAllUsers(),
    getRevenueSeries("platform"),
  ]);

  const recentOrders = orders.slice(0, 5);
  const recentUsers = users.slice(0, 6);
  const pros = stats.users.tailors + stats.users.vendors;

  return (
    <AdminPage
      title="Vue d'ensemble"
      subtitle="La place de marché en un coup d'œil. Chaque section a sa page dans le menu."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          label="Volume d'affaires"
          value={formatPrice(stats.gmv)}
          hint={`${stats.orders.delivered} commande${stats.orders.delivered > 1 ? "s" : ""} livrée${stats.orders.delivered > 1 ? "s" : ""}`}
          accent
        />
        <StatCard
          icon={Wallet}
          label="Revenus plateforme"
          value={formatPrice(stats.platform.total)}
          hint="Commissions + abonnements + livraison"
        />
        <StatCard
          icon={ShoppingBag}
          label="Commandes"
          value={String(stats.orders.total)}
          hint={`${stats.orders.pending} en attente · ${stats.orders.ongoing} en cours`}
        />
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={String(stats.users.total)}
          hint={`${stats.users.clients} clients · ${pros} prestataires`}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 lg:grid-cols-4 sm:gap-4">
        <MiniStat icon={Scissors} label="Tailleurs" value={stats.catalog.tailors} href="/admin/tailleurs" />
        <MiniStat icon={Store} label="Vendeurs" value={stats.catalog.vendors} href="/admin/vendeurs" />
        <MiniStat icon={Layers} label="Tissus" value={stats.catalog.fabrics} href="/admin/tissus" />
        <MiniStat icon={Shirt} label="Modèles" value={stats.catalog.models} href="/admin/modeles" />
      </div>

      <div className="mt-6">
        <RevenueChart
          series={series}
          title="Volume d'affaires encaissé"
          subtitle="Le total payé par les clients, par jour, par semaine ou par mois."
          unit="commande"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <SectionHeader title="Dernières commandes" href="/admin/commandes" />
          {recentOrders.length === 0 ? (
            <EmptyState>Aucune commande pour le moment.</EmptyState>
          ) : (
            <div className="divide-y rounded-xl border">
              {recentOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          <SectionHeader title="Derniers inscrits" href="/admin/utilisateurs" />
          {recentUsers.length === 0 ? (
            <EmptyState>Aucun utilisateur pour le moment.</EmptyState>
          ) : (
            <div className="divide-y rounded-xl border">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {user.full_name ?? "Compte sans nom"}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.city ?? "—"} · inscrit{" "}
                      <span suppressHydrationWarning>
                        {formatTimeAgo(user.created_at)}
                      </span>
                    </p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-4 transition-colors"
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-muted-foreground mt-1 truncate text-xs">{label}</p>
      </div>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link
        href={href}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
      >
        Tout voir <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  );
}
