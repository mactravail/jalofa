"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveFabric } from "@/lib/actions/fabrics";
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
import { CURRENCY } from "@/lib/constants";
import type { Fabric, FabricCategory } from "@/lib/types";

const NONE = "__none__";

export function FabricFormDialog({
  open,
  onOpenChange,
  fabric,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric: Fabric | null;
  categories: FabricCategory[];
}) {
  const isEdit = Boolean(fabric);
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<string>(
    fabric?.category_slug ?? NONE,
  );
  // File + its preview URL move together so the URL is revoked on replacement.
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const file = picked?.file ?? null;
  const preview = picked?.url ?? fabric?.image_url ?? null;

  const itemsMap: Record<string, string> = {
    [NONE]: "Aucune catégorie",
    ...Object.fromEntries(categories.map((c) => [c.slug, c.name])),
  };

  function pick(next: File | null) {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(next ? { file: next, url: URL.createObjectURL(next) } : null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!file && !fabric?.image_url) {
      setError("Ajoutez une photo du tissu.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("category_slug", category === NONE ? "" : category);

    startTransition(async () => {
      // Shrink here rather than server-side: a raw phone shot exceeds the
      // Server Action body limit and would be rejected before upload.
      if (file) {
        const image = await resizeImage(file);
        if (image.size > MAX_UPLOAD_BYTES) {
          setError("Cette photo est trop lourde. Choisissez-en une plus légère.");
          return;
        }
        formData.set("image", image);
      }

      const res = await saveFabric(null, formData);
      if (res?.ok) {
        toast.success(
          isEdit
            ? "Tissu mis à jour."
            : formData.get("is_active") === "on"
              ? "Tissu ajouté et mis en ligne."
              : "Tissu ajouté (brouillon, non visible en boutique).",
        );
        onOpenChange(false);
      } else if (res) {
        setError(res.error);
      }
    });
  }

  // Reset local state whenever the dialog is (re)opened for a given fabric.
  function handleOpenChange(next: boolean) {
    if (next) {
      setCategory(fabric?.category_slug ?? NONE);
      pick(null);
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le tissu" : "Ajouter un tissu"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations et le stock de ce tissu."
              : "Renseignez les informations du tissu à mettre en vente."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {fabric && <input type="hidden" name="id" value={fabric.id} />}
          {/* Falls back to the current swatch when the vendor doesn't re-pick one. */}
          <input
            type="hidden"
            name="image_url"
            value={fabric?.image_url ?? ""}
          />

          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="fabric-image">Photo du tissu</Label>
            <div className="flex items-center gap-3">
              <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg border">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex size-full items-center justify-center">
                    <ImagePlus className="size-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  id="fabric-image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => pick(e.target.files?.[0] ?? null)}
                  className="h-auto py-1.5"
                />
                <p className="text-muted-foreground text-xs">
                  {isEdit
                    ? "Laissez vide pour garder la photo actuelle."
                    : "JPEG, PNG ou WebP. La photo est redimensionnée automatiquement."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabric-name">Nom du tissu</Label>
            <Input
              id="fabric-name"
              name="name"
              required
              defaultValue={fabric?.name ?? ""}
              placeholder="Ex. Bazin Riche Blanc"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fabric-price">Prix / mètre ({CURRENCY})</Label>
              <Input
                id="fabric-price"
                name="price_per_meter"
                type="number"
                min={0}
                step={100}
                required
                defaultValue={fabric?.price_per_meter ?? ""}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric-stock">Stock (mètres)</Label>
              <Input
                id="fabric-stock"
                name="stock_meters"
                type="number"
                min={0}
                step={1}
                defaultValue={fabric?.stock_meters ?? ""}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as string)}
                items={itemsMap}
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
              <Label htmlFor="fabric-color">Couleur</Label>
              <Input
                id="fabric-color"
                name="color"
                defaultValue={fabric?.color ?? ""}
                placeholder="Ex. Bleu nuit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabric-material">Matière</Label>
            <Input
              id="fabric-material"
              name="material"
              defaultValue={fabric?.material ?? ""}
              placeholder="Ex. Coton, laine, lin…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabric-description">Description</Label>
            <Textarea
              id="fabric-description"
              name="description"
              rows={2}
              defaultValue={fabric?.description ?? ""}
              placeholder="Détails, tissage, usage recommandé…"
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={fabric ? fabric.is_active : true}
              className="accent-primary mt-0.5 size-4 rounded"
            />
            <span>
              Mettre en ligne dans la boutique
              <span className="text-muted-foreground block text-xs">
                Le tissu apparaît aussitôt dans le catalogue et peut être
                commandé. Décochez pour le garder en brouillon.
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
              {isEdit ? "Enregistrer" : "Ajouter le tissu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
