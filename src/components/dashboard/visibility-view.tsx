import { VisibilityChooser } from "@/components/dashboard/visibility-chooser";
import { getCurrentTailor, getCurrentVendor } from "@/lib/data";
import type { ProVisibility } from "@/lib/actions/visibility";

/** Lit l'état actuel des deux boutiques du pro et affiche le choix. */
export async function VisibilityView() {
  const [tailor, vendor] = await Promise.all([getCurrentTailor(), getCurrentVendor()]);
  // Visible = choisie ET ouverte : c'est exactement le filtre des annuaires publics.
  const t = Boolean(tailor?.is_active && tailor?.is_activated);
  const v = Boolean(vendor?.is_active && vendor?.is_activated);
  const initial: ProVisibility = t && v ? "both" : t ? "tailor" : v ? "vendor" : "none";
  return <VisibilityChooser initial={initial} />;
}
