"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import { saveModel } from "@/lib/actions/models";
import { modelPhotos } from "@/lib/constants";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GarmentModel, ModelCategory } from "@/lib/types";

const NONE = "__none__";
const MAX_PHOTOS = 5;
// Total resized payload kept under `serverActions.bodySizeLimit` (4 Mo) with a
// margin for the multipart overhead of five parts.
const TOTAL_BUDGET = 3.6 * 1024 * 1024;

const DIFFICULTIES: { value: string; label: string }[] = [
  { value: "facile", label: "Facile" },
  { value: "moyen", label: "Intermédiaire" },
  { value: "difficile", label: "Avancé" },
];

// A photo already saved on the model, or a freshly picked file carrying the
// object URL used to preview it (revoked when the photo is replaced/removed).
type Photo =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; url: string };

function initialPhotos(model: GarmentModel | null): Photo[] {
  if (!model) return [];
  return modelPhotos(model).map((url) => ({ kind: "existing", url }));
}

export function ModelFormDialog({
  open,
  onOpenChange,
  model,
  suggestion = null,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Le modèle édité (mode « Modifier »). Null en création. */
  model: GarmentModel | null;
  /**
   * Un modèle du catalogue plateforme qui pré-remplit le formulaire en création :
   * le tailleur s'approprie une suggestion. On ne reprend jamais son `id` — la
   * sauvegarde crée toujours une nouvelle ligne à son nom.
   */
  suggestion?: GarmentModel | null;
  categories: ModelCategory[];
}) {
  const isEdit = Boolean(model);
  // Édition : la fiche du tailleur. Création : soit vierge, soit pré-remplie
  // depuis une suggestion. Dans les deux cas de création, aucun `id` n'est posé.
  const source = model ?? suggestion ?? null;
  const [category, setCategory] = useState<string>(
    source?.category_slug ?? NONE,
  );
  const [difficulty, setDifficulty] = useState<string>(
    source?.difficulty ?? NONE,
  );
  const [photos, setPhotos] = useState<Photo[]>(() => initialPhotos(source));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryItems: Record<string, string> = {
    [NONE]: "Aucune catégorie",
    ...Object.fromEntries(categories.map((c) => [c.slug, c.name])),
  };
  const difficultyItems: Record<string, string> = {
    [NONE]: "Non précisée",
    ...Object.fromEntries(DIFFICULTIES.map((d) => [d.value, d.label])),
  };

  function revokeNew(list: Photo[]) {
    for (const p of list) if (p.kind === "new") URL.revokeObjectURL(p.url);
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const picked = Array.from(files).filter((f) =>
        f.type.startsWith("image/"),
      );
      // Truncate to what fits rather than rejecting the whole drop: the tailor
      // who picks seven keeps five and is told why.
      const accepted = picked.slice(0, Math.max(0, room));
      if (picked.length > accepted.length) {
        toast.info(`Maximum ${MAX_PHOTOS} photos — les suivantes ont été ignorées.`);
      }
      return [
        ...prev,
        ...accepted.map((file) => ({
          kind: "new" as const,
          file,
          url: URL.createObjectURL(file),
        })),
      ];
    });
    setError(null);
  }

  function removeAt(i: number) {
    setPhotos((prev) => {
      const target = prev[i];
      if (target?.kind === "new") URL.revokeObjectURL(target.url);
      return prev.filter((_, j) => j !== i);
    });
  }

  function makeCover(i: number) {
    setPhotos((prev) =>
      i <= 0 ? prev : [prev[i], ...prev.filter((_, j) => j !== i)],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (photos.length === 0) {
      setError("Ajoutez au moins une photo du modèle.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("category_slug", category === NONE ? "" : category);
    formData.set("difficulty", difficulty === NONE ? "" : difficulty);
    const items = photos;

    startTransition(async () => {
      // Photos travel in gallery order under a single repeated field: existing
      // ones as their URL, new ones as the resized file. A raw phone shot
      // exceeds the Server Action body limit, so shrink before upload.
      let total = 0;
      for (const p of items) {
        if (p.kind === "existing") {
          formData.append("photo", p.url);
          continue;
        }
        const image = await resizeImage(p.file);
        if (image.size > MAX_UPLOAD_BYTES) {
          setError("Une photo est trop lourde. Choisissez-en une plus légère.");
          return;
        }
        total += image.size;
        formData.append("photo", image);
      }
      if (total > TOTAL_BUDGET) {
        setError(
          "Vos photos sont trop lourdes au total. Retirez-en une ou choisissez des images plus légères.",
        );
        return;
      }

      const res = await saveModel(null, formData);
      if (res?.ok) {
        toast.success(
          isEdit
            ? "Modèle mis à jour."
            : formData.get("is_active") === "on"
              ? "Modèle ajouté et publié dans le catalogue."
              : "Modèle ajouté (brouillon, non visible au catalogue).",
        );
        onOpenChange(false);
      } else if (res) {
        setError(res.error);
      }
    });
  }

  // Reset local state whenever the dialog is (re)opened for a given source
  // (edited model or picked suggestion).
  function handleOpenChange(next: boolean) {
    if (next) {
      setCategory(source?.category_slug ?? NONE);
      setDifficulty(source?.difficulty ?? NONE);
      setPhotos((prev) => {
        revokeNew(prev);
        return initialPhotos(source);
      });
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le modèle" : "Ajouter un modèle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour la fiche de votre création."
              : suggestion
                ? `Vous partez de « ${suggestion.name} ». Ajustez la fiche, elle sera publiée à votre nom.`
                : "Présentez une de vos créations. Les clients qui la choisissent vous sont adressés directement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {model && <input type="hidden" name="id" value={model.id} />}

          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label>Photos du modèle</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div
                  key={p.url}
                  className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="size-full object-cover" />

                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    aria-label="Retirer la photo"
                    className="bg-background/85 text-foreground hover:bg-background absolute top-1 right-1 grid size-5 place-items-center rounded-full shadow-sm"
                  >
                    <X className="size-3" />
                  </button>

                  {i === 0 ? (
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-medium text-white">
                      Couverture
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      aria-label="Définir comme couverture"
                      title="Définir comme couverture"
                      className="bg-background/85 text-foreground hover:bg-background absolute bottom-1 left-1 grid size-5 place-items-center rounded-full shadow-sm"
                    >
                      <Star className="size-3" />
                    </button>
                  )}
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="text-muted-foreground hover:bg-muted flex size-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs">
                  <ImagePlus className="size-5" />
                  Ajouter
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Jusqu&apos;à {MAX_PHOTOS} photos (JPEG, PNG ou WebP), redimensionnées
              automatiquement. La première est la couverture affichée dans le
              catalogue.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-name">Nom du modèle</Label>
            <Input
              id="model-name"
              name="name"
              required
              defaultValue={source?.name ?? ""}
              placeholder="Ex. Boubou brodé Dakar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as string)}
                items={categoryItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucune catégorie</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-days">Confection (jours)</Label>
              <Input
                id="model-days"
                name="avg_days"
                type="number"
                min={1}
                max={365}
                step={1}
                defaultValue={source?.avg_days ?? 7}
                placeholder="7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-price">Prix de confection (FCFA)</Label>
            <Input
              id="model-price"
              name="price"
              type="number"
              min={0}
              step={500}
              defaultValue={source?.price ?? ""}
              placeholder="25000"
            />
            <p className="text-muted-foreground text-xs">
              Ce que vous facturez pour ce modèle. Laissez vide pour utiliser
              votre tarif « dès… » par défaut.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Difficulté</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as string)}
              items={difficultyItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Non précisée</SelectItem>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-description">Description</Label>
            <Textarea
              id="model-description"
              name="description"
              rows={2}
              defaultValue={source?.description ?? ""}
              placeholder="Coupe, finitions, occasion…"
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={model ? model.is_active : true}
              className="accent-primary mt-0.5 size-4 rounded"
            />
            <span>
              Publier dans le catalogue
              <span className="text-muted-foreground block text-xs">
                Le modèle apparaît dans /modeles et vous êtes automatiquement le
                tailleur des commandes passées dessus. Décochez pour le garder en
                brouillon.
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Ajouter le modèle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
