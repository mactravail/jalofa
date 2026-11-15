import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TailorBodyFitsForm } from "@/components/dashboard/tailor-body-fits-form";
import { getMyBodyFits } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes métrages") };
}

export default async function TailorBodyFitsPage() {
  const fits = await getMyBodyFits();

  return (
    <DashboardPage
      title="Mes métrages"
      subtitle="Les mètres de tissu qu'il vous faut. Écrits une fois, ils s'affichent sur tous vos modèles."
    >
      <TailorBodyFitsForm fits={fits} />
    </DashboardPage>
  );
}
