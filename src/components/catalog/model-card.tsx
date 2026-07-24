import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { modelPhotos } from "@/lib/constants";
import { DEDICATED_HREF } from "@/lib/garment-routes";
import type { GarmentModel } from "@/lib/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

/**
 * `context` carries an in-progress order (type / fabric / tailor chosen before a
 * garment was) through to the detail page, which folds it back into the
 * configurator link.
 */
export function ModelCard({ model, context }: { model: GarmentModel; context?: string }) {
  // Le vêtement seul en vitrine — la vue portée vient juste après, dans la
  // galerie de la fiche.
  const [cover] = modelPhotos(model);

  // Un modèle qui a sa page dédiée y va directement : /modeles/[id] ne faisait
  // que rediriger vers `?type=<slug>` (en perdant déjà le contexte), donc on
  // économise l'aller-retour — et une route dynamique de moins à traverser.
  const dedicated = model.slug ? DEDICATED_HREF[model.slug] : undefined;
  const href = dedicated
    ? `${dedicated}?type=${model.slug}`
    : `/modeles/${model.id}${context ? `?${context}` : ""}`;

  return (
    <Link
      href={href}
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
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-medium">{model.name}</h3>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
          <Clock className="size-3.5" />~{model.avg_days} jours
          {model.difficulty && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {DIFFICULTY_LABEL[model.difficulty] ?? model.difficulty}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
