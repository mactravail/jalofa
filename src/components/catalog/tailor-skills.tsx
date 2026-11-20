import Image from "next/image";
import { Shirt } from "lucide-react";

import Link from "@/components/i18n/link";
import { skillKey } from "@/lib/catalog-link";
import { getT } from "@/lib/i18n/server";
import type { GarmentModel } from "@/lib/types";

/**
 * « Il sait faire » sur la fiche publique d'un tailleur : les habits du
 * catalogue JALOFA qu'il sait coudre, chacun ouvrant la page de l'habit.
 */
export async function TailorSkills({
  models,
  custom = [],
  className,
}: {
  models: GarmentModel[];
  /** Les habits absents du catalogue, dont le tailleur a écrit le nom. */
  custom?: string[];
  className?: string;
}) {
  if (models.length === 0 && custom.length === 0) return null;
  const t = await getT();

  return (
    <section id="savoir-faire" className={className}>
      <h2 className="text-xl font-bold tracking-tight">
        {t("Il sait faire")}
        <span className="text-muted-foreground ml-2 text-base font-normal">
          ({models.length + custom.length})
        </span>
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {models.map((m) => {
          const image = m.photos[0] ?? m.image_url;
          return (
            <Link
              key={m.id}
              href={`/modeles/${skillKey(m)}`}
              className="group flex min-w-0 flex-col"
            >
              <span className="bg-muted relative aspect-square overflow-hidden rounded-lg">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center">
                    <Shirt className="size-8" aria-hidden />
                  </span>
                )}
              </span>
              <span className="mt-2 line-clamp-2 text-sm font-medium">{t(m.name)}</span>
            </Link>
          );
        })}
        {custom.map((name) => (
          <span key={name} className="flex min-w-0 flex-col">
            <span className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-lg">
              <Shirt className="size-8" aria-hidden />
            </span>
            <span className="mt-2 line-clamp-2 text-sm font-medium">{name}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
