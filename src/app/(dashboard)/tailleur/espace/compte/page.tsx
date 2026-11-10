import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes informations") };
}

export default function TailorAccountPage() {
  return (
    <DashboardPage
      title="Mes informations"
      subtitle="Votre nom, votre téléphone et votre mot de passe."
    >
      <AccountSettings />
    </DashboardPage>
  );
}
