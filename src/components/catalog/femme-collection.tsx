import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import {
  COLLECTION_CTA,
  CustomerReviews,
  GarmentChooser,
  HowItWorks,
} from "@/components/catalog/collection-sections";
import { modelHref } from "@/components/catalog/model-card";
import { FEMME_OCCASIONS, modelKey } from "@/lib/collection-occasions";
import type { LatestReviews } from "@/lib/data";
import { dream } from "@/lib/dream-font";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";

// La page /modeles?category=femme : on fait rêver d'abord, on explique ensuite.
// Le noir sert d'écrin : la couleur ne vient que des robes.
//
// Deux règles d'honnêteté :
// - Un tableau ne montre que les photos de l'habit vers lequel il mène, et disparaît
//   si cet habit n'existe pas dans le catalogue.
// - Les « Inspirations » n'ont pas encore de fiche : elles ne mènent donc à aucun
//   produit, et ne montrent pas de prix.

const HEADING = cn(dream.className, "text-5xl leading-[1.05] text-balance md:text-7xl");

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
  {
    model: "boubou-femme",
    line: "Un pas. Et tout le monde se retourne.",
    text: "Une pièce qui bouge avec vous. Vous choisissez le tissu, le tailleur coud.",
    main: {
      src: "/collection%20femme/ceremonie/k2.avif",
      alt: "Femme qui marche, tenue verte et longue étole à grandes feuilles",
    },
    second: {
      src: "/collection%20femme/ceremonie/k.avif",
      alt: "La même tenue vue de face",
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

function Opening() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-20 text-center md:pt-36">
      <p className={cn(dream.className, "text-5xl leading-[1.1] text-balance md:text-8xl")}>
        Il y a une robe que vous n&apos;avez vue qu&apos;en rêve.
      </p>
      <p className="text-muted-foreground mx-auto mt-6 max-w-md text-lg md:mt-8 md:text-xl">
        Un tailleur la coud pour vous, à vos mesures.
      </p>
      <div aria-hidden className="strass-line mx-auto mt-10 w-48 md:mt-14 md:w-72" />
    </section>
  );
}

function Tableaux({ models, context }: { models: GarmentModel[]; context?: string }) {
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
              alt={tableau.main.alt}
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
            <h2 className={HEADING}>{tableau.line}</h2>
            <p className="text-muted-foreground mt-4 max-w-sm text-lg">{tableau.text}</p>
            <div className="relative mt-8 hidden aspect-4/5 w-44 overflow-hidden rounded-xl md:block lg:w-56">
              <Image
                src={tableau.second.src}
                alt={tableau.second.alt}
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

function Inspirations() {
  return (
    <section className="mt-20 md:mt-36">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className={HEADING}>Inspirations</h2>
        <p className="text-muted-foreground mt-3 max-w-md text-lg">Regardez. Rêvez un peu.</p>
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
              alt={photo.alt}
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

function FinalCall() {
  return (
    <section className="mx-auto mt-20 grid max-w-7xl px-4 md:mt-32 md:grid-cols-2 md:px-8">
      <div className="relative aspect-4/5 overflow-hidden rounded-xl md:aspect-auto md:min-h-[42rem]">
        <Image
          src="/collection%20femme/odobe.jpg"
          alt="Portrait d'une femme de profil, voile sombre sur la tête, dans une lumière douce"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-[50%_15%]"
        />
      </div>
      <div className="flex flex-col justify-center py-12 md:pl-16">
        <h2 className={HEADING}>Votre grand jour approche&nbsp;?</h2>
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
      <FinalCall />
    </div>
  );
}
