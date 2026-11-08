import { DemoBanner } from "@/components/demo-banner";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import type { ProRole } from "@/lib/dashboard-nav";
import { getCurrentTailor, getCurrentVendor } from "@/lib/data";

/**
 * L'accueil de l'espace pro. Pas de discours : les chiffres, les commandes à
 * regarder, et le geste à faire. Le graphique des ventes est sur « Mon argent ».
 */
export async function OverviewView({ role }: { role: ProRole }) {
  const pro = await (role === "tailor" ? getCurrentTailor() : getCurrentVendor());

  return (
    <div className="mx-auto max-w-4xl">
      <DemoBanner />
      <OverviewPanel
        role={role}
        // Sans moyen de paiement renseigné, le pro ne peut pas être réglé.
        needsPayout={pro != null && !pro.payout_method}
      />
    </div>
  );
}
