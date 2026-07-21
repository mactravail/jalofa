import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VendorFabricsPanel } from "@/components/dashboard/vendor-fabrics-panel";
import { getFabricCategories, getVendorFabrics } from "@/lib/data";

export const metadata: Metadata = { title: "Mes tissus" };

export default async function VendorFabricsPage() {
  const [fabrics, categories] = await Promise.all([
    getVendorFabrics(),
    getFabricCategories(),
  ]);

  return (
    <DashboardPage
      title="Mes tissus"
      subtitle="Votre boutique de tissus : prix au mètre, stock et visibilité au catalogue."
    >
      <VendorFabricsPanel fabrics={fabrics} categories={categories} role="vendor" />
    </DashboardPage>
  );
}
