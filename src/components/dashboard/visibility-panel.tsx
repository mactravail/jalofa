import { T } from "@/components/i18n/t";
import { VisibilityView } from "@/components/dashboard/visibility-view";

/**
 * « Je suis » posé en tête de « Ma page publique » : le choix tailleur / vendeur
 * de tissus / les deux se fait sur place, sans quitter la page.
 */
export function VisibilityPanel() {
  return (
    <section className="mb-6 rounded-xl border-2 border-violet-500 bg-violet-500/10 p-4">
      <h2 className="mb-3 text-lg font-bold">
        <T>Je suis</T>
      </h2>
      <VisibilityView />
    </section>
  );
}
