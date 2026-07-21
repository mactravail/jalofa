import Image from "next/image";
import { Shirt } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { ActiveBadge } from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import { getAllModels } from "@/lib/admin-data";
import { modelPhotos } from "@/lib/constants";
import type { GarmentModel } from "@/lib/types";

export default async function AdminModelsPage() {
  const models = await getAllModels();

  return (
    <AdminPage
      title="Modèles"
      subtitle="Le catalogue des vêtements : modèles de la plateforme et créations des tailleurs."
    >
      {models.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun modèle.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {models.map((model) => (
            <ModelRow key={model.id} model={model} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function ModelRow({ model }: { model: GarmentModel }) {
  const cover = modelPhotos(model)[0] ?? null;
  const meta = [
    model.category_slug,
    model.difficulty,
    `${model.avg_days} j`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {cover ? (
          <Image
            src={cover}
            alt={model.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Shirt className="size-5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{model.name}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs capitalize">
          {meta}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={model.tailor_id ? "outline" : "secondary"}>
          {model.tailor_id ? "Création tailleur" : "Plateforme"}
        </Badge>
        <ActiveBadge active={model.is_active} />
      </div>
    </div>
  );
}
