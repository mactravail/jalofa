import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/constants";
import type { Fabric } from "@/lib/types";

// Bandeau défilant des tissus réels (wax, bazin, laine…) — de la texture en
// mouvement, sans JS : deux pistes identiques translatées en boucle via
// `animate-marquee` (globals.css), figées si `prefers-reduced-motion`. Le
// conteneur masque les débords et estompe les bords.

function FabricChip({ fabric }: { fabric: Fabric }) {
  return (
    <Link
      href={`/tissus/${fabric.id}`}
      className="group relative block w-44 shrink-0 sm:w-52"
      aria-label={`${fabric.name} — ${formatPrice(fabric.price_per_meter)} le mètre`}
    >
      <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-2xl border">
        {fabric.image_url && (
          <Image
            src={fabric.image_url}
            alt={fabric.name}
            fill
            sizes="13rem"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="truncate text-sm font-semibold tracking-tight">{fabric.name}</p>
          <p className="text-[0.7rem] text-white/80">
            {formatPrice(fabric.price_per_meter)} / m
          </p>
        </div>
      </div>
    </Link>
  );
}

export function FabricMarquee({ fabrics }: { fabrics: Fabric[] }) {
  if (fabrics.length === 0) return null;
  // Deux pistes identiques, côte à côte : chacune translate de -100 % de sa
  // largeur. Quand la 1re sort à gauche, la 2e occupe exactement sa place de
  // départ → boucle sans couture.
  return (
    <div
      className="group relative flex overflow-hidden py-2 [--marquee:70s]"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
      }}
    >
      {[0, 1].map((track) => (
        <div
          key={track}
          aria-hidden={track === 1}
          className="animate-marquee flex shrink-0 gap-4 pr-4 group-hover:[animation-play-state:paused]"
        >
          {fabrics.map((fabric, i) => (
            <FabricChip key={`${track}-${fabric.id}-${i}`} fabric={fabric} />
          ))}
        </div>
      ))}
    </div>
  );
}
