"use client";

import Image from "next/image";
import { useEffect, useReducer } from "react";
import { ChevronRight, Heart } from "lucide-react";

import { StyleIcon, type StyleIconName } from "@/components/order/style-icons";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Hero visual : un smartphone qui « joue » tout seul une simulation de
// personnalisation. Un petit moteur fait défiler quelques tenues (capo, tissu,
// col, prix) toutes les ~2,6 s pour donner l'impression que le configurateur
// JALOFA est manipulé en direct depuis le téléphone. Client component pour
// l'animation ; respecte `prefers-reduced-motion` (fige sur la 1re tenue).

const FABRIC_SWATCHES = ["/fabrics/8.jpg", "/fabrics/2.jpg", "/fabrics/11.jpg", "/fabrics/5.jpg"];
const COLLARS: StyleIconName[] = ["col-rond", "col-mao", "col-v"];

type Look = {
  garment: string;
  image: string;
  price: number;
  detail: string;
  fabric: number; // index dans FABRIC_SWATCHES
  collar: number; // index dans COLLARS
};

const LOOKS: Look[] = [
  {
    garment: "Grand boubou",
    image: "/models/grand-boubou.jpg",
    price: 45000,
    detail: "Col Mao brodé",
    fabric: 0,
    collar: 1,
  },
  {
    garment: "Kaftan",
    image: "/models/kaftan.jpg",
    price: 38000,
    detail: "Col rond · fil or",
    fabric: 2,
    collar: 0,
  },
  {
    garment: "Robe cérémonie",
    image: "/models/robe.jpg",
    price: 52000,
    detail: "Col V · broderie",
    fabric: 3,
    collar: 2,
  },
];

export function HeroPhone() {
  const [step, next] = useReducer((i: number) => (i + 1) % LOOKS.length, 0);
  const look = LOOKS[step];

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const id = setInterval(next, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[19rem]">
      {/* Halo */}
      <div className="bg-primary/15 absolute -inset-6 -z-10 rounded-[3rem] blur-3xl" />

      {/* Châssis du téléphone */}
      <div className="rounded-[2.75rem] border border-black/10 bg-neutral-900 p-2.5 shadow-2xl dark:bg-neutral-950">
        <div className="bg-card relative flex aspect-[9/19] flex-col overflow-hidden rounded-[2.1rem]">
          {/* Dynamic island */}
          <div className="pointer-events-none absolute top-2.5 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-black" />

          {/* En-tête appli */}
          <div className="flex items-center justify-between px-4 pt-8 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-md text-[10px] font-bold">
                J
              </span>
              <span className="text-[11px] font-semibold tracking-tight">JALOFA</span>
            </div>
            <nav className="flex items-center gap-1 text-[8px] font-medium tracking-wide uppercase">
              <span className="text-muted-foreground">Tissu</span>
              <ChevronRight className="text-muted-foreground/40 size-2.5" />
              <span className="text-primary border-primary border-b-2 pb-0.5">Style</span>
            </nav>
          </div>

          {/* Aperçu en direct */}
          <div className="from-muted/60 to-background relative flex-1 bg-gradient-to-b">
            {LOOKS.map((l, i) => (
              <Image
                key={l.image}
                src={l.image}
                alt={l.garment}
                fill
                sizes="300px"
                className={cn(
                  "object-cover transition-opacity duration-700",
                  i === step ? "opacity-100" : "opacity-0",
                )}
                preload={i === 0}
              />
            ))}

            {/* Chips tenue sélectionnée */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              <span
                key={`${look.garment}-name`}
                className="bg-background/85 animate-in fade-in slide-in-from-left-2 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur duration-500"
              >
                {look.garment}
              </span>
              <span
                key={`${look.detail}-detail`}
                className="bg-background/85 animate-in fade-in slide-in-from-left-2 rounded-full px-2.5 py-1 text-[10px] font-medium shadow-sm backdrop-blur duration-700"
              >
                {look.detail}
              </span>
            </div>

            {/* Cols (rail flottant) */}
            <div className="bg-card/90 absolute top-3 right-3 flex flex-col gap-1.5 rounded-xl border p-1.5 shadow-sm backdrop-blur">
              {COLLARS.map((name, i) => (
                <div
                  key={name}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border transition-colors",
                    i === look.collar
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground/70 border-transparent",
                  )}
                >
                  <StyleIcon name={name} className="h-5 w-6" />
                </div>
              ))}
            </div>
          </div>

          {/* Panneau options */}
          <div className="space-y-2.5 border-t px-3 pt-2.5 pb-3">
            {/* Tissus */}
            <div>
              <p className="text-muted-foreground mb-1 text-[9px] font-semibold tracking-wide uppercase">
                Tissu
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {FABRIC_SWATCHES.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className={cn(
                      "aspect-square w-full rounded-md object-cover transition-all duration-300",
                      i === look.fabric
                        ? "ring-primary ring-offset-card scale-105 ring-2 ring-offset-1"
                        : "opacity-80",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Prix + CTA */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-[9px] font-medium tracking-wide uppercase">
                  Sur mesure
                </p>
                <p key={look.price} className="text-primary animate-in fade-in text-base font-bold duration-500">
                  {formatPrice(look.price)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground rounded-lg border p-2">
                  <Heart className="size-3.5" />
                </span>
                <span className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs font-semibold">
                  Suivant
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
