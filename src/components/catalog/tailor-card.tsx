import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, MapPin, Scissors, Star, Truck } from "lucide-react";

import { Price } from "@/components/cart/price";
import { TrustScoreBadge } from "@/components/catalog/trust-score";
import type { Tailor } from "@/lib/types";

// La carte d'un tailleur : sa photo d'abord, puis l'essentiel pour comparer.
// Un tailleur sans avis, sans ville ou sans prix n'affiche pas « 0.0 » ni
// « Dès 0 FCFA » : la ligne disparaît, et le badge « Nouveau » suffit.

export function TailorCard({ tailor }: { tailor: Tailor }) {
  const name = tailor.shop_name ?? "Tailleur";

  return (
    <Link href={`/tailleurs/${tailor.id}`} className="group flex min-w-0 flex-col">
      <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-xl">
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
        <h3 className="line-clamp-1 text-xl font-medium tracking-tight">{name}</h3>
        {tailor.is_certified && (
          <BadgeCheck className="size-5 shrink-0 fill-blue-600 text-white" aria-label="Certifié" />
        )}
      </div>

      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
        {tailor.city && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden /> {tailor.city}
          </span>
        )}
        {tailor.rating_count > 0 && (
          <span className="flex items-center gap-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-foreground font-medium">{tailor.rating.toFixed(1)}</span>
            ({tailor.rating_count} avis)
          </span>
        )}
      </div>

      <TrustScoreBadge pro={tailor} className="mt-3 self-start" />

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/15 pt-4 text-base">
          {tailor.base_price > 0 && (
            <span className="text-muted-foreground">
              Dès <Price amount={tailor.base_price} className="text-foreground text-lg font-semibold" />
            </span>
          )}
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden /> {tailor.avg_delivery_days} jours
          </span>
        </div>

        {tailor.free_delivery && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
            <Truck className="size-4" aria-hidden /> Livraison offerte
          </p>
        )}

        <span className="mt-4 flex h-12 items-center justify-center gap-2 rounded-lg border border-white/40 text-base font-semibold transition-colors group-hover:bg-white group-hover:text-black">
          Voir ce tailleur
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
