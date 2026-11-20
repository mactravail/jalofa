import type { Metadata } from "next";
import Link from "@/components/i18n/link";

import { CategoryChips, SearchInput } from "@/components/catalog/catalog-filters";
import { CollectionHero } from "@/components/catalog/collection-hero";
import { COLLECTION_HEADING } from "@/components/catalog/collection-sections";
import { DemoBanner } from "@/components/demo-banner";
import { TailorCard } from "@/components/catalog/tailor-card";
import {
  JoinTailors,
  WhyJalofa,
} from "@/components/catalog/tailleurs-sections";
import { skillModels } from "@/lib/catalog-link";
import { getModels, getModelSuggestions, getTailors } from "@/lib/data";
import type { GarmentModel, Tailor } from "@/lib/types";

type Audience = "homme" | "femme";

const AUDIENCES = [
  { slug: "homme", name: "Homme" },
  { slug: "femme", name: "Femme" },
];

/**
 * Le tailleur coud-il pour cette clientèle ? Sa « Spécialisation » le dit ;
 * sans spécialisation, ce qu'il sait faire et ses modèles publiés (habits homme
 * ou femme) en tiennent lieu.
 */
function sewsFor(
  tailor: Tailor,
  audience: Audience,
  catalog: GarmentModel[],
  published: GarmentModel[],
): boolean {
  if (tailor.specialty) return tailor.specialty === "both" || tailor.specialty === audience;
  return (
    skillModels(tailor.skills, catalog).some((m) => m.category_slug === audience) ||
    published.some((m) => m.tailor_id === tailor.id && m.category_slug === audience)
  );
}
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Tailleurs"),
    description: t("Trouvez un tailleur de confiance près de chez vous en Afrique."),
  };
}

export default async function TailorsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string; pour?: string }>;
}) {
  const { city, q, pour } = await searchParams;
  const audience: Audience | null = pour === "homme" || pour === "femme" ? pour : null;
  const [all, catalog, published] = await Promise.all([
    getTailors(),
    getModelSuggestions(),
    // Les modèles publiés ne servent qu'au filtre Homme / Femme.
    pour ? getModels() : Promise.resolve([] as GarmentModel[]),
  ]);
  const tr = await getT();

  const cities = Array.from(
    new Set(all.map((t) => t.city).filter((c): c is string => Boolean(c))),
  ).map((c) => ({ slug: c, name: c }));

  const tailors = all.filter((t) => {
    if (city && t.city !== city) return false;
    if (audience && !sewsFor(t, audience, catalog, published)) return false;
    if (q && !(t.shop_name ?? "").toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  // Une recherche : on va droit aux résultats, sans le hero.
  const showHero = !q;
  const Heading = showHero ? "h2" : "h1";

  return (
    <>
      {showHero && (
        <CollectionHero
          number="04"
          eyebrow="Choisissez votre artisan"
          title="Tailleurs"
          titleClassName="text-[16vw] md:text-[11vw]"
          image={{
            src: "/avis/wandi.jpg",
            alt: "Mains d'un tailleur guidant un tissu sous l'aiguille d'une machine à coudre",
            // Sur téléphone, le cadrage garde l'aiguille et la main droite.
            position: "object-[62%_center] md:object-center",
            // La machine est très claire : sans ça, le titre blanc s'y perd.
            className: "brightness-[0.72]",
          }}
          target="tailleurs"
          secondaryLink={{ href: "#rejoindre", label: "Je suis tailleur" }}
        />
      )}

      <section
        id="tailleurs"
        className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-14 md:px-8 md:pt-24"
      >
        <DemoBanner />

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <Heading className={COLLECTION_HEADING}>{tr("Trouvez votre tailleur")}</Heading>
            <p className="mt-3 max-w-xl text-lg">
              {tr("Des artisans qui cousent votre habit à vos mesures.")}
            </p>
          </div>
          <SearchInput placeholder={tr("Rechercher un tailleur...")} />
        </div>

        <div className="mt-6 space-y-3 md:mt-8">
          {/* Homme / Femme : un tailleur « les deux » apparaît dans les deux. */}
          <CategoryChips options={AUDIENCES} paramName="pour" />
          <CategoryChips options={cities} paramName="city" />
        </div>

        {tailors.length === 0 ? (
          <div className="mt-8 rounded-xl border border-white/15 p-6 text-center md:p-10">
            <p className="text-lg">{tr("Aucun tailleur ne correspond à votre recherche.")}</p>
            <Link
              href="/tailleurs"
              className="mt-3 inline-block underline underline-offset-4 hover:opacity-70"
            >
              {tr("Voir tous les tailleurs")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tailors.map((tailor) => (
              <TailorCard
                key={tailor.id}
                tailor={tailor}
                skills={[
                  ...skillModels(tailor.skills, catalog).map((m) => m.name),
                  ...(tailor.custom_skills ?? []),
                ]}
              />
            ))}
          </div>
        )}
      </section>

      <WhyJalofa />
      <JoinTailors />
    </>
  );
}
