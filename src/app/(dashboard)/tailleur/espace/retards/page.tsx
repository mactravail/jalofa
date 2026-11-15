import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { OrderList } from "@/components/dashboard/order-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("En retard") };
}

/** Les habits qui ont dépassé la date promise au client, le plus en retard d'abord. */
export default function TailorLatePage() {
  return (
    <DashboardPage
      title="En retard"
      subtitle="Les habits qui ont dépassé la date promise au client. Après une semaine de retard, le client peut annuler et être remboursé."
    >
      <OrderList bucket="late" empty="Aucune commande en retard. Bravo !" />
    </DashboardPage>
  );
}
