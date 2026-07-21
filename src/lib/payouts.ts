import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor } from "@/lib/pipeline";
import {
  planCommission,
  planMonthlyPrice,
  type SubscriptionPlanId,
} from "@/lib/subscriptions";

/**
 * Les reversements de JALOFA aux prestataires.
 *
 * Toutes les commandes sont encaissées par la plateforme puis redistribuées :
 * la part « tissu » (`fabric_price`) revient au vendeur, la part « confection »
 * (`tailoring_price`) au tailleur. Sur le plan **Gratuit**, JALOFA prélève sa
 * commission (`planCommission`) ; sur les plans payants, le pro touche 100%.
 *
 * Ces fonctions sont pures : elles prennent des commandes déjà chargées et un
 * annuaire des pros (nom, ville, plan), pour tourner aussi bien sur les données
 * de démonstration que sur les vraies commandes une fois Supabase branché.
 */

/** Nom, ville et plan d'un pro, indexés par son id — cf. `proDirectory`. */
export type ProInfo = {
  name: string;
  city: string | null;
  plan: SubscriptionPlanId;
};

/** Ce que JALOFA doit reverser à un prestataire, agrégé sur ses commandes. */
export type Payout = {
  id: string;
  role: ProRole;
  name: string;
  city: string | null;
  plan: SubscriptionPlanId;
  /** Commandes payées qui alimentent ce reversement. */
  paidOrders: number;
  /** Part brute du pro sur les commandes payées (tissu ou confection). */
  gross: number;
  /** La commission gardée par JALOFA (0 hors plan Gratuit), arrondie. */
  commission: number;
  /** Ce que JALOFA doit reverser : `gross − commission`. */
  net: number;
  /** Part du pro sur des commandes pas encore réglées — à reverser plus tard. */
  pending: number;
};

/** Cumul d'une liste de reversements, pour les totaux d'en-tête. */
export type PayoutTotals = {
  gross: number;
  commission: number;
  net: number;
  pending: number;
};

/**
 * Indexe une liste de pros (vendeurs ou tailleurs) par id. Un plan absent —
 * colonne pas encore renseignée côté base — retombe sur `free`, le cas où la
 * plateforme prélève une commission (le plus prudent pour ne rien oublier de
 * ce qu'elle garde).
 */
export function proDirectory(
  pros: {
    id: string;
    shop_name: string | null;
    city: string | null;
    plan?: SubscriptionPlanId | null;
  }[],
): Map<string, ProInfo> {
  return new Map(
    pros.map((p) => [
      p.id,
      { name: p.shop_name ?? "Sans nom", city: p.city, plan: p.plan ?? "free" },
    ]),
  );
}

/**
 * Agrège, pour un métier, ce que JALOFA doit à chaque prestataire. On ne compte
 * que la part du métier concerné (`amountFor`) : une commande complète alimente
 * donc à la fois le reversement du vendeur (tissu) et celui du tailleur
 * (confection). Trié du plus gros net dû au plus petit.
 */
export function buildPayouts(
  role: ProRole,
  orders: OrderListItem[],
  directory: Map<string, ProInfo>,
): Payout[] {
  const proIdOf = (o: OrderListItem) =>
    role === "vendor" ? o.vendor_id : o.tailor_id;

  const rows = new Map<string, Payout>();

  for (const order of orders) {
    const id = proIdOf(order);
    if (!id) continue;
    const share = amountFor(role, order);
    if (share <= 0) continue;

    const info = directory.get(id);
    const row =
      rows.get(id) ??
      ({
        id,
        role,
        name: info?.name ?? "Sans nom",
        city: info?.city ?? null,
        plan: info?.plan ?? "free",
        paidOrders: 0,
        gross: 0,
        commission: 0,
        net: 0,
        pending: 0,
      } satisfies Payout);

    if (order.payment_status === "paid") {
      row.paidOrders += 1;
      row.gross += share;
    } else if (order.payment_status === "pending") {
      row.pending += share;
    }

    rows.set(id, row);
  }

  for (const row of rows.values()) {
    row.commission = Math.round(row.gross * planCommission(row.plan));
    row.net = row.gross - row.commission;
  }

  return [...rows.values()].sort((a, b) => b.net - a.net);
}

/** Cumule les reversements d'une liste (net dû, commission gardée, en attente). */
export function sumPayouts(rows: Payout[]): PayoutTotals {
  return rows.reduce<PayoutTotals>(
    (total, row) => ({
      gross: total.gross + row.gross,
      commission: total.commission + row.commission,
      net: total.net + row.net,
      pending: total.pending + row.pending,
    }),
    { gross: 0, commission: 0, net: 0, pending: 0 },
  );
}

/**
 * Le revenu d'abonnements — 100% JALOFA — d'une liste de pros : la somme de
 * leurs mensualités. Indépendant des commandes : c'est l'argent que la
 * plateforme encaisse pour elle, distinct de ce qu'elle reverse.
 */
export function subscriptionMrr(
  pros: { plan?: SubscriptionPlanId | null }[],
): number {
  return pros.reduce((sum, p) => sum + planMonthlyPrice(p.plan ?? "free"), 0);
}
