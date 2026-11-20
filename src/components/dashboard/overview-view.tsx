import { DemoBanner } from "@/components/demo-banner";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { getMyPayoutsReceived } from "@/lib/dashboard-data";
import { getCurrentTailor } from "@/lib/data";
import type { ProRole } from "@/lib/dashboard-nav";

/**
 * L'accueil de l'espace pro. Pas de discours : les chiffres, les commandes à
 * regarder, et le geste à faire. Le graphique des ventes est sur « Mon argent ».
 */
export async function OverviewView({ role }: { role: ProRole }) {
  const [received, tailor] = await Promise.all([
    getMyPayoutsReceived(role),
    role === "tailor" ? getCurrentTailor() : Promise.resolve(null),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <DemoBanner />
      <OverviewPanel
        role={role}
        received={received}
        specialty={tailor?.specialty ?? null}
        skillCount={(tailor?.skills?.length ?? 0) + (tailor?.custom_skills?.length ?? 0)}
      />
    </div>
  );
}
