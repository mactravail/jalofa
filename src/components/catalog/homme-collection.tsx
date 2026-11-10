import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import {
  COLLECTION_CTA,
  COLLECTION_HEADING,
  CommonQuestions,
  CustomerReviews,
  GarmentChooser,
  HowItWorks,
} from "@/components/catalog/collection-sections";
import { UpcomingEvent, type UpcomingEventContent } from "@/components/catalog/upcoming-event";
import { HOMME_OCCASIONS } from "@/lib/collection-occasions";
import type { LatestReviews } from "@/lib/data";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// La page /modeles?category=homme suit le chemin d'une décision d'achat :
// 1. l'envie (le hero : l'homme qu'on remarque) ;
// 2. le choix, avec la garantie sous les yeux au moment de choisir, puis les
//    événements à venir (sans bouton : la bannière annonce, elle ne vend pas) ;
// 3. comment ça marche (on n'achète pas ce qu'on ne comprend pas) ;
// 4. les objections, dites avec les mots du client ;
// 5. la preuve : de vrais avis seulement ;
// 6. l'appel final, avec un délai réel et la garantie juste sous le bouton.

// À remplacer par le vrai événement (nom, date, lieu) dès qu'il est fixé.
const UPCOMING_EVENT: UpcomingEventContent = {
  eyebrow: "Événement à venir",
  title: "Bientôt",
  text: "Défilés et rencontres avec nos tailleurs : les prochaines dates arrivent ici.",
  image: {
    src: "/collection%20homme/kadira.jpg",
    alt: "Homme debout dans un studio sombre, éclairé par un projecteur, son ombre portée au sol",
    // L'homme est au centre de la photo : on le garde au centre, même en vertical.
    position: "object-[52%_55%]",
  },
};

/** Le délai médian des habits de la page : un chiffre vrai vaut mieux que « vite ». */
function typicalDays(models: GarmentModel[]): number | null {
  const days = models
    .map((m) => m.avg_days)
    .filter((d): d is number => d != null && d > 0)
    .sort((a, b) => a - b);
  if (days.length === 0) return null;
  return days[Math.floor(days.length / 2)];
}

async function FinalCall({ days }: { days: number | null }) {
  const t = await getT();
  return (
    <section className="mx-auto mt-20 grid max-w-7xl px-4 md:mt-32 md:mb-28 md:grid-cols-2 md:px-8">
      <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-xl md:aspect-auto md:min-h-[38rem]">
        <Image
          src="/collection%20homme/style/kaftan.avif"
          alt={t("Homme en kaftan noir brodé")}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-top"
        />
      </div>
      <div className="flex flex-col justify-center py-12 md:pl-16">
        <h2 className={COLLECTION_HEADING}>{t("Une fête approche ?")}</h2>
        <p className="text-muted-foreground mt-4 max-w-sm text-lg">
          {days != null
            ? t("Un habit sur mesure prend environ {n} jours. Commandez aujourd'hui : le jour venu, vous serez prêt.", { n: days })
            : t("Commandez tôt. Votre tailleur a le temps de bien faire, et vous serez prêt.")}
        </p>
        <a href="#choisir" className={cn(COLLECTION_CTA, "mt-8 sm:self-start")}>
          {t("Choisir mon habit")}
          <ArrowRight className="size-5" aria-hidden />
        </a>
        <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {t("Le tailleur est payé seulement après la livraison.")}
        </p>
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
      <UpcomingEvent event={UPCOMING_EVENT} />
      <HowItWorks />
      <CommonQuestions />
      <CustomerReviews data={reviews} />
      <FinalCall days={typicalDays(models)} />
    </div>
  );
}
