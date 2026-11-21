import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight, BadgeCheck, Clock, MapPin, Scissors, Star } from "lucide-react";

import { Price } from "@/components/cart/price";
import { TrustScoreBadge } from "@/components/catalog/trust-score";
import { TAILOR_SPECIALTY_LABELS } from "@/lib/constants";
import type { Tailor } from "@/lib/types";
import { getT } from "@/lib/i18n/server";

// La carte d'un tailleur : sa photo d'abord, puis l'essentiel pour comparer.
// Un tailleur sans avis, sans ville ou sans prix n'affiche pas « 0.0 » ni
// « Dès 0 FCFA » : la ligne disparaît, et le badge « Nouveau » suffit.

export async function TailorCard({
  tailor,
  skills = [],
}: {
  tailor: Tailor;
  /** « Je sais faire » : les noms des habits qu'il sait coudre. */
  skills?: string[];
}) {
  const t = await getT();
  const name = tailor.shop_name ?? t("Tailleur");

  return (
    <Link href={`/tailleurs/${tailor.id}`} className="group flex min-w-0 flex-col">
      <div className="bg-muted relative aspect-4/3 overflow-hidden rounded-xl">
        {tailor.cover_url ? (
          <Image
            src={tailor.cover_url}
            alt={name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Scissors className="size-14" strokeWidth={1.25} aria-hidden />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h3 className="line-clamp-1 text-base font-medium tracking-tight">{name}</h3>
        {tailor.is_certified && (
          <BadgeCheck className="size-4 shrink-0 fill-blue-600 text-white" aria-label={t("Certifié")} />
        )}
      </div>

      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {tailor.city && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden /> {tailor.city}
          </span>
        )}
        {tailor.rating_count > 0 && (
          <span className="flex items-center gap-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-foreground font-medium">{tailor.rating.toFixed(1)}</span>
            ({t("{n} avis", { n: tailor.rating_count })})
          </span>
        )}
      </div>

      {tailor.specialty && (
        <p className="mt-2 text-sm font-medium">
          {t(TAILOR_SPECIALTY_LABELS[tailor.specialty])}
        </p>
      )}

      {skills.length > 0 && (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          <span className="text-foreground font-medium">{t("Sait faire :")}</span>{" "}
          {skills.slice(0, 3).map((s) => t(s)).join(", ")}
          {skills.length > 3 && ` +${skills.length - 3}`}
        </p>
      )}

      <TrustScoreBadge pro={tailor} className="mt-3 self-start" />

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/15 pt-4 text-sm">
          {tailor.base_price > 0 && (
            <span className="text-muted-foreground">
              {t("Dès")} <Price amount={tailor.base_price} className="text-foreground text-sm font-medium" />
            </span>
          )}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden /> {t("{n} jours", { n: tailor.avg_delivery_days })}
          </span>
        </div>

        <span className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg border border-white/40 text-sm font-semibold transition-colors group-hover:bg-white group-hover:text-black">
          {t("Voir ce tailleur")}
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
