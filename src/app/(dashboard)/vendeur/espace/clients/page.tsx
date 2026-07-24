import type { Metadata } from "next";

import { ClientsList } from "@/components/dashboard/clients-view";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export const metadata: Metadata = { title: "Mes clients" };

export default function VendorClientsPage() {
  return (
    <DashboardPage
      title="Mes clients"
      subtitle="Les personnes qui ont acheté vos tissus. Rappelez-les d'un geste."
    >
      <ClientsList role="vendor" />
    </DashboardPage>
  );
}
