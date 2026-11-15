import "server-only";

import { cache } from "react";

import type { ProRole } from "@/lib/dashboard-nav";
import { getVendorFabricSales, type FabricSale } from "@/lib/notifications-data";
import { getTailorOrders, getVendorOrders, type OrderListItem } from "@/lib/orders-data";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

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

/**
 * Ce que JALOFA a déjà versé à ce pro pour ce métier : la somme de ses lignes
 * `payout` dans le registre (`order_ledger`, lisible par le pro concerné).
 */
export const getMyPayoutsReceived = cache(async (role: ProRole): Promise<number> => {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase
    .from("order_ledger" as never)
    .select("amount")
    .eq("entry_type", "payout")
    .eq("party", role)
    .eq("party_id", user.id);
  if (error || !data) return 0;
  return (data as { amount: number | string }[]).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
});
