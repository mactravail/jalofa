import "server-only";

import type { RelatedGarment } from "@/components/catalog/related-models-rail";
import { modelHref } from "@/components/catalog/model-card";
import {
  BOUBOU_AS_IS_DETAILS,
  BOUBOU_BASE_PRICE,
  BOUBOU_FABRIC_METERS,
  boubouOptionsSurcharge,
} from "@/lib/boubou-options";
import {
  FEMME_OCCASIONS,
  HOMME_OCCASIONS,
  modelKey,
  wornCover,
} from "@/lib/collection-occasions";
import { getModelReviewStats, getModels } from "@/lib/data";
import { buildGenericAsIsPreset } from "@/lib/garment-preset";
import type { Fabric, GarmentModel, Tailor } from "@/lib/types";

const MAX_RELATED = 12;

function occasionsOf(model: GarmentModel): Set<string> {
  const occasions = model.category_slug === "femme" ? FEMME_OCCASIONS : HOMME_OCCASIONS;
  const key = modelKey(model.name);
  return new Set(occasions.filter((o) => o.models.includes(key)).map((o) => o.id));
}

/** Le prix que le client retrouvera sur la fiche, ou rien si on ne le connaît pas. */
function fromPrice(model: GarmentModel, fabric: Fabric | null, tailor: Tailor | null) {
  // Modèle d'un tailleur : son tissu se choisit sur la fiche, seul son tarif est sûr.
  if (model.tailor_id) return model.price;
  if (model.slug === "grand-boubou") {
    return (
      (fabric?.price_per_meter ?? 0) * BOUBOU_FABRIC_METERS +
      BOUBOU_BASE_PRICE +
      boubouOptionsSurcharge(BOUBOU_AS_IS_DETAILS)
    );
  }
  const { total } = buildGenericAsIsPreset({ model, photos: [], fabric, tailor });
  return total > 0 ? total : null;
}

/**
 * Les habits à proposer sous un modèle, du même rayon (homme, femme, enfant) :
 * d'abord ceux du même tailleur, puis ceux de la même occasion, puis le reste.
 * `excludeIds` retire ce que la page montre déjà, comme les types de sa famille.
 */
export async function getRelatedGarments({
  model,
  excludeIds = [],
  fabric,
  tailor,
}: {
  model: GarmentModel;
  excludeIds?: string[];
  fabric: Fabric | null;
  tailor: Tailor | null;
}): Promise<RelatedGarment[]> {
  const candidates = await getModels({ category: model.category_slug ?? undefined });
  const excluded = new Set([model.id, ...excludeIds]);
  const occasions = occasionsOf(model);

  const score = (candidate: GarmentModel) =>
    (model.tailor_id && candidate.tailor_id === model.tailor_id ? 2 : 0) +
    ([...occasionsOf(candidate)].some((o) => occasions.has(o)) ? 1 : 0);

  const picked = candidates
    .filter((c) => !excluded.has(c.id))
    .map((c) => ({ model: c, score: score(c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELATED)
    .map((c) => c.model);

  const stats = await getModelReviewStats(picked.map((m) => m.id));

  return picked.map((m) => ({
    id: m.id,
    name: m.name,
    href: modelHref(m),
    cover: wornCover(m),
    avgDays: m.avg_days,
    price: fromPrice(m, fabric, tailor),
    reviewCount: stats.get(m.id)?.count ?? 0,
    rating: stats.get(m.id)?.average ?? 0,
  }));
}
