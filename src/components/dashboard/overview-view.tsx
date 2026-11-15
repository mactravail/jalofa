import { DemoBanner } from "@/components/demo-banner";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { getMyPayoutsReceived } from "@/lib/dashboard-data";
import type { ProRole } from "@/lib/dashboard-nav";

/**
 * L'accueil de l'espace pro. Pas de discours : les chiffres, les commandes à
 * regarder, et le geste à faire. Le graphique des ventes est sur « Mon argent ».
 */
export async function OverviewView({ role }: { role: ProRole }) {
  const received = await getMyPayoutsReceived(role);
  return (
    <div className="mx-auto max-w-4xl">
      <DemoBanner />
      <OverviewPanel role={role} received={received} />
    </div>
  );
}
