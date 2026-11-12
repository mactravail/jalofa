import Image from "next/image";

import { display } from "@/lib/display-font";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// « Événement à venir » : une bannière plein écran, façon campagne de mode.
// Un sur-titre, un grand titre, une ligne. Pas de bouton : la section annonce,
// elle ne vend pas. N'y écrire qu'un événement réel, avec sa vraie date.

export type UpcomingEventContent = {
  /** Petit sur-titre en majuscules, ex. « Événement à venir · Dakar ». */
  eyebrow: string;
  /** Le nom de l'événement, en très grand. */
  title: string;
  /** Une ligne : la date et le lieu, ou ce qui arrive. */
  text?: string;
  image: { src: string; alt: string; position?: string };
};

export async function UpcomingEvent({ event }: { event: UpcomingEventContent }) {
  const t = await getT();
  return (
    <section className="relative mt-16 h-[45svh] min-h-[18rem] overflow-hidden bg-black md:mt-24 md:h-[24rem]">
      <Image
        src={event.image.src}
        alt={t(event.image.alt)}
        fill
        sizes="100vw"
        className={cn("object-cover", event.image.position)}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-6 text-white md:px-12 md:pb-8">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase md:text-sm">
          {t(event.eyebrow)}
        </p>
        <h2
          className={cn(
            display.className,
            "mt-2 text-4xl leading-[0.95] tracking-tight text-balance md:mt-3 md:text-6xl",
          )}
        >
          {t(event.title)}
        </h2>
        {event.text && (
          <p className="mt-2 max-w-md text-sm text-white/80 md:mt-3 md:text-base">{t(event.text)}</p>
        )}
      </div>
    </section>
  );
}
