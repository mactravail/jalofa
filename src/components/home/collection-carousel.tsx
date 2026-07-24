"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Carrousel « à la Hockerty » réutilisable : un rail horizontal de pièces
// phares, chacune sur un grand portrait avec son nom en dessous, navigation par
// flèches. Sert de socle commun aux collections Homme et Femme de la home.
// Chaque tuile mène à SA destination (page dédiée ou fiche modèle). Le rail
// défile → composant client.

export type CollectionTile = {
  name: string;
  caption: string;
  src: string;
  href: string;
  alt: string;
};

function TileCard({ tile }: { tile: CollectionTile }) {
  return (
    <Link
      href={tile.href}
      data-card
      className="group w-[15rem] shrink-0 snap-start"
    >
      <div className="bg-muted relative aspect-3/4 overflow-hidden rounded-2xl border">
        <Image
          src={tile.src}
          alt={tile.alt}
          fill
          sizes="240px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="bg-background/85 text-foreground absolute top-3 right-3 flex size-8 items-center justify-center rounded-full opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="mt-2.5">
        <h4 className="font-serif text-base font-medium tracking-tight group-hover:underline">
          {tile.name}
        </h4>
        <span className="text-muted-foreground text-xs">{tile.caption}</span>
      </div>
    </Link>
  );
}

export function CollectionCarousel({
  title,
  subtitle,
  tiles,
  viewAllHref = "/modeles",
  shortTitle,
}: {
  title: string;
  subtitle: string;
  tiles: CollectionTile[];
  viewAllHref?: string;
  /** Libellé court affiché sur mobile à la place de « Voir la collection »
   *  (le titre et le sous-titre y sont masqués). Par défaut : « Collection
   *  Femme » → « Femme ». */
  shortTitle?: string;
}) {
  const mobileLabel = shortTitle ?? title.replace(/^Collection\s+/i, "");
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        {/* Sur mobile, l'en-tête se réduit au seul lien (« Femme » / « Homme ») */}
        <div className="max-md:hidden">
          <h3 className="font-serif text-xl font-medium tracking-tight">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          <span className="md:hidden">{mobileLabel}</span>
          <span className="max-md:hidden">Voir la collection</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="relative">
        {/* Rail défilant — bord à bord sur mobile, contenu dans la grille au-delà */}
        <div
          ref={railRef}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4.5 scroll-smooth px-4.5 pb-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {tiles.map((tile) => (
            <TileCard key={tile.name} tile={tile} />
          ))}
        </div>

        {/* Flèches (pointeur uniquement) — le tactile utilise le défilement natif */}
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          disabled={!canPrev}
          aria-label="Voir les modèles précédents"
          className={cn(
            "bg-background/90 text-foreground absolute top-[42%] left-1 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur transition md:flex",
            canPrev ? "hover:bg-background cursor-pointer opacity-100" : "cursor-default opacity-0",
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          disabled={!canNext}
          aria-label="Voir les modèles suivants"
          className={cn(
            "bg-background/90 text-foreground absolute top-[42%] right-1 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur transition md:flex",
            canNext ? "hover:bg-background cursor-pointer opacity-100" : "cursor-default opacity-0",
          )}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
