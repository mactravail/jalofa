"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { saveCatalogModel } from "@/lib/actions/admin-models";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { modelPhotos } from "@/lib/constants";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import type { GarmentModel, ModelCategory } from "@/lib/types";

/** Les planches dessinées proposables (clés de `STYLE_GROUPS_BY_SLUG`). */
export type PlancheChoice = { group: string; items: { value: string; label: string }[] };

type Photo = { kind: "existing"; url: string } | { kind: "new"; file: File; preview: string };

const MAX_PHOTOS = 5;
const selectClass =
  "border-input bg-background h-10 w-full rounded-lg border px-3 text-base md:text-sm";

/**
 * Ajouter ou modifier un modèle du catalogue JALOFA. Réservé à l'admin (contrôlé
 * aussi côté serveur, cf. `saveCatalogModel`).
 */
export function CatalogModelDialog({
  open,
  onOpenChange,
  model,
  categories,
  planches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: GarmentModel | null;
  categories: ModelCategory[];
  planches: PlancheChoice[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(() =>
    model ? modelPhotos(model).map((url) => ({ kind: "existing" as const, url })) : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: Photo[] = [];
    for (const f of Array.from(files)) {
      const file = await resizeImage(f);
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error("Photo trop lourde (4 Mo maximum).");
        continue;
      }
      next.push({ kind: "new", file, preview: URL.createObjectURL(file) });
    }
    setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (photos.length === 0) {
      setError("Ajoutez au moins une photo.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.delete("photo");
    for (const p of photos) formData.append("photo", p.kind === "new" ? p.file : p.url);
    startTransition(async () => {
      const res = await saveCatalogModel(formData);
      if (res.ok) {
        toast.success(model ? "Modèle modifié." : "Modèle ajouté au catalogue.");
        onOpenChange(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{model ? "Modifier le modèle" : "Ajouter un modèle au catalogue"}</DialogTitle>
          <DialogDescription>
            Les tailleurs rangent leurs créations sous ce modèle ; elles s&apos;affichent sur sa page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {model && <input type="hidden" name="id" value={model.id} />}

          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => {
                const src = p.kind === "new" ? p.preview : p.url;
                return (
                  <div key={src} className="bg-muted relative size-20 overflow-hidden rounded-lg border">
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" unoptimized={p.kind === "new"} />
                    <button
                      type="button"
                      aria-label="Retirer la photo"
                      onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })}
              {photos.length < MAX_PHOTOS && (
                <label className="text-muted-foreground hover:bg-muted flex size-20 cursor-pointer items-center justify-center rounded-lg border border-dashed">
                  <ImagePlus className="size-6" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      void addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cm-name">Nom</Label>
            <Input id="cm-name" name="name" required defaultValue={model?.name ?? ""} placeholder="Ex. Agbada" />
          </div>

          {!model && (
            <div className="space-y-2">
              <Label htmlFor="cm-slug">Lien de la page (facultatif)</Label>
              <Input id="cm-slug" name="slug" placeholder="agbada — tiré du nom si vide" />
              <p className="text-muted-foreground text-xs">Fixé à la création : il ne change plus ensuite.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cm-category">Catégorie</Label>
              <select id="cm-category" name="category_slug" required defaultValue={model?.category_slug ?? ""} className={selectClass}>
                <option value="">Choisissez…</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cm-days">Confection (jours)</Label>
              <Input id="cm-days" name="avg_days" type="number" min={1} max={365} defaultValue={model?.avg_days ?? 7} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cm-price">Prix de base (FCFA)</Label>
              <Input id="cm-price" name="price" type="number" min={0} step={500} defaultValue={model?.price ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cm-difficulty">Difficulté</Label>
              <select id="cm-difficulty" name="difficulty" defaultValue={model?.difficulty ?? ""} className={selectClass}>
                <option value="">—</option>
                <option value="facile">Facile</option>
                <option value="moyen">Intermédiaire</option>
                <option value="difficile">Avancé</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cm-planches">Planches de personnalisation</Label>
            <select
              id="cm-planches"
              name="style_base"
              defaultValue={model?.style_base ?? model?.slug ?? ""}
              className={selectClass}
            >
              <option value="">D&apos;après le nom</option>
              {planches.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              Les dessins (col, manches, broderie…) proposés aux clients pour ce vêtement.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cm-description">Description</Label>
            <Textarea id="cm-description" name="description" rows={3} defaultValue={model?.description ?? ""} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={model?.is_active ?? true} className="size-4" />
            Visible sur le site
          </label>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {model ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
