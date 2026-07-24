"use client";

import { useState } from "react";
import { BadgeCheck, ChevronRight, Repeat2, Scissors, Star } from "lucide-react";

import { ReviewStars } from "@/components/catalog/review-stars";
import { formatMeters } from "@/lib/fabric-metrage";
import type { FabricSocialProof } from "@/lib/fabric-social-proof";
import { cn } from "@/lib/utils";

/**
 * « Note & avis » d'une fiche tissu : la moyenne et la répartition à gauche,
 * l'avis courant à droite, au suivant par la flèche. La répartition n'est pas
 * décorative — c'est elle qui dit si un 4,5 vient de tout le monde ou de deux
 * extrêmes.
 */
export function FabricReviews({ proof }: { proof: FabricSocialProof }) {
  const [index, setIndex] = useState(0);
  const review = proof.reviews[index];
  const next = () => setIndex((i) => (i + 1) % proof.reviews.length);

  const maxCount = Math.max(...proof.distribution.map((d) => d.count), 1);

  return (
    <section id="avis" className="scroll-mt-24">
      <h2 className="font-serif text-2xl tracking-tight">Note &amp; avis</h2>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        {/* Moyenne + répartition */}
        <div>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <p className="flex items-end text-7xl font-semibold leading-none tracking-tighter">
                {proof.rating.toLocaleString("fr-FR")}
                <span className="text-muted-foreground pb-1 text-2xl font-normal">/5</span>
              </p>
              <p className="text-muted-foreground mt-3 text-xs">
                ({proof.reviewCount} avis vérifiés)
              </p>
            </div>

            <ul className="min-w-0 flex-1 space-y-2 pt-1">
              {proof.distribution.map((d) => (
                <li key={d.stars} className="flex items-center gap-2">
                  <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                  <span className="text-muted-foreground w-2 shrink-0 text-[11px] tabular-nums">
                    {d.stars}
                  </span>
                  <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-foreground block h-full rounded-full"
                      style={{ width: `${(d.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px] tabular-nums">
                    {d.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3 border-t pt-5 text-sm">
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Scissors className="size-3.5" /> Déjà vendu
              </dt>
              <dd className="mt-0.5 font-semibold">{formatMeters(proof.soldMeters)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Repeat2 className="size-3.5" /> Le rachètent
              </dt>
              <dd className="mt-0.5 font-semibold">{proof.repeatRate} %</dd>
            </div>
          </dl>
        </div>

        {/* L'avis courant + flèche « suivant » sur le bord droit */}
        <div className="relative lg:pr-8">
          <article className="bg-card rounded-2xl border p-5 sm:p-6">
            <header className="flex items-center gap-3">
              <span className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {review.author
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium sm:text-base">
                  <span className="truncate">{review.author}</span>
                  <BadgeCheck className="text-muted-foreground size-4 shrink-0" />
                </p>
                <p className="text-muted-foreground mt-1 truncate text-[10px] font-semibold tracking-[0.16em] uppercase">
                  {review.city} · {review.date}
                </p>
              </div>
            </header>

            <ReviewStars value={review.rating} className="mt-4" />
            {/* Même traitement que les avis vêtement : citation en serif,
                guillemets tenus par une espace fine insécable. */}
            <blockquote className="mt-3 font-serif text-[1.0625rem] leading-[1.6] text-pretty sm:text-lg">
              «&#8239;{review.body}&#8239;»
            </blockquote>
            <p className="text-muted-foreground mt-4 text-xs">{review.garment}</p>
          </article>

          <button
            type="button"
            onClick={next}
            aria-label="Avis suivant"
            className="bg-background hover:bg-muted absolute right-0 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors lg:flex"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Sur petit écran, la flèche passe sous la carte avec les pastilles */}
          <div className="mt-4 flex items-center gap-3 lg:mt-3 lg:justify-end lg:pr-2">
            <span className="flex gap-1.5">
              {proof.reviews.map((r, i) => (
                <span
                  key={r.id}
                  className={cn(
                    "size-1.5 rounded-full",
                    i === index ? "bg-foreground" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {index + 1} / {proof.reviews.length}
            </span>
            <button
              type="button"
              onClick={next}
              aria-label="Avis suivant"
              className="hover:bg-muted ml-auto flex size-11 items-center justify-center rounded-full border transition-colors lg:hidden"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
