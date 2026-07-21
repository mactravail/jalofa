"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Scissors } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Galerie d'un vêtement : le vêtement seul, puis porté (devant, dos), puis les
 * détails — on fait défiler de gauche à droite. La piste native garde le swipe
 * au doigt ; les flèches et les miniatures ne font que la piloter.
 */
export function GarmentGallery({
  photos,
  alt,
  emptyLabel,
  fit = "contain",
  sizes = "100vw",
  thumbnails = true,
  priority = false,
  className,
  stageClassName,
}: {
  photos: string[];
  alt: string;
  emptyLabel?: string;
  fit?: "contain" | "cover";
  sizes?: string;
  thumbnails?: boolean;
  priority?: boolean;
  className?: string;
  stageClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }, []);

  // L'index suit la piste au lieu de la commander : swipe, flèches et
  // miniatures restent ainsi d'accord, quelle que soit l'origine du geste.
  const syncIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const current = Math.round(track.scrollLeft / track.clientWidth);
    indexRef.current = current;
    setIndex(current);
  }, []);

  // Un resize (rotation, ouverture du panneau) laisse la vue entre deux photos :
  // on la recale sur la photo active. Seul un vrai changement de largeur compte —
  // réagir aussi à l'observation initiale couperait le défilement en cours.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let width = track.clientWidth;
    const observer = new ResizeObserver(() => {
      if (track.clientWidth === width) return;
      width = track.clientWidth;
      track.scrollLeft = indexRef.current * width;
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  if (!photos.length) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex flex-col items-center justify-center gap-3",
          className,
        )}
      >
        <Scissors className="size-10 opacity-40" />
        <p className="text-sm">{emptyLabel ?? alt}</p>
      </div>
    );
  }

  const step = (dir: 1 | -1) =>
    goTo(Math.min(photos.length - 1, Math.max(0, index + dir)));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className={cn("relative min-h-0 flex-1", stageClassName)}>
        <div
          ref={trackRef}
          onScroll={syncIndex}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
          tabIndex={0}
          role="group"
          aria-roledescription="carrousel"
          aria-label={`Photos — ${alt}`}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, i) => (
            <div key={photo} className="relative h-full w-full shrink-0 snap-center">
              <Image
                src={photo}
                alt={`${alt} — vue ${i + 1} sur ${photos.length}`}
                fill
                sizes={sizes}
                preload={priority && i === 0}
                className={cn(
                  fit === "cover" ? "object-cover" : "object-contain",
                  fit === "contain" && "drop-shadow-xl",
                )}
              />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            <Arrow side="left" onClick={() => step(-1)} disabled={index === 0} />
            <Arrow
              side="right"
              onClick={() => step(1)}
              disabled={index === photos.length - 1}
            />
          </>
        )}
      </div>

      {thumbnails && photos.length > 1 && (
        <div className="flex shrink-0 justify-center gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Voir la vue ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "bg-background relative size-12 shrink-0 overflow-hidden rounded-lg border transition-colors",
                i === index ? "border-primary ring-primary/30 ring-2" : "hover:border-foreground/30",
              )}
            >
              <Image src={photo} alt="" fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({
  side,
  onClick,
  disabled,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Photo précédente" : "Photo suivante"}
      className={cn(
        "bg-background/90 hover:bg-background absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
