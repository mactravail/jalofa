"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Pencil, Plus, Shirt } from "lucide-react";
import { toast } from "sonner";

import { CatalogModelDialog, type PlancheChoice } from "@/components/admin/catalog-model-dialog";
import { ActiveBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { setCatalogModelActive } from "@/lib/actions/admin-models";
import { modelPhotos } from "@/lib/constants";
import type { GarmentModel, ModelCategory } from "@/lib/types";

/** « Catalogue JALOFA » dans /admin/modeles : ajouter, modifier, masquer. */
export function CatalogModelsManager({
  catalog,
  creationCounts,
  categories,
  planches,
}: {
  catalog: GarmentModel[];
  /** id du modèle catalogue → nombre de créations tailleurs rangées dessous. */
  creationCounts: Record<string, number>;
  categories: ModelCategory[];
  planches: PlancheChoice[];
}) {
  const [editing, setEditing] = useState<GarmentModel | null>(null);
  const [open, setOpen] = useState(false);
  const [seq, setSeq] = useState(0);
  const [isPending, startTransition] = useTransition();

  function openFor(model: GarmentModel | null) {
    setEditing(model);
    setSeq((n) => n + 1);
    setOpen(true);
  }

  function toggle(model: GarmentModel) {
    startTransition(async () => {
      const res = await setCatalogModelActive(model.id, !model.is_active);
      if (res.ok) toast.success(model.is_active ? "Modèle masqué." : "Modèle affiché.");
      else toast.error(res.error);
    });
  }

  const categoryName = (slug: string | null) =>
    categories.find((c) => c.slug === slug)?.name ?? slug ?? "—";

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Catalogue JALOFA</h2>
          <p className="text-muted-foreground text-sm">
            Les modèles de /modeles. Les tailleurs rangent leurs créations dessous.
          </p>
        </div>
        <Button onClick={() => openFor(null)}>
          <Plus className="size-4" /> Ajouter un modèle
        </Button>
      </div>

      {catalog.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun modèle dans le catalogue.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {catalog.map((model) => {
            const cover = modelPhotos(model)[0] ?? null;
            const count = creationCounts[model.id] ?? 0;
            return (
              <div key={model.id} className="flex items-center gap-4 p-4">
                <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
                  {cover ? (
                    <Image src={cover} alt={model.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="text-muted-foreground flex size-full items-center justify-center">
                      <Shirt className="size-5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{model.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {categoryName(model.category_slug)} ·{" "}
                    {count === 0 ? "aucune création" : count === 1 ? "1 création" : `${count} créations`}
                    {model.slug ? ` · /${model.slug}` : ""}
                  </p>
                </div>
                <ActiveBadge active={model.is_active} />
                <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => openFor(model)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  aria-label={model.is_active ? "Masquer" : "Afficher"}
                  onClick={() => toggle(model)}
                >
                  {model.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <CatalogModelDialog
        key={seq}
        open={open}
        onOpenChange={setOpen}
        model={editing}
        categories={categories}
        planches={planches}
      />
    </section>
  );
}
