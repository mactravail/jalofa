import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { FabricSalesPanel } from "@/components/dashboard/fabric-sales-panel";
import { getProFabricSales } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Ventes de tissus" };

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
