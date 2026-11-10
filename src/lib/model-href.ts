import { DEDICATED_HREF } from "@/lib/garment-routes";
import type { GarmentModel } from "@/lib/types";

/**
 * `context` carries an in-progress order (type / fabric / tailor chosen before a
 * garment was) through to the detail page, which folds it back into the
 * configurator link.
 */
export function modelHref(model: GarmentModel, context?: string): string {
  // Un modèle qui a sa page dédiée y va directement : /modeles/[id] ne faisait
  // que rediriger vers `?type=<slug>` (en perdant déjà le contexte), donc on
  // économise l'aller-retour — et une route dynamique de moins à traverser.
  const dedicated = model.slug ? DEDICATED_HREF[model.slug] : undefined;
  return dedicated
    ? `${dedicated}?type=${model.slug}`
    : `/modeles/${model.id}${context ? `?${context}` : ""}`;
}
