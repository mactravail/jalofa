import Link from "@/components/i18n/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { GarmentBuyBox } from "@/components/catalog/garment-buy-box";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import {
  GarmentDetails,
  GarmentFooter,
  GarmentHeading,
} from "@/components/catalog/garment-summary";
import { DemoBanner } from "@/components/demo-banner";
import { EuropeProductFacts } from "@/components/europe/europe-product-facts";
import { Badge } from "@/components/ui/badge";
import { modelPhotos } from "@/lib/constants";
import {
  getFabrics,
  getModelByIdOrSlug,
  getModelFabricIds,
  getModelReviews,
  getStyles,
  getTailorById,
  getTailors,
} from "@/lib/data";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { DEDICATED_HREF } from "@/lib/garment-routes";
import { getRelatedGarments } from "@/lib/related-models";
import { getT, localizedPath } from "@/lib/i18n/server";

// Page dédiée d'un modèle : le prendre tel quel (taille seulement) ou le personnaliser.
export default async function ModelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; fabric?: string; tailor?: string }>;
}) {
  const { id } = await params;
  const { type, fabric, tailor } = await searchParams;
  const t = await getT();

  // Le segment d'URL peut être l'`id` UUID (cartes du catalogue) ou le `slug`
  // stable (tuiles de la home) — cf. `getModelByIdOrSlug`. C'est le `slug` du
  // modèle chargé qui décide d'une éventuelle page dédiée : on charge donc le
  // modèle d'abord, puis on redirige vers son type dans la famille (cf.
  // garment-routes.ts — le grand boubou et la robe ont chacun plusieurs types
  // partageant une seule page dédiée).
  const model = await getModelByIdOrSlug(id);
  if (!model) notFound();
  if (model.slug && DEDICATED_HREF[model.slug]) {
    redirect(await localizedPath(`${DEDICATED_HREF[model.slug]}?type=${model.slug}`));
  }

  const [styles, fabrics, tailors] = await Promise.all([
    getStyles(),
    getFabrics(),
    getTailors(),
  ]);
  const photos = modelPhotos(model);

  // Une création signée se commande chez son auteur — il n'y a personne d'autre
  // à qui confier sa propre coupe.
  const author = model.tailor_id ? await getTailorById(model.tailor_id) : null;

  // Modèle d'un tailleur : ses tissus à lui pour « Tel quel » (ceux qu'il a
  // publiés pour ce modèle et qu'il a en stock).
  const linkedFabricIds = author ? new Set(await getModelFabricIds(model.id)) : null;
  const tailorFabrics = author ? fabrics.filter((f) => f.vendor_id === author.id) : [];
  const asIsFabrics = linkedFabricIds
    ? tailorFabrics.filter((f) => linkedFabricIds.has(f.id) && isFabricAvailable(f))
    : [];

  // This is where the garment gets locked in: the configurator has no model
  // step, so it only ever starts from here. `type` / `tailor` come back from an
  // order begun before a garment was chosen — the author, when there is one,
  // overrides whatever tailor was carried in. The fabric is NOT put here: it is
  // chosen in the « Le personnaliser » card below (and carried in via ?fabric=).
  const orderParams = new URLSearchParams({ type: type ?? "full", model: model.id });
  const orderTailor = model.tailor_id ?? tailor;
  if (orderTailor) orderParams.set("tailor", orderTailor);

  // --- « Le prendre tel quel » : le modèle présenté, on ne choisit que la taille.
  const asIsFabric =
    asIsFabrics[0] ??
    fabrics.find((f) => f.id === GENERIC_AS_IS_FABRIC_ID) ??
    fabrics[0] ??
    null;
  // À défaut d'auteur, l'atelier assigne un tailleur pour la version prête.
  const asIsTailor = author ?? tailors[0] ?? null;
  const asIsPreset = buildGenericAsIsPreset({
    model,
    photos,
    fabric: asIsFabric,
    tailor: asIsTailor,
  });

  // Les vrais avis de ce vêtement, puis les modèles proches.
  const [reviews, related] = await Promise.all([
    getModelReviews(model.id),
    getRelatedGarments({
      model,
      fabric: fabrics.find((f) => f.id === GENERIC_AS_IS_FABRIC_ID) ?? fabrics[0] ?? null,
      tailor: tailors[0] ?? null,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DemoBanner />
      <Link
        href="/modeles"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> {t("Retour aux modèles")}
      </Link>

      {/* `grid-cols-1` explicite : sans lui, la colonne (implicite, donc `auto`)
          se dimensionne sur le contenu le plus large — le rail de tissus de
          « Le personnaliser » élargissait toute la page sur mobile. */}
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
          <GarmentHeading model={model} author={author} reviews={reviews} />

          {/* JALOFA EUROPE : l'atelier, le lieu, la matière, le prix en € et FCFA. */}
          <EuropeProductFacts model={model} />

          {/* Un seul bloc d'achat, un seul bouton : « Tel quel » (taille
              seulement, prix ferme) ou « Sur mesure » (tissu, puis le
              configurateur et une demande de devis). */}
          <div className="mt-6">
            <GarmentBuyBox
              preset={asIsPreset}
              presentedIn={asIsFabric?.name ?? null}
              fabrics={fabrics}
              orderParams={orderParams.toString()}
              initialFabricId={fabric ?? null}
              offer={
                author
                  ? {
                      model,
                      photos,
                      // Seulement ce qu'il faut : pas de données de reversement
                      // dans la page envoyée au navigateur.
                      tailor: {
                        id: author.id,
                        shop_name: author.shop_name,
                        base_price: author.base_price,
                        free_delivery: author.free_delivery,
                        free_delivery_zone: author.free_delivery_zone,
                      },
                      asIsFabrics,
                      tailorFabrics,
                    }
                  : undefined
              }
            />
          </div>

          {styles.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="text-primary size-4" /> {t("Occasions")}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {styles.map((s) => (
                  <Badge key={s.slug} variant="secondary">
                    {t(s.name)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <GarmentDetails model={model} />
        </div>
      </div>

      <GarmentFooter reviews={reviews} related={related} />
    </div>
  );
}
