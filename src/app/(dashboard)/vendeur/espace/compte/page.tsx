import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export const metadata: Metadata = { title: "Mes informations" };

export default function VendorAccountPage() {
  return (
    <DashboardPage
      title="Mes informations"
      subtitle="Votre nom, votre téléphone et votre mot de passe."
    >
      <AccountSettings />
    </DashboardPage>
  );
}
