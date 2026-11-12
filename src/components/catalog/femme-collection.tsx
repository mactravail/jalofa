import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import {
  COLLECTION_CTA,
  CustomerReviews,
  GarmentChooser,
  HowItWorks,
} from "@/components/catalog/collection-sections";
import { modelHref } from "@/components/catalog/model-card";
import { UpcomingEvent, type UpcomingEventContent } from "@/components/catalog/upcoming-event";
import { FEMME_OCCASIONS, modelKey } from "@/lib/collection-occasions";
import type { LatestReviews } from "@/lib/data";
import { dream } from "@/lib/dream-font";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// La page /modeles?category=femme : on fait rêver d'abord, on explique ensuite.
// Le noir sert d'écrin : la couleur ne vient que des robes.
//
// Deux règles d'honnêteté :
// - Un tableau ne montre que les photos de l'habit vers lequel il mène, et disparaît
//   si cet habit n'existe pas dans le catalogue.
// - Les « Inspirations » n'ont pas encore de fiche : elles ne mènent donc à aucun
//   produit, et ne montrent pas de prix.
//
// Après le tableau, « Événement à venir ». Tant qu'aucun événement n'est daté,
// la bannière l'annonce sans inventer de nom ni de date.

const HEADING = cn(dream.className, "text-5xl leading-[1.05] text-balance md:text-7xl");

// À remplacer par le vrai événement (nom, date, lieu) dès qu'il est fixé.
const UPCOMING_EVENT: UpcomingEventContent = {
  eyebrow: "Événement à venir",
  title: "Bientôt",
  text: "Défilés et rencontres avec nos tailleurs : les prochaines dates arrivent ici.",
  image: {
    src: "/collection%20femme/meilleur.jpg",
    alt: "Mannequin sur un podium de défilé, haut à tournesols et jupe noire à franges",
    // Le visage est en haut, un peu à gauche du centre : on ne le coupe jamais.
    position: "object-[45%_15%]",
  },
};

/** Les photos claires du catalogue, assombries pour se fondre dans le noir. */
const PHOTO_ON_BLACK = "object-cover object-top brightness-[0.84] contrast-110";
const VIGNETTE =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.65))]";

const TABLEAUX = [
  {
    model: "tenue-de-ceremonie",
    line: "Le soir où tout le monde se tait.",
    text: "Les paillettes. Le voile. Le tombé. Coupés pour vous seule.",
    main: {
      src: "/collection%20femme/ceremonie/f.avif",
      alt: "Femme en longue robe bleu roi, cape de voile et de paillettes",
    },
    second: {
      src: "/collection%20femme/ceremonie/f3.avif",
      alt: "La même robe vue de dos, cape de paillettes ouverte comme des ailes",
    },
  },
];

const INSPIRATIONS = [
  { src: "/collection%20femme/robe/h3.avif", alt: "Robe longue noire semée d'étoiles" },
  { src: "/collection%20femme/ceremonie/g.avif", alt: "Robe rouge scintillante, manches bouffantes" },
  { src: "/collection%20femme/ceremonie/h.avif", alt: "Robe longue couleur champagne" },
  { src: "/collection%20femme/jupe/l.avif", alt: "Robe longue verte à fleurs dorées" },
  { src: "/collection%20femme/jupe/x.avif", alt: "Robe blanche en dentelle" },
];

async function Opening() {
  const t = await getT();
  return (
    <section className="mx-auto max-w-4xl px-6 pt-20 text-center md:pt-36">
      <p className={cn(dream.className, "text-5xl leading-[1.1] text-balance md:text-8xl")}>
        {t("Il y a une robe que vous n'avez vue qu'en rêve.")}
      </p>
      <p className="text-muted-foreground mx-auto mt-6 max-w-md text-lg md:mt-8 md:text-xl">
        {t("Un tailleur la coud pour vous, à vos mesures.")}
      </p>
      <div aria-hidden className="strass-line mx-auto mt-10 w-48 md:mt-14 md:w-72" />
    </section>
  );
}

