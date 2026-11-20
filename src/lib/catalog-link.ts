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

/**
 * La clé d'un habit du catalogue dans « Je sais faire » (`tailors.skills`) :
 * son slug, stable, ou son id s'il n'en a pas. `/modeles/<clé>` l'ouvre.
 */
export const skillKey = (m: GarmentModel): string => m.slug ?? m.id;

/** Les habits du catalogue qu'un tailleur sait faire, dans l'ordre du catalogue. */
export function skillModels(
  skills: string[] | undefined,
  catalog: GarmentModel[],
): GarmentModel[] {
  if (!skills || skills.length === 0) return [];
  const set = new Set(skills);
  return catalog.filter((m) => isCatalogModel(m) && set.has(skillKey(m)));
}
