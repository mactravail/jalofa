import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VisibilityView } from "@/components/dashboard/visibility-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Je suis") };
}

export default function VendorVisibilityPage() {
  return (
    <DashboardPage
      title="Je suis"
      subtitle=""
    >
      <VisibilityView />
    </DashboardPage>
  );
}
