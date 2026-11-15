"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Une bande horizontale qu'on fait défiler au doigt ou avec les flèches gauche /
 * droite. Les éléments (`<li>`) sont rendus par l'appelant, côté serveur.
 */
export function ScrollRail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const t = useT();

  function measure(track: HTMLElement) {
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => measure(track));
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  function turn(direction: 1 | -1) {
    const track = trackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        onScroll={(e) => measure(e.currentTarget)}
        className={cn(
          "flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        {children}
      </ul>
      {!edges.start && (
        <Arrow side="left" label={t("Précédent")} onClick={() => turn(-1)} />
      )}
      {!edges.end && <Arrow side="right" label={t("Suivant")} onClick={() => turn(1)} />}
    </div>
  );
}

function Arrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "bg-background/90 hover:bg-muted absolute top-[30%] flex size-10 items-center justify-center rounded-full border shadow-md backdrop-blur",
        side === "left" ? "left-1" : "right-1",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
