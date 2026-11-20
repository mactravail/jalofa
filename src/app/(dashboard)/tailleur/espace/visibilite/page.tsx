import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VisibilityView } from "@/components/dashboard/visibility-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ma visibilité") };
}

export default function TailorVisibilityPage() {
  return (
    <DashboardPage
      title="Ma visibilité"
      subtitle="Choisissez si les clients vous trouvent dans la liste des tailleurs."
    >
      <VisibilityView />
    </DashboardPage>
  );
}
