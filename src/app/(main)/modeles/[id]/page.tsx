import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, Ruler, Sparkles, Store, Truck } from "lucide-react";

import { GarmentAsIs } from "@/components/catalog/garment-as-is";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import { GarmentPersonalise } from "@/components/catalog/garment-personalise";
import { GarmentReviews } from "@/components/catalog/garment-reviews";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { formatPrice, modelPhotos } from "@/lib/constants";
import { getFabrics, getModelByIdOrSlug, getStyles, getTailorById, getTailors } from "@/lib/data";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { DEDICATED_HREF } from "@/lib/garment-routes";
import { garmentSocialProof } from "@/lib/garment-social-proof";

// Page dédiée d'un modèle : le prendre tel quel (taille seulement) ou le personnaliser.
const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

export default async function ModelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; fabric?: string; tailor?: string }>;
}) {
  const { id } = await params;
  const { type, fabric, tailor } = await searchParams;

  // Le segment d'URL peut être l'`id` UUID (cartes du catalogue) ou le `slug`
  // stable (tuiles de la home) — cf. `getModelByIdOrSlug`. C'est le `slug` du
  // modèle chargé qui décide d'une éventuelle page dédiée : on charge donc le
  // modèle d'abord, puis on redirige vers son type dans la famille (cf.
  // garment-routes.ts — le grand boubou et la robe ont chacun plusieurs types
  // partageant une seule page dédiée).
  const model = await getModelByIdOrSlug(id);
  if (!model) notFound();
  if (model.slug && DEDICATED_HREF[model.slug]) {
    redirect(`${DEDICATED_HREF[model.slug]}?type=${model.slug}`);
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

  // This is where the garment gets locked in: the configurator has no model
  // step, so it only ever starts from here. `type` / `tailor` come back from an
  // order begun before a garment was chosen — the author, when there is one,
  // overrides whatever tailor was carried in. The fabric is NOT put here: it is
  // chosen in the « Le personnaliser » card below (and carried in via ?fabric=).
  const orderParams = new URLSearchParams({ type: type ?? "full", model: model.id });
  const orderTailor = model.tailor_id ?? tailor;
  if (orderTailor) orderParams.set("tailor", orderTailor);

  // --- « Le prendre tel quel » : le modèle présenté, on ne choisit que la taille.
  const asIsFabric = fabrics.find((f) => f.id === GENERIC_AS_IS_FABRIC_ID) ?? fabrics[0] ?? null;
  // À défaut d'auteur, l'atelier assigne un tailleur pour la version prête.
  const asIsTailor = author ?? tailors[0] ?? null;
  const asIsPreset = buildGenericAsIsPreset({
    model,
    photos,
    fabric: asIsFabric,
    tailor: asIsTailor,
  });

  // Les avis de ce vêtement — sur la pièce comme sur l'atelier qui la coud.
  // L'auteur du modèle passe en tête des ateliers cités.
  const reviewTailors = author
    ? [author, ...tailors.filter((t) => t.id !== author.id)]
    : tailors;
  const proof = garmentSocialProof(model, reviewTailors);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DemoBanner />
      <Link
        href="/modeles"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour aux modèles
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
          <h1 className="text-3xl font-bold tracking-tight">{model.name}</h1>
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

          {/* Deux chemins pour ce vêtement précis. */}
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
                  {formatPrice(asIsPreset.total)}
                </span>
                <p className="text-muted-foreground w-full text-sm">
                  Le modèle présenté, ajusté à votre taille.
                  {asIsFabric ? ` Présenté en ${asIsFabric.name}.` : ""}
                </p>
              </div>
              <div className="mt-4">
                <GarmentAsIs preset={asIsPreset} />
              </div>
            </div>

            {/* 2 — Le personnaliser. Un seul chemin pour tous les vêtements :
                le tissu se choisit ici, puis le configurateur (Style, Quantité,
                Tailleur, Mesures) — qui, lui, ne rechoisit plus le tissu. */}
            <GarmentPersonalise
              fabrics={fabrics}
              orderParams={orderParams.toString()}
              initialFabricId={fabric ?? null}
            />
          </div>

          {styles.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="text-primary size-4" /> Occasions
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {styles.map((s) => (
                  <Badge key={s.slug} variant="secondary">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
