import Image from "next/image";
import Link from "@/components/i18n/link";
import { ShoppingBag, Wand2 } from "lucide-react";

import { ProductPrice } from "@/components/europe/europe-price";
import { buttonVariants } from "@/components/ui/button";
import { modelPhotos } from "@/lib/constants";
import { modelHref } from "@/lib/model-href";
import { isReadyToWear } from "@/lib/ready-to-wear";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

/** Le lien de la fiche, qui s'ouvre déjà sur le bon choix du bloc d'achat. */
function hrefWithMode(model: GarmentModel, mode: "tel-quel" | "sur-mesure") {
  const href = modelHref(model);
  return `${href}${href.includes("?") ? "&" : "?"}mode=${mode}`;
}

// La carte d'un modèle dans la boutique d'un tailleur (page d'arrivée des lives
// TikTok) : la photo, le prix, et tout de suite les deux façons de l'acheter.
// « Prêt-à-porter » n'apparaît que si le tailleur l'a déjà cousu.
export async function ShopModelCard({
  model,
  salesPending = false,
}: {
  model: GarmentModel;
  /** Tailleur pas encore validé par JALOFA : on montre, on ne vend pas. */
  salesPending?: boolean;
}) {
  const t = await getT();
  const [cover] = modelPhotos(model);
  const ready = isReadyToWear(model);

  return (
    <div className="bg-card flex flex-col overflow-hidden rounded-xl border">
      <Link href={modelHref(model)} className="group bg-muted relative block aspect-4/5 overflow-hidden">
        {cover && (
          <Image
            src={cover}
            alt={model.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-medium">{model.name}</h3>
        {model.price != null && (
          <p className="text-primary mt-1 text-sm font-semibold">
            {t("À partir de")}{" "}
            <ProductPrice amount={model.price} europe={model.origin?.europe} />
          </p>
        )}
        {salesPending ? (
          <p className="text-muted-foreground mt-auto pt-3 text-xs font-medium">
            {t("Bientôt disponible")}
          </p>
        ) : (
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <Link
            href={hrefWithMode(model, "sur-mesure")}
            className={cn(buttonVariants(), "h-10 w-full")}
          >
            <Wand2 className="size-4" /> {t("Personnaliser")}
          </Link>
          {ready && (
            <Link
              href={hrefWithMode(model, "tel-quel")}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}
            >
              <ShoppingBag className="size-4" /> {t("Prêt-à-porter")}
            </Link>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
