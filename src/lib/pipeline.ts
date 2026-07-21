import type { OrderStatus, OrderType, UserRole } from "@/lib/constants";

/**
 * Order pipeline logic shared by the pro dashboard (tailor + vendor).
 *
 * A single order carries both a `tailor_id` and a `vendor_id`, and each pro
 * advances that same order through the stages they are responsible for:
 * the vendor prepares and ships the fabric, the tailor sews and delivers.
 * These helpers describe, for a given order type and status, whose turn it is.
 */

const TERMINAL: OrderStatus[] = ["delivered", "rejected", "cancelled"];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

// Ordered status pipeline for each order type. `full` goes through both the
// vendor (fabric) and tailor (confection) stages; the other two are shorter.
const FULL: OrderStatus[] = [
  "received",
  "accepted",
  "fabric_prepared",
  "fabric_shipped",
  "fabric_received_by_tailor",
  "in_production",
  "sewing",
  "quality_check",
  "shipped",
  "delivered",
];

const OWN_FABRIC: OrderStatus[] = [
  "received",
  "accepted",
  "in_production",
  "sewing",
  "quality_check",
  "shipped",
  "delivered",
];

const FABRIC_ONLY: OrderStatus[] = [
  "received",
  "accepted",
  "fabric_prepared",
  "fabric_shipped",
  "delivered",
];

export function timelineFor(type: OrderType): OrderStatus[] {
  if (type === "own_fabric") return OWN_FABRIC;
  if (type === "fabric_only") return FABRIC_ONLY;
  return FULL;
}

/** The next status in the pipeline, or null once the flow is complete. */
export function nextStatus(status: OrderStatus, type: OrderType): OrderStatus | null {
  const timeline = timelineFor(type);
  const i = timeline.indexOf(status);
  if (i < 0 || i >= timeline.length - 1) return null;
  return timeline[i + 1];
}

/**
 * Which role is responsible for moving the order *out of* `status`.
 * - `fabric_only`: the vendor handles the whole flow (no tailor).
 * - `own_fabric`: the tailor handles the whole flow (client brings the fabric).
 * - `full`: the vendor owns the fabric prep/ship stages, the tailor owns the rest.
 */
export function ownerOf(status: OrderStatus, type: OrderType): UserRole | null {
  if (isTerminal(status)) return null;
  if (type === "fabric_only") return "vendor";
  if (type === "own_fabric") return "tailor";
  return status === "accepted" || status === "fabric_prepared"
    ? "vendor"
    : "tailor";
}

/** True when it is this role's turn to act on the order (accept or advance). */
export function needsAction(
  role: UserRole,
  status: OrderStatus,
  type: OrderType,
): boolean {
  return ownerOf(status, type) === role;
}

// --- Actions du tailleur ---------------------------------------------------
//
// Le tailleur ne doit jamais rester bloqué. Même quand la balle est
// officiellement dans le camp du fournisseur, il peut confirmer qu'il a le
// tissu en main, puis marquer le vêtement prêt et livré. Deux gestes concrets
// plutôt qu'un pipeline à dérouler étape par étape.

const TAILOR_WORKSHOP: OrderStatus[] = [
  "fabric_received_by_tailor",
  "in_production",
  "sewing",
  "quality_check",
  "shipped",
];

/**
 * Le tissu est encore chez le fournisseur ou en route : le moment de proposer
 * « J'ai reçu le tissu ». Ne concerne que les commandes complètes — pour
 * « J'ai déjà mon tissu », c'est le client qui apporte le sien.
 */
export function tailorAwaitingFabric(status: OrderStatus, type: OrderType): boolean {
  if (type !== "full") return false;
  return (
    status === "accepted" ||
    status === "fabric_prepared" ||
    status === "fabric_shipped"
  );
}

/**
 * Le tissu est en main et le vêtement se fait, de la réception à l'expédition :
 * le moment de proposer « Marquer prêt & livré ». Pour « J'ai déjà mon tissu »,
 * le tailleur enchaîne dès l'acceptation (aucun tissu à recevoir).
 */
export function tailorInWorkshop(status: OrderStatus, type: OrderType): boolean {
  if (isTerminal(status) || type === "fabric_only") return false;
  if (type === "own_fabric") {
    return status === "accepted" || TAILOR_WORKSHOP.includes(status);
  }
  return TAILOR_WORKSHOP.includes(status);
}

// --- Contrôle admin : l'état de chaque « jambe » ---------------------------
//
// Une commande porte les deux métiers ; l'admin doit lire, d'un coup d'œil, où
// en est chacun. `legStage` traduit le statut unique de la commande en l'état
// propre à un métier, sans dérouler tout le pipeline.

export type LegStage = "active" | "done" | "cancelled";

