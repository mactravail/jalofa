"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import type { FilmUse } from "@/components/catalog/remotion/fabric-film";
import { canPlayFilm } from "@/lib/motion-capability";
import { cn } from "@/lib/utils";

// Le moteur Remotion est lourd : il n'entre jamais dans le bundle de la fiche,
// il est cherché à la demande, et seulement quand l'appareil peut le porter.
const FabricFilmPlayer = dynamic(
  () => import("@/components/catalog/remotion/fabric-film-player"),
  { ssr: false },
);

type View = "piece" | "trame" | "rouleaux" | "film";

const LABELS: Record<View, string> = {
  piece: "La pièce",
  trame: "Trame de près",
  rouleaux: "En boutique",
  film: "En mouvement",
};

/**
 * La galerie d'une fiche tissu. Un tissu n'a qu'une photo au catalogue, et une
 * texture plein cadre ne donne rien à regarder : on la présente donc comme un
 * produit — la pièce posée sur fond neutre, la trame au plus près, les rouleaux
 * tels qu'ils sont sur l'étal, puis le film des tenues qu'elle sert.
 */
export function FabricShowcase({
  image,
  fabricName,
  colorLabel,
  uses,
}: {
  image: string | null;
  fabricName: string;
  colorLabel: string | null;
  uses: FilmUse[];
}) {
  const [view, setView] = useState<View>("piece");
  const [filmReady, setFilmReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Deux décisions qui ne se prennent qu'au client : l'appareil peut-il porter
  // un film (sinon la vue n'est pas proposée), et la galerie est-elle à l'écran ?
  // Le film n'est monté que dans ce cas et démonté dès qu'elle le quitte : la
  // boucle de rendu s'arrête et on rend la main au thread principal.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const capable = canPlayFilm() && uses.length > 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        setFilmReady(capable);
        setVisible(entry.isIntersecting);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [uses.length]);

  const views: View[] = filmReady
    ? ["piece", "trame", "rouleaux", "film"]
    : ["piece", "trame", "rouleaux"];

  const step = (dir: 1 | -1) => {
    const i = views.indexOf(view);
    setView(views[(i + dir + views.length) % views.length]);
  };

  const alt = `Tissu ${fabricName}${colorLabel ? `, coloris ${colorLabel}` : ""}`;

  return (
    <div>
      <div
        ref={frameRef}
        className="bg-muted/50 relative aspect-square overflow-hidden rounded-2xl border"
      >
        {image && (
          <>
            {/* La pièce, posée sur fond neutre — le cadrage produit */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-500 sm:p-12",
                view === "piece" ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <div className="relative h-full w-full overflow-hidden rounded-xl shadow-xl">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  preload
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* La trame, au plus près : c'est le tissage qu'on achète */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                view === "trame" ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <Image
                src={image}
                alt={`Gros plan sur le tissage — ${fabricName}`}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="scale-[2.6] object-cover"
              />
            </div>

            {/* Les rouleaux sur l'étal — trois coupes de la même pièce */}
            <div
              className={cn(
                "absolute inset-0 flex items-end justify-center gap-4 p-10 transition-opacity duration-500 sm:gap-5",
                view === "rouleaux" ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="relative w-[24%] overflow-hidden rounded-lg shadow-2xl"
                  style={{
                    height: i === 1 ? "84%" : "70%",
                    rotate: `${(i - 1) * 2.5}deg`,
                  }}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="15vw"
                    className="object-cover"
                    style={{ objectPosition: `${20 + i * 30}% 50%` }}
                  />
                  {/* Ombrage cylindrique : le plat devient un rouleau */}
                  <span className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/30" />
                </div>
              ))}
            </div>

            {view === "film" && visible && (
              <div className="absolute inset-0">
                <FabricFilmPlayer image={image} fabricName={fabricName} uses={uses} />
              </div>
            )}
          </>
        )}

        {/* Étiquette de la vue courante */}
        <span className="bg-background/85 absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur">
          {LABELS[view]}
          {colorLabel && view === "piece" && (
            <span className="text-muted-foreground"> · {colorLabel}</span>
          )}
        </span>

        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Vue précédente"
          className="text-foreground/70 hover:bg-background/80 hover:text-foreground absolute left-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Vue suivante"
          className="text-foreground/70 hover:bg-background/80 hover:text-foreground absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>

      {/* Vignettes */}
      <div className="mt-3 grid grid-cols-4 gap-3">
        {views.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            aria-label={LABELS[v]}
            title={LABELS[v]}
            className={cn(
              "bg-muted/50 relative aspect-square overflow-hidden rounded-xl border transition-colors",
              view === v ? "border-primary ring-primary/30 ring-2" : "hover:border-border",
            )}
          >
            {image && v === "rouleaux" ? (
              <span className="absolute inset-0 flex items-end justify-center gap-1 p-2.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="relative w-[26%] overflow-hidden rounded shadow"
                    style={{ height: i === 1 ? "88%" : "72%" }}
                  >
                    <Image src={image} alt="" fill sizes="60px" className="object-cover" />
                  </span>
                ))}
              </span>
            ) : (
              image && (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="120px"
                  className={cn(
                    "object-cover",
                    v === "piece" && "scale-90 rounded-lg",
                    v === "trame" && "scale-[2.6]",
                    v === "film" && "opacity-40",
                  )}
                />
              )
            )}
            {v === "film" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background/90 flex size-9 items-center justify-center rounded-full">
                  <Play className="size-4" />
                </span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
