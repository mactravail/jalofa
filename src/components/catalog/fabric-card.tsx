import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";
import { fabricColorHex, parseFabricColors } from "@/lib/fabric-colors";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FabricCard({
  fabric,
  badge,
}: {
  fabric: Fabric;
  /** Pastille de mise en avant (« Best-seller »…), posée par la grille appelante. */
  badge?: string;
}) {
  const colors = parseFabricColors(fabric.color);
  return (
    <Link
      href={`/tissus/${fabric.id}`}
      className="group bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="bg-muted relative aspect-square overflow-hidden">
        {fabric.image_url && (
          <Image
            src={fabric.image_url}
            alt={fabric.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {badge && (
          <Badge className="absolute left-2 top-2">{badge}</Badge>
        )}
        {colors.length > 0 && (
          <Badge
            variant="secondary"
            className={cn("absolute left-2 gap-1", badge ? "top-9" : "top-2")}
          >
            {colors.slice(0, 4).map((c) => {
              const hex = fabricColorHex(c);
              return hex ? (
                <span
                  key={c}
                  className="size-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: hex }}
                />
              ) : null;
            })}
            {colors.length === 1 ? colors[0] : `${colors.length} couleurs`}
          </Badge>
        )}
        {fabric.in_stock === false && (
          <span className="absolute inset-0 grid place-items-center bg-black/60 font-semibold text-white">
            Épuisé
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-medium">{fabric.name}</h3>
        <p className="text-muted-foreground text-xs">{fabric.material}</p>
        <p className="text-primary mt-1.5 font-semibold">
          {formatPrice(fabric.price_per_meter)}
          <span className="text-muted-foreground text-xs font-normal"> / mètre</span>
        </p>
      </div>
    </Link>
  );
}