/**
 * L'état de la part d'un métier sur une commande, tel que l'admin le contrôle.
 * `null` quand ce métier ne participe pas au type de commande (pas de tailleur
 * pour un tissu seul, pas de vendeur quand le client apporte son tissu).
 *
 * « done » = le prestataire a terminé et remis sa part : pour le vendeur d'une
 * commande complète, le tissu est expédié au tailleur (`fabric_shipped`) ; pour
 * une vente de tissu seul, il est livré au client. Pour le tailleur, le vêtement
 * est livré. C'est exactement le geste « terminé & livré » de l'espace pro.
 */
export function legStage(
  role: "tailor" | "vendor",
  status: OrderStatus,
  type: OrderType,
): LegStage | null {
  const involved = role === "vendor" ? type !== "own_fabric" : type !== "fabric_only";
  if (!involved) return null;
  if (status === "rejected" || status === "cancelled") return "cancelled";

  const timeline = timelineFor(type);
  // Le vendeur d'une commande complète a fini sa part dès que le tissu est
  // parti ; partout ailleurs, la part se termine à la livraison.
  const finish: OrderStatus =
    role === "vendor" && type !== "fabric_only" ? "fabric_shipped" : "delivered";
  return timeline.indexOf(status) >= timeline.indexOf(finish) ? "done" : "active";
}

// --- Dashboard buckets -----------------------------------------------------

/** The three piles of the pro dashboard, each one its own page. */
export type OrderBucket = "todo" | "ongoing" | "done";

/**
 * The first stage a role is responsible for — the moment the order lands on
 * their desk. A `full` order only reaches the vendor once the tailor has
 * accepted it, so the two roles start at different points of the same pipeline.
 */
function entryStatus(role: UserRole, type: OrderType): OrderStatus | null {
  return timelineFor(type).find((s) => ownerOf(s, type) === role) ?? null;
}

/**
 * Which pile an order belongs to for this role.
 *
 * An order waits in « À traiter » only until the pro takes it in hand; from
 * there it moves to « En cours » and stays there for the rest of the work —
 * that page is where the pro pushes it stage by stage, including the stretches
 * where the other party holds the ball — until it is delivered, refused or
 * cancelled and drops into « Terminé ». Bucketing on `needsAction` instead
 * would keep every stage the pro owns (sewing, quality check, shipping) piled
 * up in « À traiter », which never empties.
 */
export function bucketOf(
  role: UserRole,
  status: OrderStatus,
  type: OrderType,
): OrderBucket {
  if (isTerminal(status)) return "done";
  return status === entryStatus(role, type) ? "todo" : "ongoing";
}

export function bucketOrders<T extends { status: OrderStatus; type: OrderType }>(
  role: UserRole,
  orders: T[],
  bucket: OrderBucket,
): T[] {
  return orders.filter((o) => bucketOf(role, o.status, o.type) === bucket);
}

/** The share of an order that goes to this role. */
export function amountFor(
  role: UserRole,
  order: { fabric_price: number; tailoring_price: number },
): number {
  return role === "vendor" ? order.fabric_price : order.tailoring_price;
}

export function revenueOf(
  role: UserRole,
  orders: { fabric_price: number; tailoring_price: number }[],
): number {
  return orders.reduce((sum, o) => sum + amountFor(role, o), 0);
}

// --- Regroupement des livraisons par ville ---------------------------------
//
// Le pro expédie ses colis ville par ville : ceux qui vont au même endroit
// partent ensemble. Ces helpers décident quelles commandes ce métier livre
// lui-même au client, puis les rangent par ville de destination.

/**
 * Vrai quand ce métier remet le colis fini au *client* — donc l'expédie vers
 * la ville de livraison. Le tailleur livre le vêtement pour toute commande
 * qu'il coud ; le vendeur n'expédie directement au client que pour une vente
 * de tissu seul (sur une commande complète, le tissu part chez le tailleur,
 * pas dans la ville du client).
 */
export function deliversToClient(
  role: "tailor" | "vendor",
  type: OrderType,
): boolean {
  return role === "tailor" ? type !== "fabric_only" : type === "fabric_only";
}

/** Destination inconnue — rangée à part, toujours en fin de liste. */
export const UNKNOWN_CITY = "Ville non renseignée";

export type CityGroup<T> = { city: string; orders: T[] };

/**
 * Regroupe des commandes par ville de livraison. Les villes sont triées par
 * nombre de colis décroissant (les tournées les plus chargées d'abord), puis
 * par ordre alphabétique ; la destination inconnue ferme toujours la marche.
 */
export function groupByCity<T extends { delivery_city: string | null }>(
  orders: T[],
): CityGroup<T>[] {
  const byCity = new Map<string, T[]>();
  for (const order of orders) {
    const city = order.delivery_city?.trim() || UNKNOWN_CITY;
    const bucket = byCity.get(city);
    if (bucket) bucket.push(order);
    else byCity.set(city, [order]);
  }

  return [...byCity.entries()]
    .map(([city, list]) => ({ city, orders: list }))
    .sort((a, b) => {
      if (a.city === UNKNOWN_CITY) return 1;
      if (b.city === UNKNOWN_CITY) return -1;
      return (
        b.orders.length - a.orders.length || a.city.localeCompare(b.city, "fr")
      );
    });
}
