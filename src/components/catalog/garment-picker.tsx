"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

import { Price } from "@/components/cart/price";
import { cn } from "@/lib/utils";

export type PickerItem = {
  id: string;
  name: string;
  href: string;
  cover: string | null;
  avgDays: number | null;
  price: number | null;
  occasion: string | null;
};

const ALL = "tout";

/** L'unique section où l'on choisit l'habit à faire coudre : l'occasion filtre la grille. */
export function GarmentPicker({
  items,
  occasions,
}: {
  items: PickerItem[];
  occasions: { id: string; title: string; intro: string }[];
}) {
  const [active, setActive] = useState(ALL);
  const visible = active === ALL ? items : items.filter((item) => item.occasion === active);
  const intro = occasions.find((o) => o.id === active)?.intro;
  const filters = [{ id: ALL, title: "Tout" }, ...occasions];

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2 md:mt-8">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active === filter.id}
            onClick={() => setActive(filter.id)}
            className={cn(
              "h-11 rounded-lg border px-4 text-sm font-medium transition-colors md:px-6 md:text-base",
              active === filter.id
                ? "border-white bg-white text-black"
                : "hover:border-foreground border-white/25",
            )}
          >
            {filter.title}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="text-muted-foreground mt-4 min-h-6 text-base">
        {intro ?? "Choisissez une occasion, ou regardez tout."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-3 md:gap-x-3 lg:grid-cols-4 lg:gap-y-10">
        {visible.map((item) => (
          <Link key={item.id} href={item.href} className="group flex min-w-0 flex-col">
            <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-xl">
              {item.cover && (
                <Image
                  src={item.cover}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <h3 className="mt-3 text-base font-medium tracking-tight md:text-lg">{item.name}</h3>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              {item.avgDays != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden />
                  Environ {item.avgDays} jours
                </span>
              )}
              {item.price != null && (
                <span className="text-foreground font-medium">
                  Dès <Price amount={item.price} />
                </span>
              )}
            </p>
            <span className="mt-3 flex h-11 items-center justify-center rounded-lg border border-white/25 text-sm font-medium transition-colors group-hover:border-white group-hover:bg-white group-hover:text-black">
              Faire coudre
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
