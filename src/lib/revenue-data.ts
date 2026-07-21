import "server-only";

import { getAllOrders } from "@/lib/admin-data";
import { getProOrders } from "@/lib/dashboard-data";
import { amountFor } from "@/lib/pipeline";
import { isSupabaseConfigured } from "@/lib/queries";
import { demoRevenueEvents, type RevenueChannel } from "@/lib/revenue-demo";
import {
  buildRevenueSeries,
  type RevenueEvent,
  type RevenueSeries,
} from "@/lib/revenue-series";

/**
 * La courbe des revenus d'un métier (ou de la plateforme), prête pour le graph.
 *
 * En démo, on trace l'historique fabriqué (`demoRevenueEvents`) : douze mois de
 * ventes plausibles, là où les fixtures n'en ont que six. Une fois Supabase
 * branché, on agrège les vraies commandes payées — la part du métier pour un
 * pro (`amountFor`), le total encaissé pour la plateforme.
 */
export async function getRevenueSeries(
  channel: RevenueChannel,
): Promise<RevenueSeries> {
  if (!isSupabaseConfigured()) {
    return buildRevenueSeries(demoRevenueEvents(channel));
  }

  let events: RevenueEvent[];
  if (channel === "platform") {
    const orders = await getAllOrders();
    events = orders
      .filter((o) => o.payment_status === "paid")
      .map((o) => ({ date: o.created_at, amount: o.total_amount }));
  } else {
    const orders = await getProOrders(channel);
    events = orders
      .filter((o) => o.payment_status === "paid")
      .map((o) => ({ date: o.created_at, amount: amountFor(channel, o) }));
  }

  return buildRevenueSeries(events);
}
