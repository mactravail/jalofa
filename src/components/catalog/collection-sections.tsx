import Image from "next/image";
import Link from "@/components/i18n/link";
import { ShieldCheck, Smartphone, Undo2 } from "lucide-react";

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
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/config";

// Les sections communes aux collections Homme et Femme : le choix de l'habit,
// l'explication du parcours, les avis. Chaque page garde son propre ton grâce à
// `headingClassName`. Tout ce qui est promis ici doit rester vrai : voir les
// articles A6 et A9 de /conditions, et les moyens ouverts à la caisse
// (`VISIBLE_PAYMENT_METHODS`). Les avis sont ceux de la table `reviews`, jamais
// des exemples.

// Une étape = un verbe + une phrase. Le client doit se voir faire chaque geste.
const STEPS = [
  {
    title: "Choisissez l'habit",
    text: "Celui qui vous plaît, sur cette page.",
  },
  {
    title: "Choisissez le tissu et le tailleur",
    text: "Vous voyez leurs prix et leurs délais. Vous décidez.",
  },
  {
    title: "Donnez vos mesures",
    text: "Vos mesures, ou simplement S, M, L, XL. Le tailleur ajuste.",
  },
  {
    title: "Payez sans risque",
    text: "Par Wave ou par carte. JALOFA garde l'argent jusqu'à la livraison.",
  },
  {
    title: "Le tailleur coud",
    text: "Vous suivez chaque étape sur votre téléphone.",
  },
  {
    title: "Recevez, vérifiez",
    text: "Un souci ? Vous avez 3 jours pour le signaler.",
  },
];

// La peur qui bloque l'achat d'un habit qu'on n'a pas encore vu : « et si je perds
// mon argent ? ». On y répond là où l'on choisit, pas seulement en bas de page.
const REASSURANCE = [
  { icon: ShieldCheck, text: "Tailleur payé après la livraison" },
  { icon: Undo2, text: "Remboursé s'il ne tient pas parole" },
  { icon: Smartphone, text: "Suivi sur votre téléphone" },
];

// Les quatre questions qu'un client se pose avant de payer un habit sur mesure.
// Chaque réponse est vraie : A6 et A9 de /conditions, la caisse, les retouches.
const QUESTIONS = [
  {
    q: "Je ne connais pas mes mesures.",
    a: "Choisissez S, M, L ou XL. Le tailleur ajuste pour vous.",
  },
  {
    q: "Et si l'habit ne me va pas ?",
    a: "Le tailleur le retouche. S'il n'a pas suivi vos mesures, vous êtes remboursé.",
  },
  {
    q: "Et si le tailleur est en retard ?",
    a: "Plus d'une semaine de retard : vous annulez, et vous êtes remboursé.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Chaque tailleur donne son prix. Vous comparez, puis vous choisissez.",
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

export async function GarmentChooser({
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
  const t = await getT();
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
      <h2 className={headingClassName}>{t("Choisissez votre habit")}</h2>
      <p className="mt-3 max-w-xl text-lg">
        {t("Coupé à vos mesures. Cousu par le tailleur que vous choisissez.")}
      </p>
      <ul className="mt-5 flex flex-col gap-2 text-base sm:flex-row sm:flex-wrap sm:gap-x-8">
        {REASSURANCE.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <Icon className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
            {t(text)}
          </li>
        ))}
      </ul>
      <GarmentPicker
        items={items}
        occasions={occasions.filter((o) => items.some((item) => item.occasion === o.id))}
      />
    </section>
  );
}

export async function HowItWorks({
  headingClassName = COLLECTION_HEADING,
}: {
  headingClassName?: string;
}) {
  const t = await getT();
  return (
    <section
      id="comment-ca-marche"
      className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-16 md:px-8 md:pt-28"
    >
      <div>
        <h2 className={headingClassName}>{t("Comment ça marche")}</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          {t("Sur mesure, cela veut dire que le tailleur coupe l'habit pour votre corps, à vos mesures. Il n'est pas pris dans un stock.")}
        </p>

        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 lg:gap-y-12">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-white/25 pt-4">
              <span className={cn(display.className, "text-4xl tracking-[0.02em] md:text-5xl")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl leading-snug font-medium tracking-tight">{t(step.title)}</h3>
              <p className="text-muted-foreground mt-1 text-base">{t(step.text)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-3 md:mt-16 md:grid-cols-2">
          {GUARANTEES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-white/15 p-5 md:p-8">
              <Icon className="size-7 shrink-0" strokeWidth={1.5} aria-hidden />
              <div className="min-w-0">
                <h3 className="text-xl leading-snug font-medium tracking-tight">{t(title)}</h3>
                <p className="text-muted-foreground mt-1 text-base">{t(text)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          <Link href="/conditions" className="hover:text-foreground underline underline-offset-4">
            {t("Lire nos conditions")}
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Les objections, dites avec les mots du client, et leur réponse en une phrase. */
export async function CommonQuestions({
  headingClassName = COLLECTION_HEADING,
}: {
  headingClassName?: string;
}) {
  const t = await getT();
  return (
    <section id="questions" className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-16 md:px-8 md:pt-28">
      <h2 className={headingClassName}>{t("Vos questions")}</h2>
      <dl className="mt-8 grid gap-3 md:mt-12 md:grid-cols-2">
        {QUESTIONS.map(({ q, a }) => (
          <div key={q} className="rounded-xl border border-white/15 p-5 md:p-8">
            <dt className="text-xl leading-snug font-medium tracking-tight">{t(q)}</dt>
            <dd className="text-muted-foreground mt-2 text-base md:text-lg">{t(a)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** « Moussa Diop » devient « Moussa D. » : le nom complet d'un client ne s'expose pas. */
function shortName(fullName: string | null): string {
  const [first, last] = (fullName ?? "").trim().split(/\s+/);
  if (!first) return "Client JALOFA";
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

async function ReviewCard({ review }: { review: TailorReview }) {
  const [photo] = review.photos;
  const t = await getT();
  const locale = intlLocale(await getLocale());
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/15">
      {photo && (
        <div className="bg-muted relative aspect-4/3">
          <Image
            src={photo}
            alt={t("Photo de {name}", { name: shortName(review.author_name) })}
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
          {new Date(review.created_at).toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </li>
  );
}

export async function CustomerReviews({
  data,
  headingClassName = COLLECTION_HEADING,
  className,
}: {
  data: LatestReviews;
  headingClassName?: string;
  className?: string;
}) {
  const t = await getT();
  const locale = intlLocale(await getLocale());
  return (
    <section
      id="avis"
      className={cn(
        "mx-auto max-w-7xl scroll-mt-16 px-4 pt-16 md:px-8 md:pt-28",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
        <h2 className={headingClassName}>{t("Avis clients")}</h2>
        {data.count > 0 && (
          <p className="flex items-center gap-2 text-base">
            <ReviewStars value={data.average} />
            {t("{avg} sur 5", { avg: data.average.toLocaleString(locale, { maximumFractionDigits: 1 }) })} ·{" "}
            {t("{n} avis", { n: data.count })}
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
            {t("Pas encore d'avis. Le vôtre peut être le premier.")}
          </p>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base md:text-lg">
            {t("Seul un client qui a commandé peut donner un avis. Nous n'affichons ici que de vrais avis.")}
          </p>
        </div>
      )}
    </section>
  );
}
