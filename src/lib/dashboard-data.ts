import "server-only";

import { cache } from "react";

import type { ProRole } from "@/lib/dashboard-nav";
import { getVendorFabricSales, type FabricSale } from "@/lib/notifications-data";
import { getTailorOrders, getVendorOrders, type OrderListItem } from "@/lib/orders-data";

/**
 * Les commandes de l'espace pro. Le layout (pastilles du menu) et la page
 * affichée lisent les mêmes commandes : `cache` évite de les demander deux fois
 * à la base pour un seul rendu.
 */
export const getProOrders = cache(
  async (role: ProRole): Promise<OrderListItem[]> =>
    role === "tailor" ? getTailorOrders() : getVendorOrders(),
);

/** Idem pour les ventes de tissus : pastille du menu et page « Ventes ». */
export const getProFabricSales = cache(
  async (): Promise<FabricSale[]> => getVendorFabricSales(),
);
