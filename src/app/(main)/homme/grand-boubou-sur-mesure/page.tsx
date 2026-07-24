import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Ruler, Sparkles, Store, Truck } from "lucide-react";

import { GarmentAsIs, type AsIsPreset } from "@/components/catalog/garment-as-is";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import { GarmentPersonalise } from "@/components/catalog/garment-personalise";
import { GarmentReviews } from "@/components/catalog/garment-reviews";
import { GarmentTypeSwitcher } from "@/components/catalog/garment-type-switcher";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import {
  BOUBOU_BASE_PRICE,
  BOUBOU_DETAIL_DEFAULTS,
  BOUBOU_FABRIC_METERS,
  boubouDetailSummary,
  boubouOptionsSurcharge,
  type BoubouDetails,
} from "@/lib/boubou-options";
import { formatPrice, modelPhotos } from "@/lib/constants";
import { getFabrics, getModelBySlug, getTailorById, getTailors } from "@/lib/data";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { GRAND_BOUBOU_TYPES } from "@/lib/garment-routes";
import { garmentSocialProof } from "@/lib/garment-social-proof";
import type { Fabric, GarmentModel, Tailor } from "@/lib/types";

export const metadata: Metadata = {
  title: "Grand boubou sur mesure",
  description:
    "Le grand boubou traditionnel, dans ses différents types — Agbada, Baye Lahat, cérémonie... Prenez-le tel qu'il est présenté ou personnalisez chaque détail.",
};

// Cette page est la page d'accueil de TOUTE la famille « grand boubou » —
// /modeles/[id] y redirige chacun de ses membres (cf. garment-routes.ts). On
// choisit le type en haut (switcher), puis on ne propose que deux chemins pour
// CE type précis — le prendre tel quel, ou le personnaliser — jamais de
// bascule vers une autre silhouette une fois « Personnaliser » choisi (cf. la
// règle « un configurateur = un vêtement »).
const BOUBOU_SLUG = "grand-boubou";

