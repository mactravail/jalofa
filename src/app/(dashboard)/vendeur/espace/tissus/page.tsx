import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VendorFabricsPanel } from "@/components/dashboard/vendor-fabrics-panel";
import { getCurrentVendor, getFabricCategories, getVendorFabrics } from "@/lib/data";
import { isEuropeCountry } from "@/lib/europe";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes tissus") };
}

export default async function VendorFabricsPage() {
  const [fabrics, categories, shop] = await Promise.all([
    getVendorFabrics(),
    getFabricCategories(),
    getCurrentVendor(),
  ]);

  return (
    <DashboardPage
      title="Mes tissus"
      subtitle="Votre boutique de tissus : prix au mètre, stock et visibilité au catalogue."
    >
      <VendorFabricsPanel fabrics={fabrics} categories={categories} europe={isEuropeCountry(shop?.country)} role="vendor" />
    </DashboardPage>
  );
}
