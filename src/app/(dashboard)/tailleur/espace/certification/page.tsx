import type { Metadata } from "next";

import { CertificationView } from "@/components/dashboard/certification-view";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Être certifié") };
}

export default function TailorCertificationPage() {
  return (
    <DashboardPage
      title="Être certifié"
      subtitle="Envoyez vos documents à JALOFA pour obtenir le badge « Certifié »."
    >
      <CertificationView kind="tailor" />
    </DashboardPage>
  );
}
