import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import {
  COLLECTION_CTA,
  COLLECTION_HEADING,
  CustomerReviews,
  GarmentChooser,
  HowItWorks,
} from "@/components/catalog/collection-sections";
import { HOMME_OCCASIONS } from "@/lib/collection-occasions";
import type { LatestReviews } from "@/lib/data";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";

// La page /modeles?category=homme : l'envie (le hero), le choix de l'habit à faire
// coudre (une seule section, filtrée par occasion), l'explication du parcours,
// puis les avis. Sans avis, la section le dit.

function FinalCall() {
  return (
    <section className="mx-auto mt-20 grid max-w-7xl px-4 md:mt-32 md:grid-cols-2 md:px-8">
      <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-xl md:aspect-auto md:min-h-[38rem]">
        <Image
          src="/collection%20homme/style/kaftan.avif"
          alt="Homme en kaftan noir brodé"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-top"
        />
      </div>
      <div className="flex flex-col justify-center py-12 md:pl-16">
        <h2 className={COLLECTION_HEADING}>Une fête approche&nbsp;?</h2>
        <p className="text-muted-foreground mt-4 max-w-sm text-lg">
          Commandez tôt. Votre tailleur a le temps de bien faire.
        </p>
        <a href="#choisir" className={cn(COLLECTION_CTA, "mt-8 sm:self-start")}>
          Choisir mon habit
          <ArrowRight className="size-5" aria-hidden />
        </a>
      </div>
    </section>
  );
}

export function HommeCollection({
  models,
  context,
  reviews,
}: {
  models: GarmentModel[];
  context?: string;
  reviews: LatestReviews;
}) {
  return (
    <div>
      <CollectionHero
        number="01"
        eyebrow="L'homme qu'on remarque"
        title="Homme"
        image={{
          src: "/collection%20homme/shvets.jpg",
          alt: "Homme en veste et chemise noires, le regard baissé, sur fond sombre",
          // Sa tête touche le haut de la photo : on ne coupe jamais par le haut.
          position: "object-[68%_top] md:object-top",
        }}
        target="choisir"
      />
      <GarmentChooser models={models} context={context} occasions={HOMME_OCCASIONS} />
      <HowItWorks />
      <CustomerReviews data={reviews} />
      <FinalCall />
    </div>
  );
}
