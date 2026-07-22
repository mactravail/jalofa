import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, Ruler, Sparkles, Store, Truck, Wand2 } from "lucide-react";

import { GarmentAsIs } from "@/components/catalog/garment-as-is";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { formatPrice, modelPhotos } from "@/lib/constants";
import { getFabrics, getModelById, getStyles, getTailorById, getTailors } from "@/lib/data";
import { buildGenericAsIsPreset, GENERIC_AS_IS_FABRIC_ID } from "@/lib/garment-preset";
import { DEDICATED_HREF, PERSONALISER_HREF } from "@/lib/garment-routes";

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

  // L'`id` de l'URL est un UUID en base ; c'est le `slug` du modèle chargé qui
  // décide d'une éventuelle page dédiée. On charge donc le modèle d'abord, puis
  // on redirige vers son type dans la famille (cf. garment-routes.ts — le grand
  // boubou et la robe ont chacun plusieurs types partageant une seule page
  // dédiée).
  const model = await getModelById(id);
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
  // step, so it only ever starts from here. `type` / `fabric` / `tailor` come
  // back from an order that was begun before a garment was chosen — but the
  // author, when there is one, overrides whatever tailor was carried in.
  const order = new URLSearchParams({ type: type ?? "full", model: model.id });
  if (fabric) order.set("fabric", fabric);
  const orderTailor = model.tailor_id ?? tailor;
  if (orderTailor) order.set("tailor", orderTailor);
  const orderHref = `/commande/nouvelle?${order.toString()}`;

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

  const personaliserHref = model.slug ? PERSONALISER_HREF[model.slug] : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DemoBanner />
      <Link
        href="/modeles"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour aux modèles
      </Link>

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
                  {formatPrice(asIsPreset.total)}
                </span>
              </div>
              <div className="mt-4">
                <GarmentAsIs preset={asIsPreset} />
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
                    ? "Coupe, col, broderie, tissu et finitions — dans le détail."
                    : "Choisissez le style, le tissu et le tailleur."}
                </span>
              </span>
              <span
                aria-hidden
                className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
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
    </div>
  );
}
