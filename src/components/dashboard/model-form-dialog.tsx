"use client";

import { useState, useTransition } from "react";
import { Check, ImagePlus, Loader2, MapPin, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";

import { AtelierFields } from "@/components/dashboard/atelier-form";
import { FabricFormDialog } from "@/components/dashboard/fabric-form-dialog";
import {
  draftBodyFitsToModel,
  ModelBodyFitEditor,
  rebaseDraftBodyFits,
  toDraftBodyFits,
  type DraftBodyFit,
} from "@/components/dashboard/model-body-fit-editor";
import {
  ModelStyleEditor,
  toDraftStyleGroups,
  type DraftStyleGroup,
} from "@/components/dashboard/model-style-editor";
import { saveModel, uploadModelStylePhoto } from "@/lib/actions/models";
import { modelPhotos } from "@/lib/constants";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import { modelBodyFitProblem } from "@/lib/model-body-fit";
import { careTipLines, MAX_CARE_TIPS_LENGTH, modelStyleProblem } from "@/lib/model-style";
import { CARE_TIP_SUGGESTIONS } from "@/lib/style-presets";
import { DeliveryZoneField } from "@/components/dashboard/delivery-zone-field";
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
import type {
  Fabric,
  FabricCategory,
  GarmentModel,
  ModelCategory,
  TailorAtelier,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  fabrics,
  fabricCategories,
  linkedFabricIds,
  atelier,
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
  /** Les tissus du tailleur : ceux qu'il peut proposer sur ce modèle. */
  fabrics: Fabric[];
  fabricCategories: FabricCategory[];
  /** Les tissus déjà cochés sur ce modèle. */
  linkedFabricIds: string[];
  /** Null : l'atelier n'est pas encore renseigné, le formulaire le demande. */
  atelier: TailorAtelier | null;
}) {
  const isEdit = Boolean(model);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(linkedFabricIds);
  // Ajout d'un tissu sans quitter le modèle en cours. La clé remet à zéro le
  // formulaire du tissu à chaque ouverture.
  const [fabricFormOpen, setFabricFormOpen] = useState(false);
  const [fabricFormSeq, setFabricFormSeq] = useState(0);

  function toggleFabric(id: string) {
    setSelectedFabrics((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

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
  // Le nom décide des détails proposés : pas de col pour un thiaya.
  const [modelName, setModelName] = useState(source?.name ?? "");
  // Le style est propre à chaque tailleur : une suggestion n'en apporte aucun.
  const [styleGroups, setStyleGroups] = useState<DraftStyleGroup[]>(() =>
    toDraftStyleGroups(model?.style_groups),
  );
  // Idem pour le métrage : une suggestion n'apporte que les intervalles de départ.
  const [bodyFits, setBodyFits] = useState<DraftBodyFit[]>(() =>
    toDraftBodyFits(model?.body_fits, source?.category_slug),
  );
  const [careTips, setCareTips] = useState(model?.care_tips ?? "");
  const [styleUpload, setStyleUpload] = useState<{ done: number; total: number } | null>(null);
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

  /**
   * Envoie les photos de style encore sur le téléphone, une à une. Chaque photo
   * envoyée est retenue : après une coupure de réseau, on repart de là où on était.
   * `null` : un envoi a échoué et l'erreur est affichée.
   */
  async function uploadStylePhotos(): Promise<DraftStyleGroup[] | null> {
    const total = styleGroups.flatMap((g) => g.options).filter((o) => o.file).length;
    let done = 0;
    if (total > 0) setStyleUpload({ done, total });

    try {
      const uploaded: DraftStyleGroup[] = [];
      for (const group of styleGroups) {
        const options = [];
        for (const option of group.options) {
          if (!option.file) {
            options.push(option);
            continue;
          }
          const image = await resizeImage(option.file);
          const body = new FormData();
          body.set("photo", image);
          const res = await uploadModelStylePhoto(body);
          if (!res.ok) {
            const message = `« ${option.name || group.name} » : ${res.error}`;
            setError(message);
            toast.error(message);
            return null;
          }
          if (option.preview) URL.revokeObjectURL(option.preview);
          const saved = { ...option, photo: res.url, file: undefined, preview: undefined };
          options.push(saved);
          setStyleGroups((prev) =>
            prev.map((g) =>
              g.slug === group.slug
                ? { ...g, options: g.options.map((o) => (o.slug === option.slug ? saved : o)) }
                : g,
            ),
          );
          done += 1;
          setStyleUpload({ done, total });
        }
        uploaded.push({ ...group, options });
      }
      return uploaded;
    } finally {
      setStyleUpload(null);
    }
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
    for (const id of selectedFabrics) formData.append("fabric_id", id);
    const items = photos;

    // Avant d'envoyer quoi que ce soit : une photo de style manque-t-elle ?
    if (formData.get("is_active") === "on") {
      const problem = modelStyleProblem(
        styleGroups.map((g) => ({
          slug: g.slug,
          name: g.name,
          options: g.options.map((o) => ({
            slug: o.slug,
            name: o.name,
            photo: o.preview ?? o.photo,
            extra: 0,
          })),
        })),
      );
      const fitProblem = modelBodyFitProblem(
        draftBodyFitsToModel(bodyFits),
        category === NONE ? null : category,
      );
      const firstProblem = problem ?? fitProblem;
      if (firstProblem) {
        // Le formulaire est long : l'erreur en haut peut être hors de vue.
        setError(firstProblem);
        toast.error(firstProblem);
        return;
      }
    }

    formData.set("body_fits", JSON.stringify(draftBodyFitsToModel(bodyFits)));

    startTransition(async () => {
      const uploadedStyle = await uploadStylePhotos();
      if (!uploadedStyle) return;
      formData.set(
        "style_groups",
        JSON.stringify(
          uploadedStyle.map((g) => ({
            slug: g.slug,
            name: g.name,
            options: g.options.map((o) => ({
              slug: o.slug,
              name: o.name,
              photo: o.photo,
              extra: Number(o.extra) || 0,
            })),
          })),
        ),
      );

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
        toast.error(res.error);
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

          {/* Les tissus que le tailleur a pour ce modèle : ce que le client choisit
              en « Tel quel ». Une grande photo à toucher, pas une liste à lire. */}
          <div className="space-y-2">
            <Label>Tissus disponibles pour ce modèle</Label>
            <p className="text-muted-foreground text-xs">
              Touchez les tissus et les couleurs que vous avez. Il en faut au moins
              un pour publier.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {fabrics.map((f) => {
                const active = selectedFabrics.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFabric(f.id)}
                    aria-pressed={active}
                    className={cn(
                      "min-w-0 overflow-hidden rounded-lg border-2 text-left transition-colors",
                      active ? "border-primary" : "border-border hover:border-primary/50",
                    )}
                  >
                    <span className="bg-muted relative block aspect-square">
                      {f.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.image_url} alt="" className="size-full object-cover" />
                      )}
                      {active && (
                        <span className="bg-primary text-primary-foreground absolute top-1 right-1 grid size-5 place-items-center rounded-full">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="block truncate px-1.5 py-1 text-xs font-medium">
                      {f.name}
                    </span>
                    {(!f.is_active || f.in_stock === false) && (
                      <span className="text-muted-foreground block truncate px-1.5 pb-1 text-[11px]">
                        {f.in_stock === false ? "Épuisé" : "Brouillon"}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setFabricFormSeq((n) => n + 1);
                  setFabricFormOpen(true);
                }}
                className="text-muted-foreground hover:bg-muted flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-1 text-center text-xs font-medium"
              >
                <Plus className="size-5" />
                Ajouter un tissu
              </button>
            </div>
          </div>

          {!atelier && (
            <div className="space-y-3 rounded-xl border p-3">
              <p className="flex items-start gap-2 text-sm font-medium">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                Où recevez-vous les tissus de vos clients ?
              </p>
              <p className="text-muted-foreground text-xs">
                Les vendeurs y envoient les tissus achetés ailleurs. Cette adresse
                reste privée.
              </p>
              <AtelierFields />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model-name">Nom du modèle</Label>
            <Input
              id="model-name"
              name="name"
              required
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Ex. Boubou brodé Dakar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v as string);
                  setBodyFits((prev) =>
                    rebaseDraftBodyFits(prev, v === NONE ? null : (v as string)),
                  );
                }}
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
            <Label htmlFor="model-price">Prix « à partir de » (FCFA)</Label>
            <Input
              id="model-price"
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={source?.price ?? ""}
              placeholder="25000"
            />
            <p className="text-muted-foreground text-xs">
              Le prix de départ affiché aux clients. Pris tel quel, ils le paient ;
              personnalisé, vous fixez le prix final par devis. Laissez vide pour
              utiliser votre tarif « à partir de » par défaut.
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

          <DeliveryZoneField defaultValue={model?.delivery_zone} />

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

          <ModelStyleEditor
            modelName={modelName}
            groups={styleGroups}
            onChange={setStyleGroups}
          />

          <ModelBodyFitEditor
            categorySlug={category === NONE ? null : category}
            fits={bodyFits}
            onChange={setBodyFits}
          />

          <div className="space-y-2">
            <Label htmlFor="model-care-tips">Vos recommandations</Label>
            <p className="text-muted-foreground text-xs">
              Comment le laver, ce qu&apos;il faut éviter… Une recommandation par ligne.
            </p>
            <Textarea
              id="model-care-tips"
              name="care_tips"
              rows={3}
              maxLength={MAX_CARE_TIPS_LENGTH}
              value={careTips}
              onChange={(e) => setCareTips(e.target.value)}
              placeholder="Ex. Ne pas mettre de parfum directement sur le tissu"
            />
            <div className="flex flex-wrap gap-2">
              {CARE_TIP_SUGGESTIONS.filter((tip) => !careTipLines(careTips).includes(tip)).map(
                (tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() =>
                      setCareTips((prev) => [...careTipLines(prev), tip].join("\n"))
                    }
                    className="hover:bg-muted flex items-center gap-1 rounded-full border px-3 py-1.5 text-left text-xs font-medium"
                  >
                    <Plus className="size-3 shrink-0" />
                    {tip}
                  </button>
                ),
              )}
            </div>
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
              {styleUpload
                ? `Photos ${styleUpload.done}/${styleUpload.total}…`
                : isEdit
                  ? "Enregistrer"
                  : "Ajouter le modèle"}
            </Button>
          </DialogFooter>
        </form>

        {/* Hors du <form> : un submit du tissu remonterait sinon jusqu'au modèle
            à travers le portail (les événements React suivent l'arbre React). */}
        <FabricFormDialog
          key={fabricFormSeq}
          open={fabricFormOpen}
          onOpenChange={setFabricFormOpen}
          fabric={null}
          categories={fabricCategories}
          onSaved={(id) => setSelectedFabrics((prev) => [...prev, id])}
        />
      </DialogContent>
    </Dialog>
  );
}
