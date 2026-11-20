import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { GarmentBuyBox } from "@/components/catalog/garment-buy-box";
import { SalesPendingNotice } from "@/components/catalog/sales-pending-notice";
import {
  ColorAwareGarmentGallery,
  GarmentColorPhotoProvider,
} from "@/components/catalog/garment-color-photo";
import {
  creationTypeCard,
  GarmentTypeSwitcher,
} from "@/components/catalog/garment-type-switcher";
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
  getModelReviews,
  getModelSuggestions,
  getStyles,
  getTailorCreationsFor,
  getTailorById,
  getTailors,
  getUnapprovedSellerIds,
  sellableFabrics,
} from "@/lib/data";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { DEDICATED_HREF } from "@/lib/garment-routes";
import { catalogModelOf } from "@/lib/catalog-link";
import {
  CLICKED_CARD_ID,
  hrefWithPhoto,
  isClickedPhotoActive,
  readClickedPhoto,
} from "@/lib/clicked-photo";
import { modelHref } from "@/lib/model-href";
import { getRelatedGarments } from "@/lib/related-models";
import { getT, localizedPath } from "@/lib/i18n/server";

// Titre et aperçu propres à chaque modèle : onglet, Google et partage WhatsApp
// montrent « Dashiki · JALOFA » et sa photo, pas le titre générique du site.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getT();
  const model = await getModelByIdOrSlug(id);
  if (!model) return { title: t("Modèle introuvable") };
  const image = model.image_url ?? model.photos[0] ?? null;
  const description =
    model.description ??
    t("{name} sur mesure, cousu par un tailleur JALOFA.", { name: t(model.name) });
  return {
    title: t(model.name),
    description,
    openGraph: {
      title: t(model.name),
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

// Page dédiée d'un modèle : le prendre tel quel (prêt-à-porter) ou le personnaliser.
export default async function ModelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    type?: string;
    fabric?: string;
    tailor?: string;
    photo?: string;
    vue?: string;
    /** Arrivée depuis la boutique d'un tailleur : « tel-quel » ou « sur-mesure ». */
    mode?: string;
  }>;
}) {
  const { id } = await params;
  const { type, fabric, tailor, photo, vue, mode } = await searchParams;
  const clickedPhoto = readClickedPhoto(photo);
  const clickedActive = isClickedPhotoActive(clickedPhoto, vue);
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

  const [styles, fabrics, tailors, unapproved] = await Promise.all([
    getStyles(),
    getFabrics(),
    getTailors(),
    getUnapprovedSellerIds(),
  ]);
  const photos = modelPhotos(model);

  // Une création signée se commande chez son auteur — il n'y a personne d'autre
  // à qui confier sa propre coupe.
  const author = model.tailor_id ? await getTailorById(model.tailor_id) : null;
  // Anti-arnaque : un tailleur pas encore validé par JALOFA reste visible, mais
  // sa création ne s'achète pas encore.
  const authorPending = Boolean(author && unapproved.has(author.id));

  // « Tel quel » (prêt-à-porter) se lit sur le modèle lui-même : ready_*. Le
  // « Sur mesure » propose les tissus JALOFA (seul vendeur de tissus).

  // This is where the garment gets locked in: the configurator has no model
  // step, so it only ever starts from here. `type` / `tailor` come back from an
  // order begun before a garment was chosen — the author, when there is one,
  // overrides whatever tailor was carried in. The fabric is NOT put here: it is
  // chosen in the « Le personnaliser » card below (and carried in via ?fabric=).
  const orderParams = new URLSearchParams({ type: type ?? "full", model: model.id });
  const orderTailor = model.tailor_id ?? tailor;
  if (orderTailor) orderParams.set("tailor", orderTailor);

  // --- Prix « à partir de » du sur mesure (estimation affichée). Rien n'est
  // vendu « tel quel » ici : le prêt-à-porter est lu sur le modèle (ready_*).
  const asIsFabric =
    fabrics.find((f) => f.id === GENERIC_AS_IS_FABRIC_ID) ??
    fabrics[0] ??
    null;
  // Catalogue JALOFA : estimation sur le tarif du premier atelier, rien de plus.
  const asIsTailor = author ?? tailors[0] ?? null;
  const asIsPreset = buildGenericAsIsPreset({
    model,
    photos,
    fabric: asIsFabric,
    tailor: asIsTailor,
  });

  // Les vrais avis de ce vêtement, puis les modèles proches. Un modèle du
  // catalogue JALOFA montre aussi les créations des tailleurs de ce type ; une
  // création ramène à son modèle du catalogue.
  const [reviews, creations, parent, related] = await Promise.all([
    getModelReviews(model.id),
    author ? Promise.resolve([]) : getTailorCreationsFor([model]),
    author
      ? getModelSuggestions().then((catalog) => catalogModelOf(model, catalog))
      : Promise.resolve(null),
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
        href={parent ? modelHref(parent) : "/modeles"}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />{" "}
        {parent ? t("Retour à : {name}", { name: parent.name }) : t("Retour aux modèles")}
      </Link>

      {/* La photo cliquée sur la home, le modèle JALOFA, puis toutes les
          créations des tailleurs de ce type : une rangée qui défile de gauche
          à droite, toujours affichée. La carte active = la grande photo. */}
      {!author && (
        <GarmentTypeSwitcher
          basePath={`/modeles/${model.id}`}
          label={t("Choisissez votre modèle")}
          activeId={clickedActive ? CLICKED_CARD_ID : model.id}
          showSingle
          types={[
            ...(clickedPhoto
              ? [
                  {
                    id: CLICKED_CARD_ID,
                    name: model.name,
                    image: clickedPhoto,
                    fromPrice: asIsPreset.total,
                    href: hrefWithPhoto(`/modeles/${model.id}`, clickedPhoto),
                  },
                ]
              : []),
            {
              id: model.id,
              name: model.name,
              image: photos[0] ?? null,
              fromPrice: asIsPreset.total,
              // La grande photo redevient celle du modèle ; la photo cliquée
              // reste dans la rangée.
              href: clickedPhoto
                ? hrefWithPhoto(`/modeles/${model.id}`, clickedPhoto, true)
                : `/modeles/${model.id}`,
            },
            ...creations.map((m) =>
              creationTypeCard(m, tailors.find((tl) => tl.id === m.tailor_id)?.shop_name ?? null),
            ),
          ]}
        />
      )}

      {/* `grid-cols-1` explicite : sans lui, la colonne (implicite, donc `auto`)
          se dimensionne sur le contenu le plus large — le rail de tissus de
          « Le personnaliser » élargissait toute la page sur mobile. */}
      <GarmentColorPhotoProvider>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Sur ordinateur, la photo reste en place pendant qu'on fait défiler
            la colonne de droite, puis la page défile normalement. */}
        <div className="md:sticky md:top-20 md:self-start">
          <ColorAwareGarmentGallery
            photos={clickedActive && clickedPhoto ? [clickedPhoto] : photos}
            alt={model.name}
            fit="contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="aspect-4/5"
            stageClassName="bg-muted overflow-hidden rounded-2xl border"
          />
        </div>

        <div>
          <GarmentHeading model={model} author={author} reviews={reviews} />

          {/* JALOFA EUROPE : l'atelier, le lieu, la matière, le prix en € et FCFA. */}
          <EuropeProductFacts model={model} />

          {/* Un seul bloc d'achat, un seul bouton : « Tel quel » (prêt-à-porter
              du tailleur auteur : couleur + taille, prix ferme) ou « Sur mesure »
              (tissu, puis le configurateur et une demande de devis). */}
          <div className="mt-6">
            {authorPending ? (
              <SalesPendingNotice />
            ) : (
            <GarmentBuyBox
              preset={asIsPreset}
              presentedIn={asIsFabric?.name ?? null}
              fabrics={sellableFabrics(fabrics, unapproved)}
              orderParams={orderParams.toString()}
              initialFabricId={fabric ?? null}
              initialMode={
                mode === "tel-quel" ? "as_is" : mode === "sur-mesure" ? "custom" : undefined
              }
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
                    }
                  : undefined
              }
            />
            )}
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
      </GarmentColorPhotoProvider>

      <GarmentFooter reviews={reviews} related={related} />
    </div>
  );
}
