import type { Metadata } from "next";
import Link from "@/components/i18n/link";

import { SearchInput } from "@/components/catalog/catalog-filters";
import { CollectionHero } from "@/components/catalog/collection-hero";
import { COLLECTION_HEADING } from "@/components/catalog/collection-sections";
import { DemoBanner } from "@/components/demo-banner";
import { TailorCard } from "@/components/catalog/tailor-card";
import {
  JoinTailors,
  WhyJalofa,
} from "@/components/catalog/tailleurs-sections";
import { skillModels } from "@/lib/catalog-link";
import { getModelSuggestions, getTailors } from "@/lib/data";

import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

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
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [all, catalog] = await Promise.all([getTailors(), getModelSuggestions()]);
  const tr = await getT();

  // Peu de tailleurs pour l'instant : pas de filtres, seulement la recherche.
  const tailors = q
    ? all.filter((t) => (t.shop_name ?? "").toLowerCase().includes(q.toLowerCase()))
    : all;

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
          titleClassName="text-[12vw] md:text-[8vw]"
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
            <Heading className={cn(COLLECTION_HEADING, "text-2xl md:text-4xl")}>{tr("Trouvez votre tailleur")}</Heading>
            <p className="mt-3 max-w-xl text-base">
              {tr("Des artisans qui cousent votre habit à vos mesures.")}
            </p>
          </div>
          <SearchInput placeholder={tr("Rechercher un tailleur...")} />
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
