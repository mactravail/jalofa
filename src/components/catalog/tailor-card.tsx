import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, MapPin, Scissors, Star, Truck } from "lucide-react";

import { TrustScoreBadge } from "@/components/catalog/trust-score";
import { formatPrice } from "@/lib/constants";
import type { Tailor } from "@/lib/types";

export function TailorCard({ tailor }: { tailor: Tailor }) {
  return (
    <Link
      href={`/tailleurs/${tailor.id}`}
      className="group bg-card flex flex-col items-center rounded-xl border p-6 text-center transition-shadow hover:shadow-md"
    >
      <div className="bg-muted ring-background relative size-24 shrink-0 overflow-hidden rounded-full border shadow-sm ring-4">
        {tailor.cover_url ? (
          <Image
            src={tailor.cover_url}
            alt={tailor.shop_name ?? "Tailleur"}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Scissors className="size-9" />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h3 className="line-clamp-1 font-semibold">{tailor.shop_name}</h3>
        {tailor.is_certified && (
          <BadgeCheck className="size-4 shrink-0 fill-blue-600 text-white" />
        )}
      </div>

      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
        <MapPin className="size-3.5" /> {tailor.city}
      </p>

      <p className="mt-2 flex items-center gap-1 text-sm">
        <Star className="size-4 fill-amber-400 text-amber-400" />
        <span className="font-medium">{tailor.rating.toFixed(1)}</span>
        <span className="text-muted-foreground/70">
          ({tailor.rating_count} avis)
        </span>
      </p>

      <TrustScoreBadge pro={tailor} className="mt-3" />

      <div className="text-muted-foreground mt-4 flex items-center gap-4 border-t pt-4 text-sm">
        <span>
          Dès{" "}
          <span className="text-primary font-semibold">
            {formatPrice(tailor.base_price)}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {tailor.avg_delivery_days} j
        </span>
      </div>

      {tailor.free_delivery && (
        <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium">
          <Truck className="size-3.5" /> Livraison offerte
        </span>
      )}
    </Link>
  );
}
