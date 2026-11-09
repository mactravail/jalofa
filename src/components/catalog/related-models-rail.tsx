"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { Price } from "@/components/cart/price";

export type RelatedGarment = {
  id: string;
  name: string;
  href: string;
  cover: string | null;
  avgDays: number;
  price: number | null;
  reviewCount: number;
  rating: number;
};

/** Les habits proches du modèle choisi : on glisse au doigt, ou avec les flèches. */
export function RelatedModelsRail({ items }: { items: RelatedGarment[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState({ current: 1, total: 1 });

  function measure(track: HTMLElement) {
    const width = track.clientWidth || 1;
    const total = Math.max(1, Math.ceil((track.scrollWidth - 8) / width));
    const atEnd = track.scrollLeft + width >= track.scrollWidth - 8;
    const current = atEnd ? total : Math.min(total, Math.round(track.scrollLeft / width) + 1);
    setPage({ current, total });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Le premier appel arrive dès l'observation : la page se mesure seule.
    const observer = new ResizeObserver(() => measure(track));
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  function turn(direction: 1 | -1) {
    const track = trackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-models" className="mt-16 border-t pt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 id="related-models" className="min-w-0 font-serif text-2xl tracking-tight">
          Vous aimerez aussi
        </h2>
        {page.total > 1 && (
          <p className="text-muted-foreground hidden shrink-0 text-sm sm:block">
            Page {page.current} sur {page.total}
          </p>
        )}
      </div>

      <div className="relative mt-6">
        <ul
          ref={trackRef}
          onScroll={(e) => measure(e.currentTarget)}
          className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <li key={item.id} className="w-[44vw] max-w-56 shrink-0 snap-start sm:w-52">
              <Link href={item.href} className="group block">
                <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-xl">
                  {item.cover && (
                    <Image
                      src={item.cover}
                      alt={item.name}
                      fill
                      sizes="(min-width: 640px) 208px, 44vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <h3 className="mt-2.5 truncate text-[13px] leading-snug font-medium group-hover:underline">
                  {item.name}
                </h3>
                {item.price != null && (
                  <p className="mt-0.5 text-[13px] font-semibold">
                    <span className="text-muted-foreground text-[11px] font-normal">Dès </span>
                    <Price amount={item.price} />
                  </p>
                )}
                <p className="text-muted-foreground mt-1 flex items-center gap-1 truncate text-[11px]">
                  {item.reviewCount > 0 && (
                    <>
                      <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                      {item.rating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
                    </>
                  )}
                  <span>{`${item.reviewCount} avis · ~${item.avgDays} jours`}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {page.total > 1 && (
          <>
            <RailArrow side="left" disabled={page.current === 1} onClick={() => turn(-1)} />
            <RailArrow
              side="right"
              disabled={page.current === page.total}
              onClick={() => turn(1)}
            />
          </>
        )}
      </div>
    </section>
  );
}

function RailArrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Modèles précédents" : "Modèles suivants"}
      className={`bg-background hover:bg-muted absolute top-[28%] hidden size-11 items-center justify-center rounded-lg border transition-opacity disabled:opacity-0 sm:flex ${
        side === "left" ? "left-1" : "right-1"
      }`}
    >
      <Icon className="size-5" />
    </button>
  );
}
