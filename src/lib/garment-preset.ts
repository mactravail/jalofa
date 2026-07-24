import type { AsIsPreset } from "@/components/catalog/garment-as-is";
import { styleDetailDefaults, styleDetailSummary } from "@/lib/style-options";
import type { Fabric, GarmentModel, Tailor } from "@/lib/types";

// Shared "as-is" pricing for any catalogue model that has no bespoke pricing
// model of its own (contrast with the grand boubou's three-piece pricing in
// boubou-options.ts). Used by /modeles/[id] and by the dedicated family pages
// (grand boubou, robe…) for every member that isn't independently priced.

/** Metres of fabric a generic "as-is" garment consumes for pricing. */
export const GENERIC_AS_IS_METERS = 3;

/** Reference fabric used to price a garment "as-is" — kept consistent across
 * the catalogue so "à partir de" prices stay comparable between models. */
export const GENERIC_AS_IS_FABRIC_ID = "demo-coton-bleu-marine";

/**
 * The "as-is" preset for a garment priced the generic way: the atelier's (or
 * the model's author's) base price plus the chosen fabric, with the model's
 * own default style details (cut, collar, embroidery…) from style-options.ts.
 */
export function buildGenericAsIsPreset({
  model,
  photos,
  fabric,
  tailor,
}: {
  model: GarmentModel;
  photos: string[];
  fabric: Fabric | null;
  tailor: Tailor | null;
}): AsIsPreset {
  const styleDefaults = styleDetailDefaults(model);
  const styleSummary = styleDetailSummary(model, styleDefaults);

  const fabricPrice = (fabric?.price_per_meter ?? 0) * GENERIC_AS_IS_METERS;
  const tailoringPrice = tailor?.base_price ?? 0;
  const total = fabricPrice + tailoringPrice;

  const notesSpec = [
    `${model.name} pris tel quel (modèle présenté).`,
    `Tissu : ${fabric?.name ?? "au choix de l'atelier"} (${GENERIC_AS_IS_METERS} m)`,
    ...styleSummary.map((d) => `${d.group} : ${d.option}`),
  ].join("\n");

  return {
    type: "full",
    modelId: model.id,
    modelName: model.name,
    image: model.image_url ?? photos[0] ?? null,
    styleDetails: styleDefaults,
    fabricId: fabric?.id ?? null,
    fabricMeters: GENERIC_AS_IS_METERS,
    tailorId: tailor?.id ?? null,
    tailorName: tailor?.shop_name ?? null,
    freeDelivery: tailor?.free_delivery ?? false,
    fabricPrice,
    tailoringPrice,
    total,
    personalisation: [
      { group: "Tissu", option: fabric?.name ?? "Tissu de l'atelier" },
      ...styleSummary,
    ],
    notesSpec,
  };
}
