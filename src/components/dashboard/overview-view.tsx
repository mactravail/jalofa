import { DemoBanner } from "@/components/demo-banner";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import type { ProRole } from "@/lib/dashboard-nav";
import { getCurrentProfile } from "@/lib/queries";
import { getRevenueSeries } from "@/lib/revenue-data";

const CHART_TITLE: Record<ProRole, string> = {
  tailor: "Revenus de la confection",
  vendor: "Revenus des tissus",
};

/** Vert émeraude : la couleur de l'argent, sur tout l'espace pro. */
const MONEY = "#10b981";

/** La page d'accueil de l'espace pro : bonjour, les chiffres, puis ce qui presse. */
export async function OverviewView({ role }: { role: ProRole }) {
  const [series, profile] = await Promise.all([
    getRevenueSeries(role),
    getCurrentProfile(),
  ]);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl">
      <DemoBanner />
      <OverviewPanel role={role} firstName={firstName} />
      <div className="mt-8">
        <RevenueChart
          series={series}
          title={CHART_TITLE[role]}
          subtitle="Vos ventes payées, par jour, par semaine ou par mois."
          accent={MONEY}
        />
      </div>
    </div>
  );
}
