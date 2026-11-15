import "server-only";

import type { OrderType } from "@/lib/constants";
import type { DeliveryOption } from "@/lib/order-workflow";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Les frais de livraison d'une ligne de panier, au tarif que CHAQUE PRO a fixé
 * sur son profil (`vendors.ship_fee_*`, `tailors.ship_fee_*`, décision du
 * 2026-11-13). JALOFA n'invente aucun tarif (cahier des charges §17).
 *
 * - Tissu qui voyage (tissu d'un vendeur, ou tissu seul) : tarif du vendeur.
 * - Vêtement fini : tarif du tailleur.
 * - Tissu du client : il l'envoie lui-même, à ses frais — rien ici.
 * - Tissu du tailleur : rien ne voyage avant la couture.
 *
 * Tarif absent (`null`) : en économique, la livraison se règle au livreur comme
 * avant (`unknown`) ; l'express, payé d'avance, n'est alors pas proposé.
 */
export type LineFees = {
  fabric: number;
  garment: number;
  /** Au moins un tarif manque : livraison à régler directement au livreur. */
  unknown: boolean;
};

export type LineDeliveryQuote = Record<DeliveryOption, LineFees | null>;

export type DeliveryLine = {
  type: OrderType;
  fabric_id: string | null;
  tailor_id: string | null;
};

type Tariff = { ship_fee_economy: number | null; ship_fee_express: number | null };

const feeOf = (t: Tariff | undefined, option: DeliveryOption): number | null => {
  const v = option === "express" ? t?.ship_fee_express : t?.ship_fee_economy;
  return v == null ? null : Math.max(0, Math.round(Number(v)));
};

export async function quoteLines(
  supabase: ServerClient,
  lines: DeliveryLine[],
): Promise<LineDeliveryQuote[]> {
  const fabricIds = [...new Set(lines.map((l) => l.fabric_id).filter(Boolean))] as string[];
  const { data: fabrics } = fabricIds.length
    ? await supabase.from("fabrics").select("id, vendor_id").in("id", fabricIds)
    : { data: [] };
  const vendorOfFabric = new Map(
    ((fabrics ?? []) as { id: string; vendor_id: string | null }[]).map((f) => [f.id, f.vendor_id]),
  );

  const vendorIds = [...new Set([...vendorOfFabric.values()].filter(Boolean))] as string[];
  const tailorIds = [...new Set(lines.map((l) => l.tailor_id).filter(Boolean))] as string[];
  // Colonnes ajoutées par 20260826000001 ; sans elles, aucun tarif (économique seul).
  const [{ data: vendors }, { data: tailors }] = await Promise.all([
    vendorIds.length
      ? supabase.from("vendors").select("id, ship_fee_economy, ship_fee_express").in("id", vendorIds)
      : Promise.resolve({ data: [] }),
    tailorIds.length
      ? supabase.from("tailors").select("id, ship_fee_economy, ship_fee_express").in("id", tailorIds)
      : Promise.resolve({ data: [] }),
  ]);
  const vendorTariff = new Map(((vendors ?? []) as unknown as (Tariff & { id: string })[]).map((v) => [v.id, v]));
  const tailorTariff = new Map(((tailors ?? []) as unknown as (Tariff & { id: string })[]).map((t) => [t.id, t]));

  return lines.map((line) => {
    const vendorId = line.fabric_id && line.type !== "own_fabric" ? vendorOfFabric.get(line.fabric_id) ?? null : null;
    const tailorOwnsFabric = line.type === "full" && Boolean(vendorId) && vendorId === line.tailor_id;
    const fabricTravels = line.type === "fabric_only" || (line.type === "full" && Boolean(vendorId) && !tailorOwnsFabric);
    const garmentTravels = line.type !== "fabric_only";

    const forOption = (option: DeliveryOption): LineFees | null => {
      const fabric = fabricTravels ? feeOf(vendorId ? vendorTariff.get(vendorId) : undefined, option) : 0;
      const garment = garmentTravels ? feeOf(line.tailor_id ? tailorTariff.get(line.tailor_id) : undefined, option) : 0;
      if (option === "express" && (fabric === null || garment === null)) return null;
      return { fabric: fabric ?? 0, garment: garment ?? 0, unknown: fabric === null || garment === null };
    };

    return { economy: forOption("economy"), express: forOption("express") };
  });
}
