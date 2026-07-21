import type { Metadata } from "next";

import { CategoryChips, SearchInput } from "@/components/catalog/catalog-filters";
import { DemoBanner } from "@/components/demo-banner";
import { VendorCard } from "@/components/catalog/vendor-card";
import { getVendors } from "@/lib/data";

export const metadata: Metadata = {
  title: "Vendeurs de tissu",
  description:
    "Découvrez les boutiques de tissu d'Afrique : bazin, wax, lin et plus.",
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const { city, q } = await searchParams;
  const all = await getVendors();

  const cities = Array.from(
    new Set(all.map((v) => v.city).filter((c): c is string => Boolean(c))),
  ).map((c) => ({ slug: c, name: c }));

  const vendors = all.filter((v) => {
    if (city && v.city !== city) return false;
    if (q && !(v.shop_name ?? "").toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendeurs de tissu</h1>
          <p className="text-muted-foreground mt-1">
            Des boutiques de confiance pour vos bazins, wax et étoffes sur mesure.
          </p>
        </div>
        <SearchInput placeholder="Rechercher une boutique..." />
      </div>

      <div className="mb-8">
        <CategoryChips options={cities} paramName="city" />
      </div>

      {vendors.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          Aucun vendeur ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}
