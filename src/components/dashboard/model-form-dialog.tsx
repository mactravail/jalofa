"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, MapPin, Star, X } from "lucide-react";
import { toast } from "sonner";

import { AtelierFields } from "@/components/dashboard/atelier-form";
import { ReadyToWearField } from "@/components/dashboard/ready-to-wear-field";
import { saveModel } from "@/lib/actions/models";
import { formatPrice, modelPhotos } from "@/lib/constants";
import { xofToEur } from "@/lib/europe";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import {
  tailorBodyFitProblem,
  type TailorBodyFits,
} from "@/lib/model-body-fit";
import { catalogModelOf } from "@/lib/catalog-link";
import { garmentStyleKey, guessStyleBase } from "@/lib/style-options";
import { DeliveryZoneField } from "@/components/dashboard/delivery-zone-field";
import { DraftNotice } from "@/components/dashboard/draft-notice";
import { MODEL_DELIVERY_ZONES, type FreeDeliveryZone } from "@/lib/delivery";
import { useFormDraft, useSavedDraft } from "@/lib/form-draft";
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
  GarmentModel,
  ModelCategory,
  TailorAtelier,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

const NONE = "__none__";
const MAX_PHOTOS = 5;
// Total resized payload kept under `serverActions.bodySizeLimit` (4 Mo) with a
// margin for the multipart overhead of five parts.
const TOTAL_BUDGET = 3.6 * 1024 * 1024;

// A photo already saved on the model, or a freshly picked file carrying the
// object URL used to preview it (revoked when the photo is replaced/removed).
type Photo =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; url: string };

