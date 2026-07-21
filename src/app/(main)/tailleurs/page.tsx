import type { Metadata } from "next";

import { CategoryChips, SearchInput } from "@/components/catalog/catalog-filters";
import { DemoBanner } from "@/components/demo-banner";
import { TailorCard } from "@/components/catalog/tailor-card";
import { getTailors } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tailleurs",
  description: "Trouvez un tailleur de confiance près de chez vous en Afrique.",
};

export default async function TailorsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const { city, q } = await searchParams;
  const all = await getTailors();

  const cities = Array.from(
    new Set(all.map((t) => t.city).filter((c): c is string => Boolean(c))),
  ).map((c) => ({ slug: c, name: c }));

  const tailors = all.filter((t) => {
    if (city && t.city !== city) return false;
    if (q && !(t.shop_name ?? "").toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tailleurs</h1>
          <p className="text-muted-foreground mt-1">
            Des artisans qualifiés pour confectionner votre tenue sur mesure.
          </p>
        </div>
        <SearchInput placeholder="Rechercher un tailleur..." />
      </div>

      <div className="mb-8">
        <CategoryChips options={cities} paramName="city" />
      </div>

      {tailors.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          Aucun tailleur ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tailors.map((tailor) => (
            <TailorCard key={tailor.id} tailor={tailor} />
          ))}
        </div>
      )}
    </div>
  );
}
