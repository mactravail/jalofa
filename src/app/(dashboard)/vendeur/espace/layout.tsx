import type { Metadata } from "next";

import { DashboardDenied } from "@/components/dashboard/dashboard-denied";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PipelineProvider } from "@/components/dashboard/pipeline-store";
import { ProPending } from "@/components/dashboard/pro-pending";
import { getProFabricSales, getProOrders } from "@/lib/dashboard-data";
import {
  activatedCapabilities,
  getCurrentProfile,
  getProAccess,
  isSupabaseConfigured,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Espace vendeur" };

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  const [profile, orders, sales, access] = await Promise.all([
    getCurrentProfile(),
    getProOrders("vendor"),
    getProFabricSales(),
    getProAccess(),
  ]);

  if (configured) {
    const shop = access.vendor;
    // Pas de boutique vendeur : l'utilisateur n'est pas vendeur — mauvais espace.
    if (!shop) return <DashboardDenied role="vendor" />;
    // Boutique créée mais pas encore ouverte par l'administration (paiement Wave
    // en attente) : écran d'attente à la place du tableau de bord.
    if (!shop.is_activated) {
      return (
        <ProPending
          kind="vendor"
          plan={shop.plan}
          fullName={profile?.full_name ?? null}
        />
      );
    }
  }

  // Les commandes sont chargées ici, une fois pour tout l'espace : le menu et
  // les pages du pipeline y puisent (cf. pipeline-store).
  return (
    <PipelineProvider role="vendor" orders={orders} demo={!configured}>
      <DashboardShell
        role="vendor"
        fullName={profile?.full_name ?? null}
        badges={{ sales: sales.filter((s) => !s.is_read).length }}
        capabilities={activatedCapabilities(access)}
      >
        {children}
      </DashboardShell>
    </PipelineProvider>
  );
}
