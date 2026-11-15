"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import Link from "@/components/i18n/link";
import { cn } from "@/lib/utils";

export type WardrobeItem = {
  src: string;
  name: string;
  href: string;
  alt: string;
};

/**
 * Armoire : les habits pendent de profil sur une tringle, serrés comme dans un
 * placard. Au survol (ou au toucher sur téléphone), le cintre pivote et l'habit
 * se montre de face, en prenant sa place sur la tringle. Le profil est obtenu en
 * tournant la photo de face (`rotateY`) : une seule image par habit suffit.
 *
 * Sur téléphone, il n'y a pas de survol : un premier toucher ouvre l'habit, un
 * second ouvre sa fiche.
 */
export function WardrobeRail({ items }: { items: WardrobeItem[] }) {
  const resting = Math.floor(items.length / 2);
  const [active, setActive] = useState(resting);
  const scroller = useRef<HTMLDivElement>(null);
  // Après un toucher, l'habit choisi est recentré une fois sa largeur atteinte.
  const recenter = useRef(false);

  /** Sur téléphone la tringle déborde : on la fait défiler pour centrer `i`. */
  const center = useCallback((i: number, behavior: ScrollBehavior) => {
    const box = scroller.current;
    const li = box?.querySelectorAll("li")[i];
    if (!box || !li) return;
    box.scrollTo({
      left: li.offsetLeft + li.offsetWidth / 2 - box.clientWidth / 2,
      behavior,
    });
  }, []);

  // Au chargement, l'habit ouvert (celui du milieu) est au centre de l'écran.
  useEffect(() => center(resting, "instant"), [center, resting]);

  return (
    <div>
      <div
        ref={scroller}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="relative mx-auto w-max px-4 pt-3"
          onMouseLeave={() => setActive(resting)}
        >
          {/* La tringle */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-linear-to-b from-zinc-300 via-zinc-500 to-zinc-700 shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          />
          <ul className="flex items-start">
            {items.map((item, i) => {
              const open = i === active;
              return (
                <li
                  key={item.src}
                  className={cn(
                    "relative shrink-0 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    // Hauteur 2/3 = largeur de face ; de profil, environ un quart.
                    open ? "w-56 md:w-72" : "w-12 md:w-16",
                  )}
                  onMouseEnter={() => setActive(i)}
                  onTransitionEnd={(e) => {
                    if (
                      e.target !== e.currentTarget ||
                      e.propertyName !== "width"
                    )
                      return;
                    if (open && recenter.current) {
                      recenter.current = false;
                      center(i, "smooth");
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    aria-label={item.name}
                    onFocus={() => setActive(i)}
                    onClick={(e) => {
                      // Toucher : le premier ouvre l'habit, le second sa fiche.
                      if (!open) {
                        e.preventDefault();
                        recenter.current = true;
                        setActive(i);
                      }
                    }}
                    className="relative block h-84 [perspective:1200px] focus-visible:outline-none md:h-108"
                  >
                    <div
                      className={cn(
                        "absolute top-0 left-1/2 h-84 w-56 transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-origin:50%_0] md:h-108 md:w-72",
                        open
                          ? "[transform:translateX(-50%)_rotateY(0deg)]"
                          : "brightness-75 [transform:translateX(-50%)_rotateY(76deg)]",
                      )}
                    >
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        sizes="(min-width: 768px) 18rem, 14rem"
                        className="object-contain object-top"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* Hors de la zone qui défile : le nom reste centré sous l'écran. */}
      <div className="mt-5 text-center" aria-live="polite">
        <Link
          href={items[active].href}
          className="text-muted-foreground text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-70"
        >
          {items[active].name}
        </Link>
      </div>
    </div>
  );
}
