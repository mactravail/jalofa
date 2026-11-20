import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VendorFabricRecommendations } from "@/components/dashboard/vendor-fabric-recommendations";
import { getVendorFabrics } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Recommandations tissus") };
}

export default async function AdminShopRecommendationsPage() {
  const fabrics = await getVendorFabrics();

  return (
    <DashboardPage
      title="Recommandations tissus"
      subtitle="Les détails des tissus JALOFA : laize, minimum, toucher et entretien."
    >
      <VendorFabricRecommendations fabrics={fabrics} />
    </DashboardPage>
  );
}
