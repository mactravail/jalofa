import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VendorFabricsPanel } from "@/components/dashboard/vendor-fabrics-panel";
import { getFabricCategories, getVendorFabrics } from "@/lib/data";

export const metadata: Metadata = { title: "Mes tissus" };

// Un tailleur vend son tissu sous son propre uid : c'est bien la requête vendeur
// qu'il faut ici — sa fiche boutique est créée au premier enregistrement.
export default async function TailorFabricsPage() {
  const [fabrics, categories] = await Promise.all([
    getVendorFabrics(),
    getFabricCategories(),
  ]);

  return (
    <DashboardPage
      title="Mes tissus"
      subtitle="Les tissus que vous vendez à vos clients, en plus de la confection."
    >
      <VendorFabricsPanel fabrics={fabrics} categories={categories} role="tailor" />
    </DashboardPage>
  );
}
