import "server-only";

import { readyPriceFor } from "@/lib/ready-to-wear";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Le prix de confection facturé pour un modèle par un tailleur donné, recalculé
 * depuis les lignes de base qui font foi. Une création signée fait valoir son
 * propre `models.price` — mais seulement chez son auteur ; partout ailleurs
 * (catalogue plateforme, ou modèle repris par un autre tailleur après un refus)
 * on retombe sur le « dès… » `base_price` du tailleur.
 *
 * Partagé par toutes les server actions de commande (checkout, création,
 * réassignation) pour qu'un même couple (modèle, tailleur) soit toujours facturé
 * au même prix.
 */
export async function resolveTailoringPrice(
  supabase: SupabaseServerClient,
  modelId: string | null,
  tailorId: string,
  /** Prêt-à-porter : la couleur choisie, qui peut avoir son propre prix. */
  readyColor?: string | null,
): Promise<number> {
  const { data: tailor } = await supabase
    .from("tailors")
    .select("base_price")
    .eq("id", tailorId)
    .single();
  const basePrice = Number(tailor?.base_price ?? 0);

  if (!modelId) return basePrice;
  // `*` : les colonnes du prêt-à-porter peuvent manquer sur une base pas encore migrée.
  const { data } = await supabase.from("models").select("*").eq("id", modelId).single();
  const model = data as {
    price: number | null;
    tailor_id: string | null;
    ready_to_wear?: boolean;
    ready_colors?: string[] | null;
    ready_color_prices?: Record<string, number> | null;
  } | null;
  const price = model?.price;
  if (model?.tailor_id === tailorId && price != null) {
    if (readyColor && model.ready_to_wear) {
      return readyPriceFor(
        {
          ready_colors: model.ready_colors ?? [],
          ready_color_prices: model.ready_color_prices ?? {},
        },
        readyColor,
        Number(price),
      );
    }
    return Number(price);
  }
  return basePrice;
}