async function Tableaux({ models, context }: { models: GarmentModel[]; context?: string }) {
  const t = await getT();
  const platform = new Map(
    models.filter((m) => m.tailor_id === null).map((m) => [modelKey(m.name), m]),
  );
  const tableaux = TABLEAUX.flatMap((tableau) => {
    const model = platform.get(tableau.model);
    return model ? [{ ...tableau, garment: model }] : [];
  });

  return (
    <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-16 px-4 md:mt-28 md:gap-32 md:px-8">
      {tableaux.map((tableau, i) => (
        <article
          key={tableau.model}
          className="dream-rise grid gap-6 md:grid-cols-12 md:items-center md:gap-8"
        >
          <Link
            href={modelHref(tableau.garment, context)}
            className={cn(
              "group relative block aspect-3/4 overflow-hidden rounded-xl md:col-span-7",
              i % 2 === 1 && "md:order-2 md:col-start-6",
            )}
          >
            <Image
              src={tableau.main.src}
              alt={t(tableau.main.alt)}
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className={cn(
                PHOTO_ON_BLACK,
                "transition-transform duration-1000 group-hover:scale-[1.03]",
              )}
            />
            <span aria-hidden className={VIGNETTE} />
          </Link>

          <div
            className={cn(
              "min-w-0 md:col-span-5",
              i % 2 === 1 && "md:order-1 md:col-span-5 md:col-start-1 md:row-start-1",
            )}
          >
            <h2 className={HEADING}>{t(tableau.line)}</h2>
            <p className="text-muted-foreground mt-4 max-w-sm text-lg">{t(tableau.text)}</p>
            <div className="relative mt-8 hidden aspect-4/5 w-44 overflow-hidden rounded-xl md:block lg:w-56">
              <Image
                src={tableau.second.src}
                alt={t(tableau.second.alt)}
                fill
                sizes="14rem"
                className={PHOTO_ON_BLACK}
              />
              <span aria-hidden className={VIGNETTE} />
            </div>
            <Link
              href={modelHref(tableau.garment, context)}
              className={cn(COLLECTION_CTA, "mt-8")}
            >
              {tableau.garment.name}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

async function Inspirations() {
  const t = await getT();
  return (
    <section className="mt-20 md:mt-36">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className={HEADING}>{t("Inspirations")}</h2>
        <p className="text-muted-foreground mt-3 max-w-md text-lg">{t("Regardez. Rêvez un peu.")}</p>
      </div>
      {/* Sur téléphone, un rail qui défile au doigt, sans élargir la page. */}
      <ul className="mt-8 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:mx-auto md:mt-12 md:grid md:max-w-7xl md:grid-cols-5 md:gap-3 md:overflow-visible md:px-8 md:pb-14">
        {INSPIRATIONS.map((photo, i) => (
          <li
            key={photo.src}
            className={cn(
              "relative aspect-3/5 w-[68vw] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[40vw] md:w-auto",
              i % 2 === 1 && "md:translate-y-14",
            )}
          >
            <Image
              src={photo.src}
              alt={t(photo.alt)}
              fill
              sizes="(min-width: 768px) 20vw, 68vw"
              className={PHOTO_ON_BLACK}
            />
            <span aria-hidden className={VIGNETTE} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FemmeCollection({
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
        number="02"
        eyebrow="Celle qu'on n'oublie pas"
        title="Femme"
        image={{
          src: "/collection%20femme/archa.jpg",
          alt: "Portrait en noir et blanc d'une femme à la frange noire, le regard droit, le col perlé de strass",
          // Le regard doit rester au centre du cadre, même en paysage.
          position: "object-[50%_42%]",
          className: "dream-zoom",
        }}
        target="reve"
      />
      <div id="reve" className="scroll-mt-16">
        <Opening />
        <Tableaux models={models} context={context} />
        <Inspirations />
      </div>
      <GarmentChooser
        models={models}
        context={context}
        occasions={FEMME_OCCASIONS}
        headingClassName={HEADING}
      />
      <HowItWorks headingClassName={HEADING} />
      {/* Une page de rêve ne s'excuse pas de ne pas encore avoir d'avis : la section
          n'apparaît qu'avec de vrais avis. */}
      {reviews.count > 0 && <CustomerReviews data={reviews} headingClassName={HEADING} />}
      {/* L'événement à venir ferme la page, juste avant le pied de page. */}
      <UpcomingEvent event={UPCOMING_EVENT} />
    </div>
  );
}
