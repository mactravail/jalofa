import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Ruler, Sparkles, Store, Truck, Wand2 } from "lucide-react";

import { GarmentAsIs } from "@/components/catalog/garment-as-is";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import { GarmentTypeSwitcher } from "@/components/catalog/garment-type-switcher";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { formatPrice, modelPhotos } from "@/lib/constants";
import { getFabrics, getModelBySlug, getTailorById, getTailors } from "@/lib/data";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { PERSONALISER_HREF, ROBE_TYPES } from "@/lib/garment-routes";
import type { GarmentModel, Tailor } from "@/lib/types";

export const metadata: Metadata = {
  title: "Robe sur mesure",
  description:
    "La robe sur mesure, dans ses différents types — Robe, Grande Robe, Robe de Soirée, Boubou Femme... Prenez-la telle qu'elle est présentée ou personnalisez chaque détail.",
};

// Page d'accueil de TOUTE la famille « robe » — /modeles/[id] y redirige
// chacun de ses membres (cf. garment-routes.ts). On choisit le type en haut
// (switcher), puis on ne propose que deux chemins pour CE type précis — le
// prendre tel quel, ou le personnaliser — jamais de bascule vers une autre
// silhouette une fois « Personnaliser » choisi (cf. la règle « un
// configurateur = un vêtement »). Contrairement au grand boubou, aucun membre
// de cette famille n'a de tarification bespoke : tous passent par le calcul
// générique tissu + tailleur.
const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

export default async function RobePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
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
  const personaliserHref = model.slug ? PERSONALISER_HREF[model.slug] : undefined;
  const order = new URLSearchParams({ type: "full", model: model.id });
  if (model.tailor_id) order.set("tailor", model.tailor_id);
  const orderHref = `/commande/nouvelle?${order.toString()}`;

  const switcherTypes = models.map((m, i) => ({
    id: m.slug ?? m.id,
    name: m.name,
    image: m.image_url ?? modelPhotos(m)[0] ?? null,
    fromPrice: presets[i].total,
  }));

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
        basePath="/femme/robe-sur-mesure"
        label="Choisissez le type de robe"
        types={switcherTypes}
        activeId={model.slug ?? model.id}
      />

      <div className="grid gap-8 md:grid-cols-2">
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
            Femme · Robe sur mesure
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{model.name}</h1>
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> ~{model.avg_days} jours de confection
            </span>
            {model.difficulty && (
              <Badge variant="outline">
                {DIFFICULTY_LABEL[model.difficulty] ?? model.difficulty}
              </Badge>
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="text-primary size-4" /> Le prendre tel quel
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    Le modèle présenté, ajusté à votre taille.
                    {asIsFabric ? ` Présenté en ${asIsFabric.name}.` : ""}
                  </p>
                </div>
                <span className="text-primary shrink-0 text-lg font-bold">
                  {formatPrice(preset.total)}
                </span>
              </div>
              <div className="mt-4">
                <GarmentAsIs preset={preset} />
              </div>
            </div>

            {/* 2 — Le personnaliser : configurateur détaillé ou parcours de commande. */}
            <Link
              href={personaliserHref ?? orderHref}
              className="group bg-card hover:border-primary/50 hover:bg-muted/40 flex items-center gap-4 rounded-2xl border p-5 transition-colors"
            >
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Wand2 className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Le personnaliser</span>
                <span className="text-muted-foreground block text-sm">
                  {personaliserHref
                    ? "Encolure, manches, silhouette, longueur et finitions — dans le détail."
                    : "Choisissez le style, le tissu et le tailleur."}
                </span>
              </span>
              <span
                aria-hidden
                className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform"
              >
                →
              </span>
            </Link>
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
    </div>
  );
}
