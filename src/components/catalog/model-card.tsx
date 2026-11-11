import Image from "next/image";
import Link from "@/components/i18n/link";
import { Clock } from "lucide-react";

import { EuropeBadge } from "@/components/europe/europe-badge";
import { ProductPrice } from "@/components/europe/europe-price";
import { Badge } from "@/components/ui/badge";
import { modelPhotos } from "@/lib/constants";
import { modelHref } from "@/lib/model-href";
import type { GarmentModel } from "@/lib/types";
import { getT } from "@/lib/i18n/server";

const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

export { modelHref };

export async function ModelCard({ model, context }: { model: GarmentModel; context?: string }) {
  const t = await getT();
  // Le vêtement seul en vitrine — la vue portée vient juste après, dans la
  // galerie de la fiche.
  const [cover] = modelPhotos(model);

  return (
    <Link
      href={modelHref(model, context)}
      className="group bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="bg-muted relative aspect-4/5 overflow-hidden">
        {cover && (
          <Image
            src={cover}
            alt={model.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {model.origin?.europe && (
          <EuropeBadge overlay country={model.origin.country} className="absolute top-2 left-2 max-w-[calc(100%-1rem)]" />
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-medium">{model.name}</h3>
        {model.price != null && (
          <p className="text-primary mt-1 text-sm font-semibold">
            {t("À partir de")}{" "}
            <ProductPrice amount={model.price} europe={model.origin?.europe} />
          </p>
        )}
        <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
          <Clock className="size-3.5" />{t("~{n} jours", { n: model.avg_days })}
          {model.difficulty && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {t(DIFFICULTY_LABEL[model.difficulty] ?? model.difficulty)}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
