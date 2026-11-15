import type { Metadata } from "next";

import { CategoryChips, SearchInput } from "@/components/catalog/catalog-filters";
import { CollectionHero } from "@/components/catalog/collection-hero";
import { DemoBanner } from "@/components/demo-banner";
import { VendorCard } from "@/components/catalog/vendor-card";
import { ProJoinCta } from "@/components/pro-join-cta";
import { ArrowRight } from "lucide-react";

import Link from "@/components/i18n/link";
import { FabricCard } from "@/components/catalog/fabric-card";
import { ScrollRail } from "@/components/catalog/scroll-rail";
import { getFabrics, getVendors } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Vendeurs de tissu"),
    description: t("Découvrez les boutiques de tissu d'Afrique : bazin, wax, lin et plus."),
  };
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const { city, q } = await searchParams;
  const [all, allFabrics] = await Promise.all([getVendors(), getFabrics()]);
  const t = await getT();

  const cities = Array.from(
    new Set(all.map((v) => v.city).filter((c): c is string => Boolean(c))),
  ).map((c) => ({ slug: c, name: c }));

  const vendors = all.filter((v) => {
    if (city && v.city !== city) return false;
    if (q && !(v.shop_name ?? "").toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  // La petite bande « Acheter des tissus » : seulement les tissus des vendeurs
  // affichés ci-dessus et ceux du catalogue JALOFA (sans vendeur), en stock.
  // Les tissus d’un pro « tailleur seul » n’y figurent pas.
  const listed = new Set(all.map((v) => v.id));
  const fabrics = allFabrics
    .filter((f) => (!f.vendor_id || listed.has(f.vendor_id)) && f.in_stock !== false)
    .slice(0, 10);

  // Une recherche : on va droit aux résultats, sans le hero.
  const showHero = !q;
  const Heading = showHero ? "h2" : "h1";

  return (
    <>
      {showHero && (
        <CollectionHero
          compact
          number="05"
          eyebrow="Choisissez votre boutique"
          title="Vendeurs"
          image={{
            src: "/look/karola.jpg",
            alt: "Rouleaux de tissus jaunes, orange et rouges",
            position: "object-[center_35%]",
            className: "brightness-[0.8]",
          }}
          target="boutiques"
        />
      )}
      <div id="boutiques" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8">
        <DemoBanner />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Heading className="text-3xl font-bold tracking-tight">
              {t("Vendeurs de tissu")}
            </Heading>
            <p className="text-muted-foreground mt-1">
              {t("Des boutiques de confiance pour vos bazins, wax et étoffes sur mesure.")}
            </p>
          </div>
          <SearchInput placeholder={t("Rechercher une boutique...")} />
        </div>

        <div className="mb-8">
          <CategoryChips options={cities} paramName="city" />
        </div>

        {vendors.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            {t("Aucun vendeur ne correspond à votre recherche.")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}

        {fabrics.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight">
                {t("Acheter des tissus")}
              </h2>
              <Link
                href="/tissus"
                className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-sm font-medium"
              >
                {t("Voir tous les tissus")} <ArrowRight className="size-4" />
              </Link>
            </div>
            <ScrollRail>
              {fabrics.map((fabric) => (
                <li key={fabric.id} className="w-36 shrink-0 snap-start sm:w-44 [&>a]:block">
                  <FabricCard fabric={fabric} />
                </li>
              ))}
            </ScrollRail>
          </section>
        )}
      </div>

      <ProJoinCta metier="vendor" />
    </>
  );
}
