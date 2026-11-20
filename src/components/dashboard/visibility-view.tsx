import { VisibilityChooser } from "@/components/dashboard/visibility-chooser";
import { getCurrentTailor } from "@/lib/data";
import type { ProVisibility } from "@/lib/actions/visibility";

/** Lit l'état actuel de l'atelier du tailleur et affiche le choix. */
export async function VisibilityView() {
  const tailor = await getCurrentTailor();
  // Visible = choisi ET ouvert : c'est exactement le filtre de l'annuaire public.
  const initial: ProVisibility = tailor?.is_active && tailor?.is_activated ? "tailor" : "none";
  return <VisibilityChooser initial={initial} />;
}
