import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import {
  amountFor,
  deliveryShareFor,
  moneyHeldForReceipt,
  moneyReleased,
} from "@/lib/pipeline";
import { completionShares, toWorkflowOrder } from "@/lib/order-workflow";
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
 * (`tailoring_price`) au tailleur, et la livraison à celui qui livre le client. Sur
 * le plan **Gratuit**, JALOFA prélève sa commission (`planCommission`) sur le tissu
 * et la confection, jamais sur la livraison ; sur les plans payants, le pro touche
 * 100%.
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
  /** Part brute du pro sur les commandes payées (tissu ou confection, et livraison). */
  gross: number;
  /** Ce qui, dans `gross`, vient de la livraison : sans commission. */
  delivery: number;
  /** La commission gardée par JALOFA (0 hors plan Gratuit), arrondie. */
  commission: number;
  /**
   * Offre Pro « payée à la première vente » : la part de son prix retenue sur
   * ce reversement (cf. `applyDeferredFees`). 0 sinon.
   */
  proFee: number;
  /** Ce que JALOFA doit reverser : `gross − commission − proFee`. */
  net: number;
  /** Part du pro sur des commandes pas encore réglées — à reverser plus tard. */
  pending: number;
  /** Vendeur : payé par le client, retenu jusqu'à la réception du tissu. */
  held: number;
  /** Déjà versé d'après le registre (`order_ledger`, type `payout`). */
  alreadyPaid: number;
  /**
   * Ce qui reste à verser, commande par commande (net de commission et de
   * `proFee`) — ce que « Marquer versé » inscrit au registre.
   */
  lines: { orderId: string; amount: number }[];
};

/** Une écriture du registre, telle que la lit l'administration. */
export type PayoutLedgerEntry = {
  order_id: string;
  entry_type: string;
  party: string;
  party_id: string | null;
  amount: number;
};

/** Ces parts reviennent entières à celui qui livre : jamais de commission. */
const NO_COMMISSION_KINDS = new Set(["delivery_out", "delivery_garment", "delivery_return", "compensation"]);

/** Cumul d'une liste de reversements, pour les totaux d'en-tête. */
export type PayoutTotals = {
  gross: number;
  commission: number;
  proFee: number;
  net: number;
  pending: number;
  held: number;
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
  ledger: PayoutLedgerEntry[] = [],
): Payout[] {
  const proIdOf = (o: OrderListItem) =>
    role === "vendor" ? o.vendor_id : o.tailor_id;

  // Registre : parts décidées à l'annulation, et versements déjà faits, par commande.
  const decided = new Map<string, PayoutLedgerEntry[]>();
  const paidOut = new Map<string, number>();
  for (const e of ledger) {
    if (e.party !== role || !e.party_id) continue;
    const key = `${e.order_id}:${e.party_id}`;
    if (e.entry_type === "payout") paidOut.set(key, (paidOut.get(key) ?? 0) + e.amount);
    else if (!["payment", "refund", "provider_fee", "payout_fee", "adjustment"].includes(e.entry_type)) {
      decided.set(key, [...(decided.get(key) ?? []), e]);
    }
  }

  const rows = new Map<string, Payout>();
  const rowFor = (id: string) => {
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
        delivery: 0,
        commission: 0,
        proFee: 0,
        net: 0,
        pending: 0,
        held: 0,
        alreadyPaid: 0,
        lines: [],
      } satisfies Payout);
    rows.set(id, row);
    return row;
  };

  for (const order of orders) {
    const id = proIdOf(order);
    if (!id) continue;
    const key = `${order.id}:${id}`;

    // Ce que la commande doit à ce pro : ses parts si elle aboutit (tissu et
    // couture distincts, aller du tissu compris), sinon ce que JALOFA a décidé
    // à l'annulation (indemnité 35 %, tissu dû, trajet effectué).
    let parts: { kind: string; amount: number }[];
    let released: boolean;
    if (decided.has(key)) {
      parts = decided.get(key)!.map((e) => ({ kind: e.entry_type, amount: e.amount }));
      released = true;
    } else {
      parts = completionShares(toWorkflowOrder(order))
        .filter((l) => l.party === role && l.partyId === id)
        .map((l) => ({ kind: l.kind, amount: l.amount }));
      // Repli sur l'ancien calcul pour une commande sans ventilation (démo).
      if (parts.length === 0 && amountFor(role, order) > 0) {
        parts = [{ kind: role === "vendor" ? "fabric" : "tailoring", amount: amountFor(role, order) }];
        const delivery = deliveryShareFor(role, order);
        if (delivery > 0) {
          parts[0].amount -= delivery;
          parts.push({ kind: "delivery_garment", amount: delivery });
        }
      }
      released = moneyReleased(role, order);
    }

    const share = parts.reduce((s, p) => s + p.amount, 0);
    if (share <= 0) continue;
    const row = rowFor(id);

    if (released) {
      const delivery = parts.filter((p) => NO_COMMISSION_KINDS.has(p.kind)).reduce((s, p) => s + p.amount, 0);
      const commission = Math.round((share - delivery) * planCommission(row.plan));
      const already = paidOut.get(key) ?? 0;
      row.paidOrders += 1;
      row.gross += share;
      row.delivery += delivery;
      row.commission += commission;
      row.alreadyPaid += already;
      const left = share - commission - already;
      if (left > 0) row.lines.push({ orderId: order.id, amount: left });
    } else if (moneyHeldForReceipt(role, order)) {
      row.held += share;
    } else if (order.payment_status === "pending") {
      row.pending += share;
    }
  }

  for (const row of rows.values()) {
    row.net = row.lines.reduce((s, l) => s + l.amount, 0);
  }

  return [...rows.values()].sort((a, b) => b.net - a.net);
}

/**
 * Retient le prix de l'offre Pro « payée à la première vente » sur ce que
 * JALOFA doit au pro. Un compte pro tient l'atelier ET la boutique (même id) :
 * on puise d'abord dans le reversement tailleur, puis dans le vendeur, sans
 * jamais rendre un net négatif. Ce qui n'est pas encore couvert attend les
 * ventes suivantes. Modifie les lignes en place.
 */
export function applyDeferredFees(
  rowSets: Payout[][],
  dues: Map<string, number>,
): void {
  const left = new Map(dues);
  for (const rows of rowSets) {
    for (const row of rows) {
      const due = left.get(row.id) ?? 0;
      if (due <= 0 || row.net <= 0) continue;
      const take = Math.min(due, row.net);
      row.proFee += take;
      row.net -= take;
      left.set(row.id, due - take);
      // La retenue réduit aussi les lignes à verser, des plus grosses aux plus petites.
      let rest = take;
      for (const line of [...row.lines].sort((a, b) => b.amount - a.amount)) {
        if (rest <= 0) break;
        const cut = Math.min(rest, line.amount);
        line.amount -= cut;
        rest -= cut;
      }
      row.lines = row.lines.filter((l) => l.amount > 0);
    }
    rows.sort((a, b) => b.net - a.net);
  }
}

/** Cumule les reversements d'une liste (net dû, commission gardée, en attente). */
export function sumPayouts(rows: Payout[]): PayoutTotals {
  return rows.reduce<PayoutTotals>(
    (total, row) => ({
      gross: total.gross + row.gross,
      commission: total.commission + row.commission,
      proFee: total.proFee + row.proFee,
      net: total.net + row.net,
      pending: total.pending + row.pending,
      held: total.held + row.held,
    }),
    { gross: 0, commission: 0, proFee: 0, net: 0, pending: 0, held: 0 },
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
