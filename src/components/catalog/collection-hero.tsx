import Image from "next/image";

import { display } from "@/lib/display-font";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// Le hero commun aux pages Homme, Femme et Tissus : une photo plein écran, un
// sur-titre numéroté, un seul mot énorme en bas à gauche. Le texte peut passer
// sur le sujet de la photo : c'est voulu. Toute l'image mène à la collection.

export async function CollectionHero({
  number,
  eyebrow,
  title,
  image,
  target,
  titleClassName,
  secondaryLink,
}: {
  number: string;
  eyebrow: string;
  title: string;
  image: { src: string; alt: string; position?: string; className?: string };
  /** Ancre de la section à rejoindre, sans le `#`. */
  target: string;
  /** Pour un mot long : 22vw déborde de l'écran au-delà de 6 lettres. */
  titleClassName?: string;
  /** Second lien à côté de « Découvrir », pour un autre public de la page. */
  secondaryLink?: { href: string; label: string };
}) {
  const t = await getT();
  return (
    <section className="relative h-[calc(100svh-6.25rem-var(--spacing-bottom-nav))] min-h-[28rem] overflow-hidden bg-black md:h-[calc(100svh-6.25rem)]">
      <a href={`#${target}`} aria-label={`${t(title)} — ${t("Découvrir")}`} className="absolute inset-0">
        <Image
          src={image.src}
          alt={t(image.alt)}
          fill
          preload
          sizes="100vw"
          className={cn("object-cover", image.position, image.className)}
        />
      </a>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent via-40% to-transparent" />

      <div
        className={cn(
          display.className,
          "pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-6 text-white uppercase md:px-12 md:pb-10",
        )}
      >
        <p className="text-sm tracking-[0.15em] md:text-lg">
          {number} / {t(eyebrow)}
        </p>
        <h1
          className={cn(
            "mt-3 text-[22vw] leading-[0.9] tracking-[0.04em] md:mt-5 md:text-[11vw]",
            titleClassName,
          )}
        >
          {t(title)}
        </h1>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 md:mt-6">
          <a
            href={`#${target}`}
            className="pointer-events-auto inline-block border-b border-white pb-1 text-sm tracking-[0.2em] transition-opacity hover:opacity-70"
          >
            {t("Découvrir")}
          </a>
          {secondaryLink && (
            <a
              href={secondaryLink.href}
              className="pointer-events-auto inline-block border-b border-white pb-1 text-sm tracking-[0.2em] transition-opacity hover:opacity-70"
            >
              {t(secondaryLink.label)}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
