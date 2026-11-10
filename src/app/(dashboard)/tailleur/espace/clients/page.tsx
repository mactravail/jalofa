import type { Metadata } from "next";

import { ClientsList } from "@/components/dashboard/clients-view";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes clients") };
}

export default function TailorClientsPage() {
  return (
    <DashboardPage
      title="Mes clients"
      subtitle="Chaque client, ce que vous lui avez fait et ses retours (retouches, problèmes)."
    >
      <ClientsList role="tailor" />
    </DashboardPage>
  );
}
