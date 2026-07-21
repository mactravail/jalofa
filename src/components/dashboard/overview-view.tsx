import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import type { ProRole } from "@/lib/dashboard-nav";
import { getRevenueSeries } from "@/lib/revenue-data";

const SUBTITLE: Record<ProRole, string> = {
  tailor: "L'essentiel de votre activité. Chaque section a sa page dans le menu.",
  vendor: "L'essentiel de votre boutique. Chaque section a sa page dans le menu.",
};

const CHART_TITLE: Record<ProRole, string> = {
  tailor: "Revenus de la confection",
  vendor: "Revenus des tissus",
};

/** La page d'accueil de l'espace pro : les chiffres, puis ce qui presse. */
export async function OverviewView({ role }: { role: ProRole }) {
  const series = await getRevenueSeries(role);

  return (
    <DashboardPage title="Vue d'ensemble" subtitle={SUBTITLE[role]}>
      <OverviewPanel />
      <div className="mt-8">
        <RevenueChart
          series={series}
          title={CHART_TITLE[role]}
          subtitle="Vos ventes payées, par jour, par semaine ou par mois."
        />
      </div>
    </DashboardPage>
  );
}
