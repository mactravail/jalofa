import type { Fabric, Tailor } from "@/lib/types";
import type { OrderType } from "@/lib/constants";

/** Flat home-delivery fee, in FCFA. */
export const DELIVERY_FEE = 2000;

/**
 * Un panier livré à domicile n'est offert que si CHAQUE vêtement vient d'un
 * tailleur qui prend la livraison à sa charge. Une ligne « tissu seul » n'a pas
 * de tailleur : sa présence conserve donc les frais de livraison. Utilisé côté
 * client pour l'estimation ; le montant facturé est recalculé sur les lignes
 * `tailors` faisant foi dans les server actions de commande.
 */
export function basketHasFreeDelivery(
  items: { type: OrderType; freeDelivery: boolean }[],
): boolean {
  return (
    items.length > 0 &&
    items.every((it) => it.type !== "fabric_only" && it.freeDelivery)
  );
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
  deliveryMethod: "home" | "pickup";
}): PriceBreakdown {
  const fabricPrice =
    input.type !== "own_fabric" && input.fabric
      ? input.fabric.price_per_meter * (input.fabricMeters || 0)
      : 0;

  const tailoringPrice =
    input.type !== "fabric_only" && input.tailor ? input.tailor.base_price : 0;

  const deliveryFee = input.deliveryMethod === "home" ? DELIVERY_FEE : 0;

  return {
    fabricPrice,
    tailoringPrice,
    deliveryFee,
    total: fabricPrice + tailoringPrice + deliveryFee,
  };
}
