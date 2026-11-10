import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { FabricSalesPanel } from "@/components/dashboard/fabric-sales-panel";
import { getProFabricSales } from "@/lib/dashboard-data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ventes de tissus") };
}

export default async function VendorSalesPage() {
  const sales = await getProFabricSales();

  return (
    <DashboardPage
      title="Ventes de tissus"
      subtitle="Chaque tissu acheté par un client, du plus récent au plus ancien."
    >
      <FabricSalesPanel sales={sales} />
    </DashboardPage>
  );
}
