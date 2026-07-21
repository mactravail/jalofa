import type { Metadata } from "next";

import { CategoryChips, SearchInput } from "@/components/catalog/catalog-filters";
import { DemoBanner } from "@/components/demo-banner";
import { FabricCard } from "@/components/catalog/fabric-card";
import { getFabricCategories, getFabrics } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tissus",
  description: "Parcourez et achetez des tissus au mètre : laine, coton, lin et plus.",
};

export default async function FabricsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; color?: string }>;
}) {
  const { category, q, color } = await searchParams;
  const [fabrics, categories] = await Promise.all([
    getFabrics({ category, q, color }),
    getFabricCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tissus</h1>
          <p className="text-muted-foreground mt-1">
            Achetez au mètre et faites-vous livrer, ou utilisez-les pour votre tenue.
          </p>
        </div>
        <SearchInput placeholder="Rechercher un tissu..." />
      </div>

      <div className="mb-8">
        <CategoryChips options={categories} />
      </div>

      {fabrics.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          Aucun tissu ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {fabrics.map((fabric) => (
            <FabricCard key={fabric.id} fabric={fabric} />
          ))}
        </div>
      )}
    </div>
  );
}
