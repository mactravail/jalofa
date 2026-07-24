import type { Metadata } from "next";

import { DashboardDenied } from "@/components/dashboard/dashboard-denied";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PipelineProvider } from "@/components/dashboard/pipeline-store";
import { ProPending } from "@/components/dashboard/pro-pending";
import { getProOrders } from "@/lib/dashboard-data";
import {
  activatedCapabilities,
  getCurrentProfile,
  getProAccess,
  isSupabaseConfigured,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Espace tailleur" };

export default async function TailorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  const [profile, orders, access] = await Promise.all([
    getCurrentProfile(),
    getProOrders("tailor"),
    getProAccess(),
  ]);

  if (configured) {
    const shop = access.tailor;
    // Pas de boutique tailleur : l'utilisateur n'est pas tailleur — mauvais espace.
    if (!shop) return <DashboardDenied role="tailor" />;
    // Boutique créée mais pas encore ouverte par l'administration (paiement Wave
    // en attente) : écran d'attente à la place du tableau de bord.
    if (!shop.is_activated) {
      return (
        <ProPending
          kind="tailor"
          plan={shop.plan}
          fullName={profile?.full_name ?? null}
        />
      );
    }
  }

  // Les commandes sont chargées ici, une fois pour tout l'espace : le menu et
  // les pages du pipeline y puisent (cf. pipeline-store).
  return (
    <PipelineProvider role="tailor" orders={orders} demo={!configured}>
      <DashboardShell
        role="tailor"
        fullName={profile?.full_name ?? null}
        badges={{}}
        capabilities={activatedCapabilities(access)}
      >
        {children}
      </DashboardShell>
    </PipelineProvider>
  );
}
