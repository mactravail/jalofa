import type { Metadata } from "next";

import { DashboardDenied } from "@/components/dashboard/dashboard-denied";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PipelineProvider } from "@/components/dashboard/pipeline-store";
import { getProFabricSales, getProOrders } from "@/lib/dashboard-data";
import {
  getCurrentProfile,
  isSupabaseConfigured,
  proCapabilities,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Espace vendeur" };

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, orders, sales] = await Promise.all([
    getCurrentProfile(),
    getProOrders("vendor"),
    getProFabricSales(),
  ]);

  if (isSupabaseConfigured() && profile && profile.role !== "vendor") {
    return <DashboardDenied role="vendor" />;
  }

  // Les commandes sont chargées ici, une fois pour tout l'espace : le menu et
  // les pages du pipeline y puisent (cf. pipeline-store).
  return (
    <PipelineProvider
      role="vendor"
      orders={orders}
      demo={!isSupabaseConfigured()}
    >
      <DashboardShell
        role="vendor"
        fullName={profile?.full_name ?? null}
        badges={{ sales: sales.filter((s) => !s.is_read).length }}
        capabilities={proCapabilities(profile)}
      >
        {children}
      </DashboardShell>
    </PipelineProvider>
  );
}
