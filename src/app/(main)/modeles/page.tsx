import type { Metadata } from "next";

import { CategoryChips, SearchInput } from "@/components/catalog/catalog-filters";
import { DemoBanner } from "@/components/demo-banner";
import { ModelCard } from "@/components/catalog/model-card";
import { getModelCategories, getModels } from "@/lib/data";

export const metadata: Metadata = {
  title: "Modèles",
  description: "Des centaines de modèles : boubou, kaftan, robe, ensemble et plus.",
};

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    type?: string;
    fabric?: string;
    tailor?: string;
  }>;
}) {
  const { category, q, type, fabric, tailor } = await searchParams;
  const [models, categories] = await Promise.all([
    getModels({ category }),
    getModelCategories(),
  ]);

  const filtered = q
    ? models.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
    : models;

  // The configurator sends people here when they started an order without
  // choosing a garment. Keep what they had already picked so the detail page can
  // hand it straight back.
  const context = new URLSearchParams();
  if (type) context.set("type", type);
  if (fabric) context.set("fabric", fabric);
  if (tailor) context.set("tailor", tailor);
  const contextQuery = context.toString();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modèles</h1>
          <p className="text-muted-foreground mt-1">
            Choisissez un modèle, puis un style et un tissu pour votre tenue.
          </p>
        </div>
        <SearchInput placeholder="Rechercher un modèle..." />
      </div>

      <div className="mb-8">
        <CategoryChips options={categories} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          Aucun modèle ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((model) => (
            <ModelCard key={model.id} model={model} context={contextQuery} />
          ))}
        </div>
      )}
    </div>
  );
}
