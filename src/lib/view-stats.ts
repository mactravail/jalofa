import "server-only";

import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";

/**
 * Les vues d'un tailleur : combien de personnes ont ouvert sa page publique et
 * chacun de ses modèles (cf. migration 20260913000001, lit `page_views`).
 */

export type TailorModelViews = {
  id: string;
  name: string;
  image_url: string | null;
  views: number;
  visitors: number;
};

export type TailorViewStats = {
  page_views: number;
  page_visitors: number;
  model_views: number;
  model_visitors: number;
  models: TailorModelViews[];
  daily: { day: string; page_views: number; model_views: number }[];
};

export type TailorViewRank = {
  id: string;
  shop_name: string;
  city: string | null;
  page_views: number;
  page_visitors: number;
  model_views: number;
  model_visitors: number;
  total: number;
};

export type Rpc = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export const VIEW_PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "3 mois" },
] as const;

/** Début de la période : minuit à Dakar (UTC+0 toute l'année). */
export function periodStart(p: string | undefined, fallback = 30): { days: number; since: Date } {
  const days = VIEW_PERIODS.find((x) => String(x.days) === p)?.days ?? fallback;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  return { days, since };
}

/** Les vues du tailleur connecté. `null` = migration pas encore appliquée. */
export async function getMyViewStats(since: Date): Promise<TailorViewStats | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as Rpc).rpc("tailor_view_stats", {
    p_tailor: user.id,
    since: since.toISOString(),
  });
  if (error || !data) return null;
  return data as TailorViewStats;
}
