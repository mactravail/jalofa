import "server-only";

import { getAllOrders, getAllTailors, getAllVendors } from "@/lib/admin-data";
import {
  buildPayouts,
  proDirectory,
  subscriptionMrr,
  sumPayouts,
  type Payout,
  type PayoutTotals,
} from "@/lib/payouts";

/**
 * La vue « argent » de l'administration, côté serveur : combien JALOFA doit
 * reverser à chaque prestataire (`getPayoutBoard`) et ce qu'elle garde pour elle
 * (`getPlatformFinance`). On s'appuie sur les lectures déjà mises en cache de
 * `admin-data`, donc appeler les deux dans une même page ne relit rien.
 */

export type PayoutBoard = {
  /** Reversements aux vendeurs de tissu (part « tissu » des commandes). */
  vendors: Payout[];
  /** Reversements aux tailleurs (part « confection » des commandes). */
  tailors: Payout[];
  /** Cumul des deux métiers : net dû, commission gardée, en attente. */
  totals: PayoutTotals & { vendorNet: number; tailorNet: number };
};

export async function getPayoutBoard(): Promise<PayoutBoard> {
  const [orders, vendors, tailors] = await Promise.all([
    getAllOrders(),
    getAllVendors(),
    getAllTailors(),
  ]);

  const vendorRows = buildPayouts("vendor", orders, proDirectory(vendors));
  const tailorRows = buildPayouts("tailor", orders, proDirectory(tailors));

  const vendorTotals = sumPayouts(vendorRows);
  const tailorTotals = sumPayouts(tailorRows);

  return {
    vendors: vendorRows,
    tailors: tailorRows,
    totals: {
      gross: vendorTotals.gross + tailorTotals.gross,
      commission: vendorTotals.commission + tailorTotals.commission,
      net: vendorTotals.net + tailorTotals.net,
      pending: vendorTotals.pending + tailorTotals.pending,
      vendorNet: vendorTotals.net,
      tailorNet: tailorTotals.net,
    },
  };
}

/** Les revenus propres à la plateforme, à distinguer de ce qu'elle reverse. */
export type PlatformFinance = {
  /** Volume d'affaires : total payé par les clients sur les commandes réglées. */
  gmv: number;
  /** Part « tissu » du volume encaissé (revient aux vendeurs). */
  fabricRevenue: number;
  /** Part « confection » du volume encaissé (revient aux tailleurs). */
  tailoringRevenue: number;
  /** Frais de livraison encaissés — gardés par JALOFA. */
  delivery: number;
  /** Commissions prélevées sur les ventes des pros au plan Gratuit. */
  commission: number;
  /** Abonnements des pros — 100% JALOFA. */
  subscriptions: number;
  /** Revenu propre total de la plateforme : commissions + abonnements + livraison. */
  platformTotal: number;
  /** Ce que JALOFA doit reverser aux prestataires (net, commissions déduites). */
  netOwed: number;
  /** Volume des commandes pas encore réglées. */
  pendingVolume: number;
  paidCount: number;
  pendingCount: number;
};

export async function getPlatformFinance(): Promise<PlatformFinance> {
  const [orders, vendors, tailors] = await Promise.all([
    getAllOrders(),
    getAllVendors(),
    getAllTailors(),
  ]);

  const paid = orders.filter((o) => o.payment_status === "paid");
  const pending = orders.filter((o) => o.payment_status === "pending");

  const vendorTotals = sumPayouts(
    buildPayouts("vendor", orders, proDirectory(vendors)),
  );
  const tailorTotals = sumPayouts(
    buildPayouts("tailor", orders, proDirectory(tailors)),
  );

  const commission = vendorTotals.commission + tailorTotals.commission;
  const subscriptions = subscriptionMrr(vendors) + subscriptionMrr(tailors);
  const delivery = paid.reduce((sum, o) => sum + o.delivery_fee, 0);

  return {
    gmv: paid.reduce((sum, o) => sum + o.total_amount, 0),
    fabricRevenue: paid.reduce((sum, o) => sum + o.fabric_price, 0),
    tailoringRevenue: paid.reduce((sum, o) => sum + o.tailoring_price, 0),
    delivery,
    commission,
    subscriptions,
    platformTotal: commission + subscriptions + delivery,
    netOwed: vendorTotals.net + tailorTotals.net,
    pendingVolume: pending.reduce((sum, o) => sum + o.total_amount, 0),
    paidCount: paid.length,
    pendingCount: pending.length,
  };
}
