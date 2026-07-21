/**
 * Historique de ventes de démonstration pour les courbes de revenus.
 *
 * Tant que Supabase n'est pas provisionné (cf. `isSupabaseConfigured`), les six
 * commandes de démo ne suffisent pas à dessiner une vraie tendance sur douze
 * mois. On fabrique donc un historique plausible : un agrégat par jour sur la
 * dernière année, avec une croissance lente, un pic de fin de semaine (les
 * cérémonies au Sénégal) et un peu de bruit.
 *
 * Déterministe : chaque jour calendaire est tiré à partir de son numéro absolu,
 * donc la courbe ne saute pas d'un rendu à l'autre. Ce sont des agrégats
 * (`count` = nombre de ventes du jour), jamais affichés ligne à ligne — le
 * détail des commandes, lui, reste la liste réelle.
 */

import type { RevenueEvent } from "@/lib/revenue-series";

/** Le métier (ou la plateforme) dont on trace les revenus. */
export type RevenueChannel = "tailor" | "vendor" | "platform";

const DAY = 86_400_000;
const HISTORY_DAYS = 365;

type ChannelConfig = {
  /** Volume moyen de ventes par jour, avant tendance et saison. */
  base: number;
  /** Fourchette du montant d'une vente (part du métier, ou total plateforme). */
  min: number;
  max: number;
  /** Graine, pour que deux métiers ne tirent pas la même courbe. */
  seed: number;
};

const CONFIG: Record<RevenueChannel, ChannelConfig> = {
  tailor: { base: 1.1, min: 12_000, max: 38_000, seed: 101 },
  vendor: { base: 1.4, min: 8_000, max: 60_000, seed: 202 },
  platform: { base: 3.2, min: 28_000, max: 95_000, seed: 303 },
};

/** PRNG déterministe (mulberry32) — même graine, même suite. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** L'historique de ventes d'un métier, un agrégat par jour actif. */
export function demoRevenueEvents(
  channel: RevenueChannel,
  now: Date = new Date(),
): RevenueEvent[] {
  const cfg = CONFIG[channel];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const events: RevenueEvent[] = [];

  for (let i = 0; i < HISTORY_DAYS; i++) {
    const day = new Date(today.getTime() - i * DAY);
    const dayNum = Math.floor(day.getTime() / DAY);
    const rnd = mulberry32(Math.imul(cfg.seed, 2_654_435_761) ^ dayNum);

    // Croissance lente (l'activité monte sur l'année) et pic de fin de semaine.
    const trend = 0.55 + 0.9 * ((HISTORY_DAYS - i) / HISTORY_DAYS);
    const dow = day.getDay();
    const season = dow === 5 || dow === 6 ? 1.35 : dow === 0 ? 0.7 : 1;

    const orders = Math.round(cfg.base * trend * season * (0.4 + 1.2 * rnd()));
    if (orders <= 0) continue;

    let amount = 0;
    for (let k = 0; k < orders; k++) {
      // Puissance > 1 : plus de petites ventes que de grosses.
      amount += Math.round(cfg.min + (cfg.max - cfg.min) * Math.pow(rnd(), 1.3));
    }

    events.push({ date: day.toISOString(), amount, count: orders });
  }

  return events;
}
