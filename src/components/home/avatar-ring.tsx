"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Link from "@/components/i18n/link";
import { cn } from "@/lib/utils";

export type AvatarRingItem = {
  src: string;
  name: string;
  href: string;
  alt: string;
};

/**
 * Carrousel « en cercle » : les silhouettes détourées sont posées sur un anneau
 * qui tourne sur lui-même. Celle du milieu est nette et en grand ; plus on
 * s'éloigne, plus elles rapetissent, se floutent et s'effacent — comme si elles
 * passaient derrière le cercle. Rien ne défile tout seul : flèches, glisser du
 * doigt, clavier, ou clic sur une silhouette de côté pour l'amener au centre.
 */
export function AvatarRing({
  items,
  prevLabel,
  nextLabel,
}: {
  items: AvatarRingItem[];
  prevLabel: string;
  nextLabel: string;
}) {
  const n = items.length;
  // Position continue de l'anneau (pas de modulo) : la rotation reste fluide
  // quand on passe du dernier au premier.
  const [pos, setPos] = useState(Math.floor(n / 2));
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const active = ((pos % n) + n) % n;
  const go = useCallback((delta: number) => setPos((p) => p + delta), []);

  if (n === 0) return null;
  const current = items[active];

  return (
    <div
      className="relative select-none"
      role="region"
      aria-roledescription="carrousel"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div
        className="relative h-[68svh] min-h-[26rem] w-full touch-pan-y overflow-hidden md:h-[80svh] md:min-h-[34rem]"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 50) {
            go(dx < 0 ? 1 : -1);
            drag.current = { x: e.clientX, moved: true };
          }
        }}
        onPointerUp={() => {
          // Laisse le clic voir `moved` avant de remettre à zéro.
          setTimeout(() => (drag.current = null), 0);
        }}
        onPointerCancel={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        {/* Halo doux derrière la figure du milieu. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-3/4 w-[min(36rem,80vw)] rounded-full bg-white/[0.06] blur-3xl" />

        {items.map((item, i) => {
          // Décalage le plus court sur l'anneau, entre -n/2 et n/2.
          let offset = (((i - pos) % n) + n) % n;
          if (offset > n / 2) offset -= n;
          const angle = (offset / n) * 2 * Math.PI;
          const depth = Math.cos(angle); // 1 au centre, -1 derrière
          const dist = Math.abs(offset);
          const isCenter = offset === 0;
          const scale = 0.45 + 0.55 * ((depth + 1) / 2);
          // Les voisines restent bien visibles (~80 %), puis s'effacent plus loin.
          const opacity = isCenter ? 1 : dist <= 1 ? 0.8 : dist <= 2 ? 0.5 : 0;
          const blur = isCenter ? 0 : dist <= 1 ? 0.5 : 1.5;

          return (
            <button
              key={item.src}
              type="button"
              tabIndex={-1}
              aria-hidden={!isCenter}
              onClick={() => {
                if (drag.current?.moved) return;
                if (!isCenter) go(offset);
              }}
              className={cn(
                "absolute bottom-0 left-1/2 h-full w-[min(26rem,70vw)] origin-bottom transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                isCenter ? "pointer-events-none" : "cursor-pointer",
              )}
              style={{
                transform: `translateX(calc(-50% + ${Math.sin(angle) * 105}%)) scale(${scale})`,
                opacity,
                filter: blur ? `blur(${blur}px)` : undefined,
                zIndex: Math.round((depth + 1) * 50),
              }}
            >
              <Image
                src={item.src}
                alt={isCenter ? item.alt : ""}
                fill
                draggable={false}
                sizes="(min-width: 768px) 26rem, 70vw"
                className="object-contain object-bottom"
              />
            </button>
          );
        })}

        {/* Fondu vers le noir sur les bords : les côtés « disparaissent ». */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[200] w-[8%] bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[200] w-[8%] bg-gradient-to-l from-black to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[200] h-16 bg-gradient-to-t from-black to-transparent" />

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={prevLabel}
          className="absolute top-1/2 left-3 z-[210] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition-colors hover:bg-white/15 md:left-8"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={nextLabel}
          className="absolute top-1/2 right-3 z-[210] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition-colors hover:bg-white/15 md:right-8"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Nom de la pièce au centre + lien vers sa page. */}
      <div className="mt-4 flex flex-col items-center px-4 text-center" aria-live="polite">
        {/* Seulement le nom, dans le style discret du sur-titre ; il mène à la fiche. */}
        <Link
          href={current.href}
          className="text-muted-foreground text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-70"
        >
          <h3>{current.name}</h3>
        </Link>
        <div className="mt-6 flex gap-2">
          {items.map((item, i) => (
            <span
              key={item.src}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/30",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
