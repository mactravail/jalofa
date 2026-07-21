import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type GarmentTypeCard = {
  id: string;
  name: string;
  image: string | null;
  /** "As-is" total for this type — shown as "Dès {price}" on its card. */
  fromPrice: number;
};

/**
 * Product-family switcher pinned above a dedicated garment page: several
 * silhouettes of the same family (e.g. Grand Boubou, Agbada, Baye Lahat) each
 * keep their own photos, price and configurator. Picking one deep-links via
 * `?type=` — the whole page re-renders for that model server-side, exactly as
 * if you had landed there directly from /modeles. Nothing switches once
 * "Personnaliser" is pressed — this only decides which garment you're on.
 */
export function GarmentTypeSwitcher({
  basePath,
  label,
  types,
  activeId,
}: {
  basePath: string;
  label: string;
  types: GarmentTypeCard[];
  activeId: string;
}) {
  if (types.length < 2) return null;

  return (
    <div className="mb-8">
      <p className="mb-3 text-sm font-medium">{label}</p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {types.map((t) => {
          const active = t.id === activeId;
          return (
            <Link
              key={t.id}
              href={`${basePath}?type=${t.id}`}
              scroll={false}
              aria-current={active}
              className={cn(
                "group bg-card w-28 shrink-0 overflow-hidden rounded-xl border transition-colors",
                active
                  ? "border-primary ring-primary/30 ring-2"
                  : "hover:border-foreground/30",
              )}
            >
              <div className="bg-muted relative aspect-square overflow-hidden">
                {t.image && (
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-2">
                <p
                  className={cn(
                    "line-clamp-1 text-xs font-medium",
                    active && "text-primary",
                  )}
                >
                  {t.name}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Dès {formatPrice(t.fromPrice)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
