import type { Metadata } from "next";

import { DashboardDenied } from "@/components/dashboard/dashboard-denied";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PipelineProvider } from "@/components/dashboard/pipeline-store";
import { getProOrders } from "@/lib/dashboard-data";
import {
  getCurrentProfile,
  isSupabaseConfigured,
  proCapabilities,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Espace tailleur" };

export default async function TailorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, orders] = await Promise.all([
    getCurrentProfile(),
    getProOrders("tailor"),
  ]);

  if (isSupabaseConfigured() && profile && profile.role !== "tailor") {
    return <DashboardDenied role="tailor" />;
  }

  // Les commandes sont chargées ici, une fois pour tout l'espace : le menu et
  // les pages du pipeline y puisent (cf. pipeline-store).
  return (
    <PipelineProvider
      role="tailor"
      orders={orders}
      demo={!isSupabaseConfigured()}
    >
      <DashboardShell
        role="tailor"
        fullName={profile?.full_name ?? null}
        badges={{}}
        capabilities={proCapabilities(profile)}
      >
        {children}
      </DashboardShell>
    </PipelineProvider>
  );
}
