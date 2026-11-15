import type { Metadata } from "next";
import { SlidersHorizontal, X } from "lucide-react";

import Link from "@/components/i18n/link";
import { buttonVariants } from "@/components/ui/button";

import { CategoryChips, ColorDots, SearchInput } from "@/components/catalog/catalog-filters";
import { CollectionHero } from "@/components/catalog/collection-hero";
import { DemoBanner } from "@/components/demo-banner";
import { FabricCard } from "@/components/catalog/fabric-card";
import { getFabricCategories, getFabrics } from "@/lib/data";
import { FABRIC_COLORS } from "@/lib/fabric-colors";
import { PRICE_RANGES, USAGE_FILTERS, WEIGHTS } from "@/lib/fabric-specs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Tissus"),
    description: t("Parcourez et achetez des tissus au mètre : laine, coton, lin et plus."),
  };
}

/** Les couleurs du filtre : la palette du vendeur, sans les nuances voisines. */
const FILTER_COLORS = FABRIC_COLORS.filter((c) =>
  [
    "Blanc",
    "Beige",
    "Jaune",
    "Or",
    "Orange",
    "Rouge",
    "Bordeaux",
    "Rose",
    "Violet",
    "Bleu",
    "Bleu marine",
    "Turquoise",
    "Vert",
    "Marron",
    "Gris",
    "Noir",
  ].includes(c.name),
);

const WEIGHT_OPTIONS = Object.entries(WEIGHTS).map(([slug, w]) => ({ slug, name: w.label }));

export default async function FabricsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    color?: string;
    usage?: string;
    weight?: string;
    price?: string;
  }>;
}) {
  const { category, q, color, usage, weight, price } = await searchParams;
  const t = await getT();
  const range = PRICE_RANGES.find((r) => r.slug === price);
  const [fabrics, categories] = await Promise.all([
    getFabrics({ category, q, color, usage, weight, minPrice: range?.min, maxPrice: range?.max }),
    getFabricCategories(),
  ]);

  // Une recherche ou un filtre précis : on va droit aux résultats, sans le hero.
  const extraFilters = [color, usage, weight, price].filter(Boolean).length;
  const showHero = !q && extraFilters === 0;
  // Un filtre actif, quel qu'il soit : on offre toujours le retour à tout le catalogue.
  const anyFilter = Boolean(q || category) || extraFilters > 0;
  const clearAll = (
    <Link href="/tissus#collection" className={buttonVariants({ variant: "outline", size: "lg" })}>
      <X className="size-4" /> {t("Voir tous les tissus")}
    </Link>
  );

  const filters = (
    <div className="border-t">
      <CategoryChips label="Tissu" options={categories} />
      <ColorDots label="Couleur" colors={FILTER_COLORS} />
      <CategoryChips label="Pour" paramName="usage" options={USAGE_FILTERS} />
      <CategoryChips label="Épaisseur" paramName="weight" options={WEIGHT_OPTIONS} />
      <CategoryChips label="Prix" paramName="price" options={PRICE_RANGES} />
    </div>
  );

  return (
    <>
      {showHero && (
        <CollectionHero
          number="03"
          eyebrow="Choisissez votre étoffe"
          title="Tissus"
          image={{ src: "/look/karola.jpg", alt: "Rouleaux de tissus jaunes, orange et rouges" }}
          target="collection"
        />
      )}
      <div id="collection" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8">
        <DemoBanner />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {!showHero && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("Tissus")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("Achetez au mètre et faites-vous livrer, ou utilisez-les pour votre tenue.")}
              </p>
            </div>
          )}
          <SearchInput placeholder={t("Rechercher un tissu...")} />
        </div>

        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          {/* Téléphone : filtres repliés sous un bouton. Ordinateur : barre latérale. */}
          <details className="mb-6 rounded-xl border lg:hidden" open={extraFilters > 0}>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium">
              <SlidersHorizontal className="size-4" />
              {t("Filtres")}
              {extraFilters > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 text-xs">
                  {extraFilters}
                </span>
              )}
            </summary>
            <div className="px-4 pb-2">{filters}</div>
          </details>
          <aside className="hidden lg:block">
            <div className="sticky top-24">{filters}</div>
          </aside>

          <div>
            {anyFilter && fabrics.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  {t("{n} tissus", { n: fabrics.length })}
                </p>
                {clearAll}
              </div>
            )}
            {fabrics.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-16 text-center">
                <p className="text-muted-foreground">
                  {t("Aucun tissu ne correspond à votre recherche.")}
                </p>
                {anyFilter && clearAll}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {fabrics.map((fabric) => (
                  <FabricCard key={fabric.id} fabric={fabric} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
