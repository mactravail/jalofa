/**
 * Agrégation des revenus dans le temps — le socle des courbes des dashboards.
 *
 * On prend une liste de ventes datées et on la replie en trois séries prêtes à
 * tracer : par jour (30 derniers), par semaine (12 dernières) et par mois (12
 * derniers). Chaque créneau de la fenêtre est présent, même à zéro, pour que la
 * courbe soit continue plutôt que trouée.
 *
 * Module pur (aucune dépendance serveur) : calculé côté serveur, sérialisé, puis
 * simplement dessiné côté client — la même série des deux côtés, zéro décalage
 * d'hydratation.
 */

export type Granularity = "day" | "week" | "month";

/** Une vente à agréger. `count` permet de passer des agrégats journaliers. */
export type RevenueEvent = {
  date: string | Date;
  amount: number;
  /** Nombre de ventes que cet événement représente (1 par défaut). */
  count?: number;
};

/** Un point de la courbe : un créneau de temps et ce qu'on y a encaissé. */
export type RevenuePoint = {
  /** Clé stable du créneau (jour de début, `AAAA-MM-JJ` local). */
  key: string;
  /** Libellé court pour l'axe des abscisses (« 7 juil. »). */
  label: string;
  /** Libellé complet pour l'infobulle (« Semaine du 7 juil. »). */
  fullLabel: string;
  revenue: number;
  orders: number;
};

export type RevenueSeries = Record<Granularity, RevenuePoint[]>;

/** La profondeur de chaque fenêtre. */
const WINDOW: Record<Granularity, number> = { day: 30, week: 12, month: 12 };

const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const DAY_FULL = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const MONTH_FULL = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Lundi à minuit de la semaine de `d`. */
function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const dow = (s.getDay() + 6) % 7; // 0 = lundi
  s.setDate(s.getDate() - dow);
  return s;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function bucketStart(gran: Granularity, d: Date): Date {
  if (gran === "month") return startOfMonth(d);
  if (gran === "week") return startOfWeek(d);
  return startOfDay(d);
}

/** Clé locale d'un créneau, insensible au fuseau (contrairement à ISO/UTC). */
function keyOf(start: Date): string {
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelOf(gran: Granularity, start: Date): string {
  return gran === "month" ? MONTH_LABEL.format(start) : DAY_LABEL.format(start);
}

function fullLabelOf(gran: Granularity, start: Date): string {
  if (gran === "month") return MONTH_FULL.format(start);
  if (gran === "week") return `Semaine du ${DAY_LABEL.format(start)}`;
  return DAY_FULL.format(start);
}

/** Les débuts de créneaux de la fenêtre, du plus ancien au plus récent. */
function windowStarts(gran: Granularity, now: Date): Date[] {
  const n = WINDOW[gran];
  const current = bucketStart(gran, now);
  const starts: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    if (gran === "month") starts.push(addMonths(current, -i));
    else if (gran === "week") starts.push(addDays(current, -i * 7));
    else starts.push(addDays(current, -i));
  }
  return starts;
}

function seriesFor(
  gran: Granularity,
  events: RevenueEvent[],
  now: Date,
): RevenuePoint[] {
  const starts = windowStarts(gran, now);
  const index = new Map<string, RevenuePoint>();
  const points = starts.map((start) => {
    const point: RevenuePoint = {
      key: keyOf(start),
      label: labelOf(gran, start),
      fullLabel: fullLabelOf(gran, start),
      revenue: 0,
      orders: 0,
    };
    index.set(point.key, point);
    return point;
  });

  const floor = starts[0].getTime();
  const ceil = now.getTime();
  for (const event of events) {
    const when = event.date instanceof Date ? event.date : new Date(event.date);
    const t = when.getTime();
    if (Number.isNaN(t) || t < floor || t > ceil) continue;
    const point = index.get(keyOf(bucketStart(gran, when)));
    if (!point) continue;
    point.revenue += event.amount;
    point.orders += event.count ?? 1;
  }

  return points;
}

/** Replie les ventes en trois courbes : par jour, par semaine, par mois. */
export function buildRevenueSeries(
  events: RevenueEvent[],
  now: Date = new Date(),
): RevenueSeries {
  return {
    day: seriesFor("day", events, now),
    week: seriesFor("week", events, now),
    month: seriesFor("month", events, now),
  };
}

export type RevenueSummary = {
  total: number;
  orders: number;
  average: number;
  /** Le créneau le plus fort de la fenêtre, ou null si tout est à zéro. */
  peak: RevenuePoint | null;
};

/** Les chiffres de tête d'une courbe : total, moyenne, meilleur créneau. */
export function summarize(points: RevenuePoint[]): RevenueSummary {
  const total = points.reduce((sum, p) => sum + p.revenue, 0);
  const orders = points.reduce((sum, p) => sum + p.orders, 0);
  const peak = points.reduce<RevenuePoint | null>(
    (best, p) => (p.revenue > 0 && (!best || p.revenue > best.revenue) ? p : best),
    null,
  );
  return {
    total,
    orders,
    average: points.length ? Math.round(total / points.length) : 0,
    peak,
  };
}
