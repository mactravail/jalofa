import type { Fabric, GarmentModel, Tailor } from "@/lib/types";
import type { OrderType } from "@/lib/constants";

/**
 * Le prix de confection facturé pour un modèle par un tailleur : le `price` de
 * la création signée fait foi chez son auteur, sinon on retombe sur le
 * `base_price` « dès… » du tailleur. Miroir client de `resolveTailoringPrice`
 * (server) pour que l'estimation affichée colle au montant facturé.
 */
export function tailoringPriceFor(
  tailor: Pick<Tailor, "id" | "base_price">,
  model: Pick<GarmentModel, "price" | "tailor_id"> | null,
): number {
  if (model && model.tailor_id === tailor.id && model.price != null) {
    return model.price;
  }
  return tailor.base_price;
}

/** Flat home-delivery fee, in FCFA. */
export const DELIVERY_FEE = 2000;

/**
 * Un panier livré à domicile n'est offert que si CHAQUE ligne vient d'un pro qui
 * prend la livraison à sa charge : le tailleur pour une tenue cousue, le vendeur
 * du tissu pour une ligne « tissu seul » (le drapeau `freeDelivery` de la ligne
 * porte donc l'offre du bon prestataire). Utilisé côté client pour l'estimation ;
 * le montant facturé est recalculé depuis les lignes faisant foi dans les server
 * actions de commande.
 */
export function basketHasFreeDelivery(
  items: { type: OrderType; freeDelivery: boolean }[],
): boolean {
  return items.length > 0 && items.every((it) => it.freeDelivery);
}

export type PriceBreakdown = {
  fabricPrice: number;
  tailoringPrice: number;
  deliveryFee: number;
  total: number;
};

export function computePrice(input: {
  type: OrderType;
  fabric: Fabric | null;
  fabricMeters: number;
  tailor: Tailor | null;
  /** Le modèle choisi, pour facturer son prix propre chez son auteur. */
  model?: GarmentModel | null;
  deliveryMethod: "home" | "pickup";
}): PriceBreakdown {
  const fabricPrice =
    input.type !== "own_fabric" && input.fabric
      ? input.fabric.price_per_meter * (input.fabricMeters || 0)
      : 0;

  const tailoringPrice =
    input.type !== "fabric_only" && input.tailor
      ? tailoringPriceFor(input.tailor, input.model ?? null)
      : 0;

  const deliveryFee = input.deliveryMethod === "home" ? DELIVERY_FEE : 0;

  return {
    fabricPrice,
    tailoringPrice,
    deliveryFee,
    total: fabricPrice + tailoringPrice + deliveryFee,
  };
}
