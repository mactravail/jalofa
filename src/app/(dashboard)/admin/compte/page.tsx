import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";
import { AdminPage } from "@/components/admin/admin-page";

export const metadata: Metadata = { title: "Mon compte" };

export default function AdminAccountPage() {
  return (
    <AdminPage
      title="Mon compte"
      subtitle="Vos informations et votre mot de passe. Un compte administrateur ouvre tout le marché : soignez ce mot de passe."
    >
      <AccountSettings />
    </AdminPage>
  );
}
