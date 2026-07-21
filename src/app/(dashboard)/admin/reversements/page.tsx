import type { Metadata } from "next";
import { Clock, HandCoins, Scissors, Store, Wallet } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { PayoutList } from "@/components/admin/payout-list";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/constants";
import { getPayoutBoard } from "@/lib/payouts-data";

export const metadata: Metadata = { title: "Reversements" };

export default async function AdminPayoutsPage() {
  const board = await getPayoutBoard();
  const { totals } = board;

  return (
    <AdminPage
      title="Reversements"
      subtitle="JALOFA encaisse chaque commande, puis reverse à chaque prestataire — moins sa commission sur le plan Gratuit."
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={HandCoins}
          label="À reverser aux prestataires"
          value={formatPrice(totals.net)}
          hint="Net dû, commissions déduites"
          accent
        />
        <StatCard
          icon={Wallet}
          label="Commissions JALOFA"
          value={formatPrice(totals.commission)}
          hint="Sur les ventes des pros au plan Gratuit"
        />
        <StatCard
          icon={Clock}
          label="En attente d'encaissement"
          value={formatPrice(totals.pending)}
          hint="Sera dû une fois la commande réglée"
        />
      </div>

      <section className="mt-10">
        <SectionHeader
          icon={Store}
          title="Vendeurs de tissus"
          net={totals.vendorNet}
        />
        <PayoutList
          rows={board.vendors}
          grossLabel="Part tissu (brut)"
          emptyLabel="Aucune vente de tissu encaissée."
        />
      </section>

      <section className="mt-10">
        <SectionHeader
          icon={Scissors}
          title="Tailleurs"
          net={totals.tailorNet}
        />
        <PayoutList
          rows={board.tailors}
          grossLabel="Part confection (brut)"
          emptyLabel="Aucune prestation de confection encaissée."
        />
      </section>
    </AdminPage>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  net,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  net: number;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="text-muted-foreground size-5" /> {title}
      </h2>
      <p className="text-muted-foreground text-sm">
        Total à reverser{" "}
        <span className="text-foreground font-semibold">{formatPrice(net)}</span>
      </p>
    </div>
  );
}
