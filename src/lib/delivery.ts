/**
 * Où la livraison d'un produit est gratuite. JALOFA ne livre rien : chaque pro le
 * décide pour chacun de ses tissus et de ses modèles. La même règle sert à
 * l'estimation côté client et au montant facturé côté serveur.
 */

import { isEuropeCountry } from "@/lib/europe";

export type FreeDeliveryZone = "none" | "dakar" | "senegal" | "europe" | "world";

export const FREE_DELIVERY_ZONES: { value: FreeDeliveryZone; label: string }[] = [
  { value: "senegal", label: "Gratuite dans tout le Sénégal (conseillé)" },
  { value: "dakar", label: "Gratuite à Dakar seulement" },
  { value: "world", label: "Gratuite partout dans le monde" },
  { value: "none", label: "Payée par le client (GP ou livreur)" },
];

/**
 * Les choix d'un pro installé en Europe (JALOFA EUROPE) : « toute l'Europe »
 * remplace Dakar et le Sénégal, qui n'ont pas de sens depuis Milan.
 */
export const EUROPE_DELIVERY_ZONES: { value: FreeDeliveryZone; label: string }[] = [
  { value: "europe", label: "Gratuite dans toute l'Europe (conseillé)" },
  { value: "world", label: "Gratuite partout dans le monde" },
  { value: "none", label: "Payée par le client (transporteur)" },
];
export const EUROPE_RECOMMENDED_ZONE: FreeDeliveryZone = "europe";
export const EUROPE_DELIVERY_ADVICE =
  "Conseil : gratuite dans toute l'Europe. Ailleurs, le client paie le transporteur.";

/** Ce que JALOFA conseille aux pros, et le choix proposé sur un nouveau produit. */
export const RECOMMENDED_DELIVERY_ZONE: FreeDeliveryZone = "senegal";
export const DELIVERY_ADVICE =
  "Conseil : gratuite dans tout le Sénégal. À l'étranger, le client paie le GP.";

const ZONE_POLICY: Record<FreeDeliveryZone, string> = {
  none: "Livraison payée par le client, directement au GP ou au livreur.",
  dakar: "Livraison gratuite à Dakar. Ailleurs, le client paie directement le GP ou le livreur.",
  senegal: "Livraison gratuite dans tout le Sénégal. À l'étranger, le client paie directement le GP.",
  europe: "Livraison gratuite dans toute l'Europe. Ailleurs, le client paie directement le transporteur.",
  world: "Livraison gratuite partout dans le monde.",
};

/**
 * Ce que le pro a dit sur la livraison de ce produit, tel quel. JALOFA n'ajoute
 * aucun frais à un achat direct : hors de la zone gratuite, le client règle
 * directement le GP ou le livreur.
 */
export function deliveryPolicy(zone: FreeDeliveryZone | null | undefined): string {
  return ZONE_POLICY[zone ?? "none"];
}

/** Le choix du formulaire, ramené aux valeurs permises. */
export function parseDeliveryZone(value: unknown): FreeDeliveryZone {
  return (
    [...FREE_DELIVERY_ZONES, ...EUROPE_DELIVERY_ZONES].find((z) => z.value === value)?.value ??
    "none"
  );
}

export type DeliveryDestination = {
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Les communes de la région de Dakar, souvent écrites sans le mot « Dakar ». */
const DAKAR_AREA = ["dakar", "pikine", "guediawaye", "rufisque", "keur massar"];

function inSenegal(destination: DeliveryDestination): boolean {
  const country = normalize(destination.country);
  return !country || country.includes("senegal");
}

function inDakar(destination: DeliveryDestination): boolean {
  if (!inSenegal(destination)) return false;
  const place = `${normalize(destination.city)} ${normalize(destination.region)}`;
  return DAKAR_AREA.some((name) => place.includes(name));
}

/**
 * La livraison est-elle offerte vers cette destination ? Sans destination
 * connue (panier), seule une offre mondiale est certaine.
 */
export function tailorDeliversFree(
  zone: FreeDeliveryZone,
  destination: DeliveryDestination | null,
): boolean {
  if (zone === "world") return true;
  if (zone === "none" || !destination) return false;
  if (zone === "europe") return isEuropeCountry(destination.country);
  return zone === "dakar" ? inDakar(destination) : inSenegal(destination);
}
