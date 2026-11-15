import { garmentStyleKey } from "@/lib/style-options";
import type { GarmentModel } from "@/lib/types";

/**
 * Le catalogue JALOFA (`tailor_id` null) range les créations des tailleurs :
 * chaque modèle du catalogue a sa page, où s'affichent les créations de ce type.
 *
 * Une création est rangée par son `catalog_model_id`. Les anciennes, publiées
 * avant ce rattachement, retombent sur la clé de planches (`garmentStyleKey`) :
 * une agbada reste une agbada, même sans rattachement explicite.
 */
export function belongsToCatalogModel(
  creation: GarmentModel,
  catalog: GarmentModel,
): boolean {
  if (!creation.tailor_id || catalog.tailor_id) return false;
  if (creation.catalog_model_id) return creation.catalog_model_id === catalog.id;
  const key = garmentStyleKey(catalog);
  return key !== null && garmentStyleKey(creation) === key;
}

/** Le modèle du catalogue sous lequel est rangée une création (ou `null`). */
export function catalogModelOf(
  creation: GarmentModel,
  catalog: GarmentModel[],
): GarmentModel | null {
  if (!creation.tailor_id) return null;
  return catalog.find((c) => belongsToCatalogModel(creation, c)) ?? null;
}

export const isCatalogModel = (m: GarmentModel) => m.tailor_id === null;
