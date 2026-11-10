import type { Metadata } from "next";

import { ClientsList } from "@/components/dashboard/clients-view";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes clients") };
}

export default function VendorClientsPage() {
  return (
    <DashboardPage
      title="Mes clients"
      subtitle="Chaque client, ce qu'il vous a acheté et ses retours (tissu renvoyé, problèmes)."
    >
      <ClientsList role="vendor" />
    </DashboardPage>
  );
}
