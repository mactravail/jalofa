import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VendorFabricRecommendations } from "@/components/dashboard/vendor-fabric-recommendations";
import { getVendorFabrics } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes recommandations") };
}

export default async function VendorRecommendationsPage() {
  const fabrics = await getVendorFabrics();

  return (
    <DashboardPage
      title="Mes recommandations"
      subtitle="Les détails de vos tissus : laize, minimum, toucher et entretien."
    >
      <VendorFabricRecommendations fabrics={fabrics} />
    </DashboardPage>
  );
}
