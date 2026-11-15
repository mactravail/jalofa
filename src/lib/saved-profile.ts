import type { MeasurementMode } from "@/lib/constants";

/**
 * Ce que le client a enregistré « une fois pour toutes » dans son compte :
 * ses mesures, son téléphone et son adresse. À chaque commande (sur mesure,
 * prêt-à-porter, tissu), on lui demande s'il veut les réutiliser — il peut
 * avoir déménagé, changé de numéro, ou commander pour quelqu'un d'autre.
 *
 * Pas de table dédiée :
 * - les mesures sont une ligne `measurements` marquée par `SAVED_MEASUREMENT_LABEL`
 *   (les lignes des commandes n'ont pas de libellé) ;
 * - l'adresse est la ligne `addresses` du client avec `is_default = true` ;
 * - le téléphone et le nom sont ceux de `profiles`.
 */
export const SAVED_MEASUREMENT_LABEL = "Mes mesures";
export const SAVED_ADDRESS_LABEL = "Mon adresse";

export type SavedMeasurement = {
  mode: MeasurementMode;
  standard_size: string | null;
  /** Centimètres, par clé de `MEASUREMENT_FIELDS`. */
  values: Record<string, number>;
};

export type SavedAddress = {
  address_line: string;
  city: string;
  region: string | null;
  country: string;
};

export type SavedProfile = {
  full_name: string | null;
  phone: string | null;
  measurement: SavedMeasurement | null;
  address: SavedAddress | null;
};

/** Le client a-t-il enregistré au moins une coordonnée réutilisable ? */
export function hasSavedContact(p: SavedProfile | null): boolean {
  return Boolean(p && (p.phone || p.address));
}
