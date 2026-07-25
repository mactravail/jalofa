import "server-only";

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
): Promise<number> {
  const { data: tailor } = await supabase
    .from("tailors")
    .select("base_price")
    .eq("id", tailorId)
    .single();
  const basePrice = Number(tailor?.base_price ?? 0);

  if (!modelId) return basePrice;
  const { data: model } = await supabase
    .from("models")
    .select("price, tailor_id")
    .eq("id", modelId)
    .single();
  const price = model?.price;
  if (model?.tailor_id === tailorId && price != null) return Number(price);
  return basePrice;
}
