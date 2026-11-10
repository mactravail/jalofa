import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { GarmentBuyBox } from "@/components/catalog/garment-buy-box";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import {
  GarmentDetails,
  GarmentFooter,
  GarmentHeading,
} from "@/components/catalog/garment-summary";
import { GarmentTypeSwitcher } from "@/components/catalog/garment-type-switcher";
import { DemoBanner } from "@/components/demo-banner";
import { modelPhotos } from "@/lib/constants";
import {
  getFabrics,
  getModelBySlug,
  getModelReviews,
  getTailorById,
  getTailors,
} from "@/lib/data";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { ROBE_TYPES } from "@/lib/garment-routes";
import { getRelatedGarments } from "@/lib/related-models";
import type { GarmentModel, Tailor } from "@/lib/types";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Robe sur mesure"),
    description: t(
      "La robe sur mesure, dans ses différents types — Robe, Grande Robe, Robe de Soirée, Boubou Femme... Prenez-la telle qu'elle est présentée ou personnalisez chaque détail.",
    ),
  };
}

// Page d'accueil de TOUTE la famille « robe » — /modeles/[id] y redirige
// chacun de ses membres (cf. garment-routes.ts). On choisit le type en haut
// (switcher), puis on ne propose que deux chemins pour CE type précis — le
// prendre tel quel, ou le personnaliser — jamais de bascule vers une autre
// silhouette une fois « Personnaliser » choisi (cf. la règle « un
// configurateur = un vêtement »). Contrairement au grand boubou, aucun membre
// de cette famille n'a de tarification bespoke : tous passent par le calcul
// générique tissu + tailleur.
export default async function RobePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const t = await getT();
  const selectedSlug = type && ROBE_TYPES.includes(type) ? type : ROBE_TYPES[0];

  const [fabrics, tailors, familyModelsRaw] = await Promise.all([
    getFabrics(),
    getTailors(),
    Promise.all(ROBE_TYPES.map((slug) => getModelBySlug(slug))),
  ]);
  const models = familyModelsRaw.filter((m): m is GarmentModel => m !== null);
  const model = models.find((m) => m.slug === selectedSlug) ?? models[0];
  if (!model) notFound();

  const authorIds = [
    ...new Set(models.map((m) => m.tailor_id).filter((id): id is string => !!id)),
  ];
  const authorList = await Promise.all(authorIds.map((id) => getTailorById(id)));
  const authorById = new Map<string, Tailor | null>(
    authorIds.map((id, i) => [id, authorList[i]]),
  );

  const asIsFabric = fabrics.find((f) => f.id === GENERIC_AS_IS_FABRIC_ID) ?? fabrics[0] ?? null;

  const presets = models.map((m) => {
    const author = m.tailor_id ? (authorById.get(m.tailor_id) ?? null) : null;
    const tailor = author ?? tailors[0] ?? null;
    return buildGenericAsIsPreset({
      model: m,
      photos: modelPhotos(m),
      fabric: asIsFabric,
      tailor,
    });
  });
  const preset = presets.find((p) => p.modelId === model.id)!;
  const author = model.tailor_id ? (authorById.get(model.tailor_id) ?? null) : null;

  const photos = modelPhotos(model);
  // Query pour le configurateur, SANS tissu : celui-ci se choisit dans
  // la carte « Le personnaliser » (et voyage ensuite via ?fabric=).
  const order = new URLSearchParams({ type: "full", model: model.id });
  if (model.tailor_id) order.set("tailor", model.tailor_id);

  const switcherTypes = models.map((m, i) => ({
    id: m.slug ?? m.id,
    name: m.name,
    image: m.image_url ?? modelPhotos(m)[0] ?? null,
    fromPrice: presets[i].total,
  }));

  // Les avis de CE type précis et les modèles proches : ils suivent le switcher,
  // comme le reste de la page. Les autres types sont déjà dans le switcher.
  const [reviews, related] = await Promise.all([
    getModelReviews(model.id),
    getRelatedGarments({
      model,
      excludeIds: models.map((m) => m.id),
      fabric: asIsFabric,
      tailor: tailors[0] ?? null,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> {t("Retour à l'accueil")}
      </Link>

      <GarmentTypeSwitcher
        basePath="/femme/robe-sur-mesure"
        label={t("Choisissez le type de robe")}
        types={switcherTypes}
        activeId={model.slug ?? model.id}
      />

      {/* `grid-cols-1` explicite : une colonne implicite se dimensionne sur son
          contenu et laisse un rail défilant élargir la page (cf. /modeles/[id]). */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <GarmentGallery
          photos={photos}
          alt={model.name}
          fit="cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="aspect-4/5"
          stageClassName="bg-muted overflow-hidden rounded-2xl border"
        />

        <div>
          <GarmentHeading
            model={model}
            author={author}
            reviews={reviews}
            eyebrow="Femme · Robe sur mesure"
          />

          {/* Deux chemins pour ce type précis. */}
          <div className="mt-6">
            {/* Un seul bloc d'achat : tel quel, ou sur mesure via le même
                configurateur que tous les autres vêtements. */}
            <GarmentBuyBox
              key={model.id}
              preset={preset}
              presentedIn={asIsFabric?.name ?? null}
              fabrics={fabrics}
              orderParams={order.toString()}
            />
          </div>

          <GarmentDetails model={model} />
        </div>
      </div>

      <GarmentFooter reviews={reviews} related={related} />
    </div>
  );
}
