import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Undo2 } from "lucide-react";

import { GarmentPicker } from "@/components/catalog/garment-picker";
import { modelHref } from "@/components/catalog/model-card";
import { ReviewStars } from "@/components/catalog/review-stars";
import {
  orderForPicker,
  wornCover,
  type CollectionOccasion,
} from "@/lib/collection-occasions";
import type { LatestReviews, TailorReview } from "@/lib/data";
import { display } from "@/lib/display-font";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Les sections communes aux collections Homme et Femme : le choix de l'habit,
// l'explication du parcours, les avis. Chaque page garde son propre ton grâce à
// `headingClassName`. Tout ce qui est promis ici doit rester vrai : voir les
// articles A6 et A9 de /conditions, et les moyens ouverts à la caisse
// (`VISIBLE_PAYMENT_METHODS`). Les avis sont ceux de la table `reviews`, jamais
// des exemples.

const STEPS = [
  {
    title: "Choisissez l'habit",
    text: "Prenez le modèle qui vous plaît, sur cette page.",
  },
  {
    title: "Choisissez le tissu et le tailleur",
    text: "Vous comparez les tailleurs, leurs prix et leurs délais. Vous décidez.",
  },
  {
    title: "Donnez vos mesures",
    text: "Votre taille, de XS à XXXL, ou vos mesures détaillées. Depuis votre téléphone.",
  },
  {
    title: "Payez",
    text: "Par Wave ou par carte. JALOFA garde l'argent : le tailleur n'est pas encore payé.",
  },
  {
    title: "Le tailleur coud",
    text: "Vous voyez chaque étape de votre habit sur votre téléphone.",
  },
  {
    title: "Recevez votre habit",
    text: "Vous vérifiez. Un problème ? Vous avez 5 jours pour le signaler.",
  },
];

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: "Votre argent est protégé",
    text: "Le tailleur est payé seulement après la livraison.",
  },
  {
    icon: Undo2,
    title: "Parole non tenue ? Remboursé",
    text: "Grand retard, défaut, mauvais habit : ouvrez une réclamation.",
  },
];

export const COLLECTION_CTA =
  "inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-white bg-transparent px-8 text-base font-semibold text-white transition-colors hover:bg-white hover:text-black sm:w-auto";

export const COLLECTION_HEADING = cn(
  display.className,
  "text-4xl leading-none tracking-[0.02em] text-balance uppercase md:text-6xl",
);

export function GarmentChooser({
  models,
  context,
  occasions,
  headingClassName = COLLECTION_HEADING,
}: {
  models: GarmentModel[];
  context?: string;
  occasions: CollectionOccasion[];
  headingClassName?: string;
}) {
  const items = orderForPicker(models, occasions).map(({ model, occasion }) => ({
    id: model.id,
    name: model.name,
    href: modelHref(model, context),
    cover: wornCover(model),
    avgDays: model.avg_days,
    price: model.price,
    occasion,
  }));

  return (
    <section id="choisir" className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-14 md:px-8 md:pt-24">
      <h2 className={headingClassName}>Choisissez votre habit</h2>
      <p className="mt-3 max-w-xl text-lg">
        Nous le faisons coudre à vos mesures, par un tailleur que vous choisissez.
      </p>
      <GarmentPicker
        items={items}
        occasions={occasions.filter((o) => items.some((item) => item.occasion === o.id))}
      />
    </section>
  );
}

export function HowItWorks({
  headingClassName = COLLECTION_HEADING,
}: {
  headingClassName?: string;
}) {
  return (
    <section
      id="comment-ca-marche"
      className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-16 md:px-8 md:pt-28"
    >
      <div>
        <h2 className={headingClassName}>Comment ça marche</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          Sur mesure, cela veut dire que le tailleur coupe l&apos;habit pour votre corps, à vos
          mesures. Il n&apos;est pas pris dans un stock.
        </p>

        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 lg:gap-y-12">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-white/25 pt-4">
              <span className={cn(display.className, "text-4xl tracking-[0.02em] md:text-5xl")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl leading-snug font-medium tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-base">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-3 md:mt-16 md:grid-cols-2">
          {GUARANTEES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-white/15 p-5 md:p-8">
              <Icon className="size-7 shrink-0" strokeWidth={1.5} aria-hidden />
              <div className="min-w-0">
                <h3 className="text-xl leading-snug font-medium tracking-tight">{title}</h3>
                <p className="text-muted-foreground mt-1 text-base">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          <Link href="/conditions" className="hover:text-foreground underline underline-offset-4">
            Lire nos conditions
          </Link>
        </p>
      </div>
    </section>
  );
}

/** « Moussa Diop » devient « Moussa D. » : le nom complet d'un client ne s'expose pas. */
function shortName(fullName: string | null): string {
  const [first, last] = (fullName ?? "").trim().split(/\s+/);
  if (!first) return "Client JALOFA";
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

function ReviewCard({ review }: { review: TailorReview }) {
  const [photo] = review.photos;
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/15">
      {photo && (
        <div className="bg-muted relative aspect-4/3">
          <Image
            src={photo}
            alt={`Photo de ${shortName(review.author_name)}`}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <ReviewStars value={review.rating} />
        {review.comment && <p className="mt-3 text-base text-pretty">{review.comment}</p>}
        <p className="text-muted-foreground mt-auto pt-4 text-sm">
          {shortName(review.author_name)} ·{" "}
          {new Date(review.created_at).toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </li>
  );
}

export function CustomerReviews({
  data,
  headingClassName = COLLECTION_HEADING,
  className,
}: {
  data: LatestReviews;
  headingClassName?: string;
  className?: string;
}) {
  return (
    <section
      id="avis"
      className={cn(
        "mx-auto max-w-7xl scroll-mt-16 px-4 pt-16 md:px-8 md:pt-28",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
        <h2 className={headingClassName}>Avis clients</h2>
        {data.count > 0 && (
          <p className="flex items-center gap-2 text-base">
            <ReviewStars value={data.average} />
            {data.average.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5 ·{" "}
            {data.count} avis
          </p>
        )}
      </div>

      {data.reviews.length > 0 ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-white/15 p-6 md:p-10">
          <p className="text-2xl font-medium tracking-tight text-balance md:text-3xl">
            Pas encore d&apos;avis. Le vôtre peut être le premier.
          </p>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base md:text-lg">
            Seul un client qui a commandé peut donner un avis. Nous n&apos;affichons ici que de
            vrais avis.
          </p>
        </div>
      )}
    </section>
  );
}