/** L'état React du formulaire qui n'est pas dans ses champs nommés. */
type ModelDraftExtra = {
  modelName: string;
  category: string;
  catalogId: string;
  catalogTouched: boolean;
  priceXof: string;
};

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
  catalog = [],
  atelier,
  bodyFits = {},
  europe = false,
  onSaved,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Après un enregistrement réussi : le parent repart d'un formulaire vierge. */
  onSaved?: () => void;
  /** « Recommencer » : le parent remonte un formulaire vierge. */
  onReset?: () => void;
  /** Le modèle édité (mode « Modifier »). Null en création. */
  model: GarmentModel | null;
  /**
   * Un modèle du catalogue plateforme qui pré-remplit le formulaire en création :
   * le tailleur s'approprie une suggestion. On ne reprend jamais son `id` — la
   * sauvegarde crée toujours une nouvelle ligne à son nom.
   */
  suggestion?: GarmentModel | null;
  categories: ModelCategory[];
  /**
   * Le catalogue JALOFA (`tailor_id` null) : chaque création est rangée sous un
   * de ces modèles, et s’affiche sur sa page.
   */
  catalog?: GarmentModel[];
  /** Null : l'atelier n'est pas encore renseigné, le formulaire le demande. */
  atelier: TailorAtelier | null;
  /** « Mes métrages » du tailleur : ils valent pour ce modèle. */
  bodyFits?: TailorBodyFits;
  /**
   * Atelier installé en Europe (JALOFA EUROPE) : catégorie européenne, matière,
   * confection, tailles, et un prix saisi en euros (enregistré en FCFA).
   */
  europe?: boolean;
}) {
  const isEdit = Boolean(model);
  const t = useT();

  // Édition : la fiche du tailleur. Création : soit vierge, soit pré-remplie
  // depuis une suggestion. Dans les deux cas de création, aucun `id` n'est posé.
  const source = model ?? suggestion ?? null;
  // Brouillon gardé dans le navigateur, propre à ce modèle ou à cette suggestion.
  const draftKey = `model:${model?.id ?? (suggestion ? `s-${suggestion.id}` : "new")}`;
  const saved = useSavedDraft<ModelDraftExtra>(draftKey);
  const kept = saved?.extra;
  const [category, setCategory] = useState<string>(
    kept?.category ?? source?.category_slug ?? NONE,
  );
  // Photos : seulement celles du tailleur. Une suggestion n'apporte jamais sa
  // photo — sinon tous les tailleurs garderaient la même couverture.
  const [photos, setPhotos] = useState<Photo[]>(() => initialPhotos(model));
  // Le nom décide des détails proposés : pas de col pour un thiaya.
  const [modelName, setModelName] = useState(kept?.modelName ?? source?.name ?? "");
  // Le vêtement du catalogue dont le modèle reprend les planches dessinées : le
  // nom peut être celui du tailleur, c'est ce choix qui ouvre la personnalisation.
  const [catalogId, setCatalogId] = useState<string>(
    () => kept?.catalogId ?? initialCatalogId(model, suggestion, catalog),
  );
  const [catalogTouched] = useState(
    kept?.catalogTouched ?? Boolean(model?.catalog_model_id),
  );
  const [priceXof, setPriceXof] = useState<string>(
    kept?.priceXof ?? (source?.price != null ? String(source.price) : ""),
  );
  // Les photos choisies sur le téléphone ne se gardent pas : seules les photos
  // déjà en ligne restent dans le brouillon.
  const { formRef, field, fieldAll, clear } = useFormDraft<ModelDraftExtra>(draftKey, saved, {
    modelName,
    category,
    catalogId,
    catalogTouched,
    priceXof,
  });
  function startOver() {
    clear();
    onReset?.();
  }
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryItems: Record<string, string> = {
    [NONE]: t("Aucune catégorie"),
    ...Object.fromEntries(categories.map((c) => [c.slug, c.name])),
  };
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
        toast.info(t("Maximum {n} photos — les suivantes ont été ignorées.", { n: MAX_PHOTOS }));
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
      setError(t("Ajoutez au moins une photo du modèle."));
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("category_slug", category === NONE ? "" : category);
    // Le vêtement du catalogue n'est plus demandé : on le devine d'après le nom.
    // Rien de deviné → on n'envoie rien, la publication n'est pas bloquée.
    if (catalogId) formData.set("catalog_model_id", catalogId);
    const items = photos;

    // Avant d'envoyer quoi que ce soit : une photo de style manque-t-elle ?
    if (formData.get("is_active") === "on") {
      const fitProblem = tailorBodyFitProblem(
        model?.body_fits,
        bodyFits,
        category === NONE ? null : category,
      );
      const firstProblem = fitProblem;
      if (firstProblem) {
        // Le formulaire est long : l'erreur en haut peut être hors de vue.
        setError(t(firstProblem));
        toast.error(t(firstProblem));
        return;
      }
    }


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
          setError(t("Une photo est trop lourde. Choisissez-en une plus légère."));
          return;
        }
        total += image.size;
        formData.append("photo", image);
      }
      if (total > TOTAL_BUDGET) {
        setError(
          t("Vos photos sont trop lourdes au total. Retirez-en une ou choisissez des images plus légères."),
        );
        return;
      }

      const res = await saveModel(null, formData);
      if (res?.ok) {
        clear();
        toast.success(
          isEdit
            ? t("Modèle mis à jour.")
            : formData.get("is_active") === "on"
              ? t("Modèle ajouté et publié dans le catalogue.")
              : t("Modèle ajouté (brouillon, non visible au catalogue)."),
        );
        onSaved?.();
        onOpenChange(false);
      } else if (res) {
        setError(t(res.error));
        toast.error(t(res.error));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md" keepMounted>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("Modifier le modèle") : t("Ajouter un modèle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("Mettez à jour la fiche de votre création.")
              : suggestion
                ? t("Vous partez de « {name} ». Ajustez la fiche, elle sera publiée à votre nom.", { name: suggestion.name })
                : t("Présentez une de vos créations. Les clients qui la choisissent vous sont adressés directement.")}
          </DialogDescription>
        </DialogHeader>

        {saved && <DraftNotice onStartOver={startOver} />}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {model && <input type="hidden" name="id" value={model.id} />}

          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label>{t("Photos du modèle")}</Label>
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
                    aria-label={t("Retirer la photo")}
                    className="bg-background/85 text-foreground hover:bg-background absolute top-1 right-1 grid size-5 place-items-center rounded-full shadow-sm"
                  >
                    <X className="size-3" />
                  </button>

                  {i === 0 ? (
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-medium text-white">
                      {t("Couverture")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      aria-label={t("Définir comme couverture")}
                      title={t("Définir comme couverture")}
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
                  {t("Ajouter")}
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
              {t("Jusqu'à {n} photos (JPEG, PNG ou WebP), redimensionnées automatiquement. La première est la couverture affichée dans le catalogue.", { n: MAX_PHOTOS })}
            </p>
          </div>

          {/* « Tel quel » = prêt-à-porter : déjà cousu, et en quelles couleurs. */}
          <ReadyToWearField
            defaultOn={saved ? field("ready_to_wear") === "on" : (source?.ready_to_wear ?? false)}
            defaultColors={fieldAll("ready_colors") ?? source?.ready_colors ?? []}
            defaultPrices={
              saved
                ? parseJson<Record<string, number>>(field("ready_color_prices")) ?? {}
                : (source?.ready_color_prices ?? {})
            }
            defaultImages={
              saved
                ? parseJson<Record<string, string>>(field("ready_color_images")) ?? {}
                : (model?.ready_color_images ?? {})
            }
          />

          {!atelier && (
            <div className="space-y-3 rounded-xl border p-3">
              <p className="flex items-start gap-2 text-sm font-medium">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {t("Où recevez-vous les tissus de vos clients ?")}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("Les vendeurs y envoient les tissus achetés ailleurs. Cette adresse reste privée.")}
              </p>
              <AtelierFields
                atelier={
                  saved
                    ? { address: field("atelier_address") ?? "", phone: field("atelier_phone") ?? "" }
                    : null
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model-name">{t("Nom du modèle")}</Label>
            <Input
              id="model-name"
              name="name"
              required
              value={modelName}
              onChange={(e) => {
                setModelName(e.target.value);
                // Tant que le tailleur n'a pas choisi lui-même, on suit le nom.
                if (!catalogTouched) {
                  const guess = guessCatalogModel(
                    e.target.value,
                    category === NONE ? null : category,
                    catalog,
                  );
                  if (guess) setCatalogId(guess.id);
                }
              }}
              placeholder={t("Ex. Boubou brodé Dakar")}
            />
          </div>

          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("Catégorie")}</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v as string);
                }}
                items={categoryItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("Aucune catégorie")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {t(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {europe ? (
            <div className="space-y-2">
              <Label htmlFor="model-price">{t("Prix « à partir de » (FCFA)")}</Label>
              <Input
                id="model-price"
                name="price"
                type="number"
                min={0}
                step={1}
                value={priceXof}
                onChange={(e) => setPriceXof(e.target.value)}
                placeholder="295000"
              />
              <p className="text-muted-foreground text-xs">
                {priceXof.trim() && Number.isFinite(Number(priceXof))
                  ? t("Soit environ {price} € : les clients voient les deux prix et paient en FCFA.", {
                      price: xofToEur(Number(priceXof)),
                    })
                  : t("Les clients voient le prix en FCFA et en euros, et paient en FCFA.")}
              </p>
            </div>
          ) : (
          <div className="space-y-2">
            <Label htmlFor="model-price">{t("Prix « à partir de » (FCFA)")}</Label>
            <Input
              id="model-price"
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={field("price") ?? source?.price ?? ""}
              placeholder="25000"
            />
            <p className="text-muted-foreground text-xs">
              {t("Le prix de départ affiché aux clients. En prêt-à-porter (« tel quel »), c'est le prix payé ; personnalisé, vous fixez le prix final par devis.")}
            </p>
          </div>
          )}

          <DeliveryZoneField
            defaultValue={(field("delivery_zone") as FreeDeliveryZone | undefined) ?? model?.delivery_zone}
            options={MODEL_DELIVERY_ZONES}
          />

          <div className="space-y-2">
            <Label htmlFor="model-description">{t("Description")}</Label>
            <Textarea
              id="model-description"
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={field("description") ?? source?.description ?? ""}
              placeholder={t("Coupe, finitions, occasion…")}
            />
            <p className="text-muted-foreground text-xs">
              {t("Le client lit ce texte tel quel sur la fiche du modèle.")}
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={saved ? field("is_active") === "on" : model ? model.is_active : true}
              className="accent-primary mt-0.5 size-4 rounded"
            />
            <span>
              {t("Publier dans le catalogue")}
              <span className="text-muted-foreground block text-xs">
                {t("Décochez pour le garder en brouillon.")}
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
              {t("Annuler")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={cn(!isEdit && "bg-emerald-600 font-semibold text-white hover:bg-emerald-700")}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("Enregistrer") : t("Publier")}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}

function parseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Le modèle du catalogue sous lequel ranger la création : celui enregistré,
 * sinon la suggestion reprise, sinon ce que le nom désigne déjà.
 */
function initialCatalogId(
  model: GarmentModel | null,
  suggestion: GarmentModel | null,
  catalog: GarmentModel[],
): string {
  if (model?.catalog_model_id) return model.catalog_model_id;
  if (model) return catalogModelOf(model, catalog)?.id ?? "";
  if (suggestion && suggestion.tailor_id === null) return suggestion.id;
  return "";
}

/** Le modèle du catalogue que désigne un nom (« Boubou brodé » → Grand boubou). */
function guessCatalogModel(
  name: string,
  categorySlug: string | null,
  catalog: GarmentModel[],
): GarmentModel | null {
  const key = guessStyleBase(name, categorySlug);
  if (!key) return null;
  return catalog.find((c) => garmentStyleKey(c) === key) ?? null;
}

