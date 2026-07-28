import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export const metadata: Metadata = { title: "Mon compte" };

export default function VendorAccountPage() {
  return (
    <DashboardPage
      title="Mon compte"
      subtitle="Vos informations personnelles et votre mot de passe. Votre vitrine, elle, se règle dans « Mon profil public »."
    >
      <AccountSettings />
    </DashboardPage>
  );
}
