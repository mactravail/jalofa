import Image from "next/image";
import Link from "@/components/i18n/link";

import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export type GarmentTypeCard = {
  id: string;
  name: string;
  image: string | null;
  /** "As-is" total for this type — shown as "Dès {price}" on its card. */
  fromPrice: number | null;
  /**
   * Création d'un tailleur rangée sous ce vêtement : elle ouvre sa propre fiche
   * (`href`) au lieu de changer de type, et porte le nom de l'atelier.
   */
  href?: string;
  shop?: string | null;
};

/** Une création de tailleur, en carte de la rangée des types. */
export function creationTypeCard(
  model: { id: string; name: string; image_url: string | null; photos?: string[]; price: number | null; origin?: { shop_name: string | null } | null },
  shop: string | null,
): GarmentTypeCard {
  return {
    id: model.id,
    name: model.name,
    image: model.photos?.[0] ?? model.image_url ?? null,
    fromPrice: model.price,
    href: `/modeles/${model.id}`,
    shop: model.origin?.shop_name ?? shop,
  };
}

/**
 * Product-family switcher pinned above a dedicated garment page: several
 * silhouettes of the same family (e.g. Grand Boubou, Agbada, Baye Lahat) each
 * keep their own photos, price and configurator. Picking one deep-links via
 * `?type=` — the whole page re-renders for that model server-side, exactly as
 * if you had landed there directly from /modeles. Nothing switches once
 * "Personnaliser" is pressed — this only decides which garment you're on.
 */
export async function GarmentTypeSwitcher({
  basePath,
  label,
  types,
  activeId,
  showSingle = false,
}: {
  basePath: string;
  label: string;
  types: GarmentTypeCard[];
  activeId: string;
  /** Afficher la rangée même avec une seule carte (fiche catalogue). */
  showSingle?: boolean;
}) {
  if (types.length < (showSingle ? 1 : 2)) return null;
  const tr = await getT();

  return (
    <div className="mb-8">
      <p className="mb-3 text-sm font-medium">{label}</p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {types.map((type) => {
          const active = type.id === activeId;
          return (
            <Link
              key={type.id}
              href={type.href ?? `${basePath}?type=${type.id}`}
              scroll={type.href ? undefined : false}
              aria-current={active}
              className={cn(
                "group bg-card w-28 shrink-0 overflow-hidden rounded-xl border transition-colors",
                active
                  ? "border-primary ring-primary/30 ring-2"
                  : "hover:border-foreground/30",
              )}
            >
              <div className="bg-muted relative aspect-square overflow-hidden">
                {type.image && (
                  <Image
                    src={type.image}
                    alt={type.name}
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
                  {type.name}
                </p>
                {type.shop && (
                  <p className="text-muted-foreground line-clamp-1 text-[11px]">{type.shop}</p>
                )}
                {type.fromPrice != null && (
                  <p className="text-muted-foreground text-[11px] whitespace-nowrap">
                    {tr("Dès")} {formatPrice(type.fromPrice)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