// La configuration figée du modèle de référence : les coupes par défaut de
// l'atelier, mais avec la broderie visible sur la photo (sfifa riche sur le
// boubou, col brodé sur le kaftan). C'est ce que le client accepte « tel quel »
// pour CE type précis — les autres types de la famille n'ont pas cette
// tarification bespoke en trois pièces et retombent sur le calcul générique.
const AS_IS_DETAILS: BoubouDetails = {
  boubou: { ...BOUBOU_DETAIL_DEFAULTS.boubou, broderie: "riche" },
  interieur: { ...BOUBOU_DETAIL_DEFAULTS.interieur, broderie: "col" },
  pantalon: { ...BOUBOU_DETAIL_DEFAULTS.pantalon },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

function presetFor(
  model: GarmentModel,
  fabrics: Fabric[],
  tailors: Tailor[],
  authorById: Map<string, Tailor | null>,
): AsIsPreset {
  const photos = modelPhotos(model);
  const fabric = fabrics.find((f) => f.id === GENERIC_AS_IS_FABRIC_ID) ?? fabrics[0] ?? null;

  if (model.slug === BOUBOU_SLUG) {
    const fabricPrice = (fabric?.price_per_meter ?? 0) * BOUBOU_FABRIC_METERS;
    const tailoringPrice = BOUBOU_BASE_PRICE + boubouOptionsSurcharge(AS_IS_DETAILS);
    const notesSpec = [
      "Grand boubou pris tel quel (modèle présenté).",
      ...boubouDetailSummary(AS_IS_DETAILS).map((d) => `${d.group} : ${d.option}`),
    ].join("\n");
    return {
      type: "full",
      modelId: model.id,
      modelName: model.name,
      image: model.image_url ?? photos[0] ?? null,
      styleDetails: {},
      fabricId: fabric?.id ?? null,
      fabricMeters: BOUBOU_FABRIC_METERS,
      tailorId: null,
      tailorName: null,
      fabricPrice,
      tailoringPrice,
      total: fabricPrice + tailoringPrice,
      personalisation: [
        { group: "Tissu", option: fabric?.name ?? "Tissu de l'atelier" },
        { group: "Composition", option: "Grand boubou · kaftan · pantalon" },
        { group: "Broderie", option: "Sfifa riche assortie" },
      ],
      notesSpec,
      note: "Même tissu, même broderie que le modèle présenté — le tailleur l'ajuste à votre taille.",
    };
  }

  const author = model.tailor_id ? (authorById.get(model.tailor_id) ?? null) : null;
  const tailor = author ?? tailors[0] ?? null;
  return buildGenericAsIsPreset({ model, photos, fabric, tailor });
}

export default async function GrandBoubouPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const selectedSlug = type && GRAND_BOUBOU_TYPES.includes(type) ? type : BOUBOU_SLUG;

  const [fabrics, tailors, familyModelsRaw] = await Promise.all([
    getFabrics(),
    getTailors(),
    Promise.all(GRAND_BOUBOU_TYPES.map((slug) => getModelBySlug(slug))),
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

  const presets = models.map((m) => presetFor(m, fabrics, tailors, authorById));
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

  // Les avis de CE type précis : ils suivent le switcher, comme le reste de la
  // page. L'auteur du modèle passe en tête des ateliers cités.
  const reviewTailors = author
    ? [author, ...tailors.filter((t) => t.id !== author.id)]
    : tailors;
  const proof = garmentSocialProof(model, reviewTailors);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour à l&apos;accueil
      </Link>

      <GarmentTypeSwitcher
        basePath="/homme/grand-boubou-sur-mesure"
        label="Choisissez le type de grand boubou"
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
          <p className="text-primary text-xs font-medium tracking-wide uppercase">
            Homme · Tenue traditionnelle
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{model.name}</h1>
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> ~{model.avg_days} jours de confection
            </span>
            {model.slug === BOUBOU_SLUG ? (
              <Badge variant="outline">3 pièces</Badge>
            ) : (
              model.difficulty && (
                <Badge variant="outline">
                  {DIFFICULTY_LABEL[model.difficulty] ?? model.difficulty}
                </Badge>
              )
            )}
          </div>

          {author && (
            <Link
              href={`/tailleurs/${author.id}`}
              className="bg-muted/50 hover:bg-muted mt-4 flex items-center gap-3 rounded-xl border p-3 transition-colors"
            >
              <Store className="text-primary size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  Création de {author.shop_name}
                </span>
                <span className="text-muted-foreground block text-xs">
                  Ce modèle est confectionné par son créateur
                  {author.city ? ` · ${author.city}` : ""}
                </span>
              </span>
            </Link>
          )}

          {model.description && (
            <p className="text-muted-foreground mt-4">{model.description}</p>
          )}

          {/* Deux chemins pour ce type précis. */}
          <div className="mt-6 space-y-4">
            {/* 1 — Le prendre tel quel : ne choisir que la taille. */}
            <div className="bg-card rounded-2xl border p-5">
              {/* Titre et prix côte à côte, mais sur mobile étroit ils ne
                  tiennent pas sur une ligne : plutôt que d'écraser le titre en
                  colonne de trois mots, on laisse le prix passer dessous. La
                  phrase prend toujours la largeur entière. */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="text-primary size-4 shrink-0" /> Le prendre tel
                  quel
                </h2>
                <span className="text-primary text-base font-bold whitespace-nowrap sm:text-lg">
                  {formatPrice(preset.total)}
                </span>
                <p className="text-muted-foreground w-full text-sm">
                  Le modèle présenté, ajusté à votre taille.
                </p>
              </div>
              <div className="mt-4">
                <GarmentAsIs preset={preset} />
              </div>
            </div>

            {/* 2 — Le personnaliser. Le même configurateur que tous les autres
                vêtements : le tissu se choisit ici, la coupe, le col, la
                broderie et les manches à l'étape Style. */}
            <GarmentPersonalise fabrics={fabrics} orderParams={order.toString()} />
          </div>

          <div className="text-muted-foreground mt-6 space-y-1.5 border-t pt-4 text-sm">
            <p className="flex items-center gap-2">
              <Ruler className="size-4" /> Tailles standard XS → XXXL, ajustées par le
              tailleur.
            </p>
            <p className="flex items-center gap-2">
              <Truck className="size-4" /> Livraison à domicile · paiement à la caisse.
            </p>
          </div>
        </div>
      </div>

      {/* Les avis, juste sous la fiche — là où on les cherche. */}
      <div className="mt-16 border-t pt-12">
        <GarmentReviews
          proof={proof}
          garmentName={model.name}
          storageKey={model.slug ?? model.id}
          tailors={reviewTailors}
        />
      </div>
    </div>
  );
}
