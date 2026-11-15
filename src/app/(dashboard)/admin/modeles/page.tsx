import Image from "next/image";
import Link from "next/link";
import { EyeOff, Shirt } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { ActiveBadge } from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import {
  getAllModels,
  getAllOrders,
  getAllTailors,
  hiddenOrderedModels,
  type HiddenOrderedModel,
} from "@/lib/admin-data";
import { CatalogModelsManager } from "@/components/admin/catalog-models-manager";
import { catalogModelOf, isCatalogModel } from "@/lib/catalog-link";
import { modelPhotos } from "@/lib/constants";
import { getModelCategories } from "@/lib/data";
import { STYLE_BASES } from "@/lib/style-options";
import type { GarmentModel } from "@/lib/types";

export default async function AdminModelsPage() {
  const [models, orders, tailors, categories] = await Promise.all([
    getAllModels(),
    getAllOrders(),
    getAllTailors(),
    getModelCategories(),
  ]);
  const watched = hiddenOrderedModels(models, orders, tailors);

  const catalog = models.filter(isCatalogModel);
  const creations = models.filter((m) => !isCatalogModel(m));
  const creationCounts: Record<string, number> = {};
  const parentOf = new Map<string, GarmentModel | null>();
  for (const c of creations) {
    const parent = catalogModelOf(c, catalog);
    parentOf.set(c.id, parent);
    if (parent) creationCounts[parent.id] = (creationCounts[parent.id] ?? 0) + 1;
  }

  return (
    <AdminPage
      title="Modèles"
      subtitle="Le catalogue JALOFA, et les créations des tailleurs rangées dessous."
    >
      {watched.length > 0 && <WatchList items={watched} />}

      <CatalogModelsManager
        catalog={catalog}
        creationCounts={creationCounts}
        categories={categories}
        planches={STYLE_BASES}
      />

      <h2 className="mb-3 text-lg font-semibold">Créations des tailleurs</h2>
      {creations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucune création.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {creations.map((model) => (
            <ModelRow key={model.id} model={model} parent={parentOf.get(model.id) ?? null} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function ModelRow({ model, parent }: { model: GarmentModel; parent: GarmentModel | null }) {
  const cover = modelPhotos(model)[0] ?? null;
  const meta = [
    parent ? `Rangé sous : ${parent.name}` : "Non rangé",
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

/**
 * Modèles déjà commandés puis masqués par leur tailleur : ils ne peuvent pas être
 * supprimés, et un masquage avec des commandes en cours peut cacher une arnaque
 * (le client a payé, le tailleur disparaît). On les sort en tête de page.
 */
function WatchList({ items }: { items: HiddenOrderedModel[] }) {
  return (
    <section className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <EyeOff className="size-4 text-amber-500" />
        À surveiller : modèles masqués après commande
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Un modèle déjà commandé ne peut pas être supprimé, seulement masqué. Vérifiez
        que les commandes en cours sont bien honorées.
      </p>
      <ul className="mt-4 divide-y rounded-lg border bg-background">
        {items.map(({ model, shopName, orders, ongoing }) => (
          <li key={model.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{model.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {shopName ?? "Tailleur inconnu"} ·{" "}
                {orders > 1 ? `${orders} commandes` : "1 commande"}
              </p>
            </div>
            {ongoing > 0 ? (
              <Link href="/admin/commandes">
                <Badge variant="destructive">
                  {ongoing > 1 ? `${ongoing} en cours` : "1 en cours"}
                </Badge>
              </Link>
            ) : (
              <Badge variant="outline">Toutes terminées</Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
