"use client";

import { useState, useTransition } from "react";
import { Hand, ImagePlus, Loader2, MapPin, Plus, Ruler, Star, X, Zap } from "lucide-react";
import Link from "@/components/i18n/link";
import { toast } from "sonner";

import { AtelierFields } from "@/components/dashboard/atelier-form";
import { ReadyToWearField } from "@/components/dashboard/ready-to-wear-field";
import {
  ModelStyleEditor,
  toDraftStyleGroups,
  type DraftStyleGroup,
} from "@/components/dashboard/model-style-editor";
import { saveModel, uploadModelStylePhoto } from "@/lib/actions/models";
import { formatPrice, modelPhotos } from "@/lib/constants";
import {
  EUROPE_TYPES,
  eurToXof,
  MAKING_TYPES,
  xofToEur,
} from "@/lib/europe";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import {
  fitGroupFor,
  fitGroupLabel,
  tailorBodyFitProblem,
  type TailorBodyFits,
} from "@/lib/model-body-fit";
import { careTipLines, MAX_CARE_TIPS_LENGTH, modelStyleProblem } from "@/lib/model-style";
import { CARE_TIP_SUGGESTIONS } from "@/lib/style-presets";
import { catalogModelOf } from "@/lib/catalog-link";
import { garmentStyleKey, guessStyleBase } from "@/lib/style-options";
import { DeliveryZoneField } from "@/components/dashboard/delivery-zone-field";
import { DraftNotice } from "@/components/dashboard/draft-notice";
import type { FreeDeliveryZone } from "@/lib/delivery";
import { useFormDraft, useSavedDraft } from "@/lib/form-draft";
import { Button, buttonVariants } from "@/components/ui/button";
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
  QuoteMode,
  TailorAtelier,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

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

/** L'état React du formulaire qui n'est pas dans ses champs nommés. */
type ModelDraftExtra = {
  modelName: string;
  category: string;
  difficulty: string;
  catalogId: string;
  catalogTouched: boolean;
  styleGroups: DraftStyleGroup[];
  careTips: string;
  europeType: string;
  priceEur: string;
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
  const [difficulty, setDifficulty] = useState<string>(
    kept?.difficulty ?? source?.difficulty ?? NONE,
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
  const [catalogTouched, setCatalogTouched] = useState(
    kept?.catalogTouched ?? Boolean(model?.catalog_model_id),
  );
  // Le style est propre à chaque tailleur : une suggestion n'en apporte aucun.
  const [styleGroups, setStyleGroups] = useState<DraftStyleGroup[]>(
    () => kept?.styleGroups ?? toDraftStyleGroups(model?.style_groups),
  );
  const [careTips, setCareTips] = useState(kept?.careTips ?? model?.care_tips ?? "");
  const [europeType, setEuropeType] = useState<string>(
    kept?.europeType ?? model?.europe_type ?? "",
  );
  const [priceEur, setPriceEur] = useState<string>(
    kept?.priceEur ?? (source?.price != null ? String(xofToEur(source.price)) : ""),
  );
  // Les photos choisies sur le téléphone ne se gardent pas : seules les photos
  // déjà en ligne restent dans le brouillon.
  const { formRef, field, fieldAll, clear } = useFormDraft<ModelDraftExtra>(draftKey, saved, {
    modelName,
    category,
    difficulty,
    catalogId,
    catalogTouched,
    styleGroups: styleGroups.map((g) => ({
      ...g,
      options: g.options.map((o) => ({ slug: o.slug, name: o.name, extra: o.extra, photo: o.photo })),
    })),
    careTips,
    europeType,
    priceEur,
  });
  function startOver() {
    clear();
    onReset?.();
  }
  const [styleUpload, setStyleUpload] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryItems: Record<string, string> = {
    [NONE]: t("Aucune catégorie"),
    ...Object.fromEntries(categories.map((c) => [c.slug, c.name])),
  };
  const difficultyItems: Record<string, string> = {
    [NONE]: t("Non précisée"),
    ...Object.fromEntries(DIFFICULTIES.map((d) => [d.value, t(d.label)])),
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
      setError(t("Ajoutez au moins une photo du modèle."));
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("category_slug", category === NONE ? "" : category);
    formData.set("difficulty", difficulty === NONE ? "" : difficulty);
    formData.set("catalog_model_id", catalogId);
    // JALOFA EUROPE : le prix est saisi en euros, enregistré et payé en FCFA.
    if (europe) {
      const eur = Number(priceEur);
      formData.set("price", priceEur.trim() && Number.isFinite(eur) ? String(eurToXof(eur)) : "");
    }
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
      const fitProblem = tailorBodyFitProblem(
        model?.body_fits,
        bodyFits,
        category === NONE ? null : category,
      );
      const firstProblem = problem ?? fitProblem;
      if (firstProblem) {
        // Le formulaire est long : l'erreur en haut peut être hors de vue.
        setError(t(firstProblem));
        toast.error(t(firstProblem));
        return;
      }
    }


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

          <div className="space-y-2">
            <Label htmlFor="model-style-base">{t("Quel vêtement est-ce ?")}</Label>
            <select
              id="model-style-base"
              value={catalogId}
              onChange={(e) => {
                const id = e.target.value;
                setCatalogId(id);
                setCatalogTouched(true);
                // La catégorie suit le modèle du catalogue choisi.
                const picked = catalog.find((c) => c.id === id);
                if (picked?.category_slug && !europe) setCategory(picked.category_slug);
              }}
              className="border-input bg-background h-10 w-full rounded-lg border px-3 text-base md:text-sm"
            >
              <option value="">{t("Choisissez…")}</option>
              {catalogGroups(catalog, categories).map((g) => (
                <optgroup key={g.label} label={t(g.label)}>
                  {g.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {t(item.name)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              {catalogId
                ? t("Votre modèle s'affiche sur la page de ce vêtement, et vos clients le personnalisent avec nos dessins (col, manches, broderie…), en plus de vos photos de style.")
                : t("Obligatoire pour publier : choisissez le vêtement de notre catalogue le plus proche. Il ne s'y trouve pas ? Écrivez-nous avec « Une idée ? ».")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="model-days">{t("Confection (jours)")}</Label>
              <Input
                id="model-days"
                name="avg_days"
                type="number"
                min={1}
                max={365}
                step={1}
                defaultValue={field("avg_days") ?? source?.avg_days ?? 7}
                placeholder="7"
              />
            </div>
          </div>

          {europe && (
            <div className="space-y-4 rounded-xl border p-3">
              <p className="text-xs font-semibold tracking-[0.14em] uppercase">JALOFA EUROPE</p>
              <div className="space-y-2">
                <Label htmlFor="model-europe-type">{t("Catégorie JALOFA EUROPE")}</Label>
                <select
                  id="model-europe-type"
                  name="europe_type"
                  value={europeType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEuropeType(value);
                    // La catégorie européenne décide de la page Homme ou Femme.
                    const info = EUROPE_TYPES.find((x) => x.value === value);
                    if (info) {
                      setCategory(info.category);
                    }
                  }}
                  className="border-input bg-background h-10 w-full rounded-lg border px-3 text-base md:text-sm"
                >
                  <option value="">{t("Choisissez…")}</option>
                  {EUROPE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {t(type.label)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-material">{t("Matière et tissu")}</Label>
                <Input
                  id="model-material"
                  name="material"
                  maxLength={160}
                  defaultValue={field("material") ?? source?.material ?? ""}
                  placeholder={t("Ex. Laine Super 120s, Biella")}
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("Confection")}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MAKING_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="has-[:checked]:border-primary has-[:checked]:ring-primary/30 flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:ring-2"
                    >
                      <input
                        type="radio"
                        name="making_type"
                        value={type.value}
                        defaultChecked={(field("making_type") ?? source?.making_type ?? "les_deux") === type.value}
                        className="accent-primary size-4"
                      />
                      {t(type.label)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="model-sizes">{t("Tailles disponibles (prêt-à-porter)")}</Label>
                <Input
                  id="model-sizes"
                  name="sizes"
                  maxLength={120}
                  defaultValue={field("sizes") ?? source?.sizes ?? ""}
                  placeholder={t("Ex. 46 à 56, ou S, M, L, XL")}
                />
              </div>
            </div>
          )}

          {europe ? (
            <div className="space-y-2">
              <Label htmlFor="model-price-eur">{t("Prix « à partir de » (€)")}</Label>
              <Input
                id="model-price-eur"
                type="number"
                min={0}
                step={1}
                value={priceEur}
                onChange={(e) => setPriceEur(e.target.value)}
                placeholder="450"
              />
              <p className="text-muted-foreground text-xs">
                {priceEur.trim() && Number.isFinite(Number(priceEur))
                  ? t("Soit {price} : les clients voient les deux prix et paient en FCFA.", {
                      price: formatPrice(eurToXof(Number(priceEur))),
                    })
                  : t("Les clients voient le prix en euros et en FCFA, et paient en FCFA.")}
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

          <QuoteModeField source={source} field={field} />

          <div className="space-y-2">
            <Label>{t("Difficulté")}</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as string)}
              items={difficultyItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("Non précisée")}</SelectItem>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {t(d.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DeliveryZoneField
            defaultValue={(field("delivery_zone") as FreeDeliveryZone | undefined) ?? model?.delivery_zone}
            europe={europe}
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

          <ModelStyleEditor
            modelName={modelName}
            groups={styleGroups}
            onChange={setStyleGroups}
          />

          <BodyFitsNotice
            ready={
              !tailorBodyFitProblem(
                model?.body_fits,
                bodyFits,
                category === NONE ? null : category,
              )
            }
            group={fitGroupLabel(fitGroupFor(category === NONE ? null : category))}
          />

          <div className="space-y-2">
            <Label htmlFor="model-care-tips">{t("Vos recommandations")}</Label>
            <p className="text-muted-foreground text-xs">
              {t("Comment le laver, ce qu'il faut éviter… Une recommandation par ligne.")}
            </p>
            <Textarea
              id="model-care-tips"
              name="care_tips"
              rows={3}
              maxLength={MAX_CARE_TIPS_LENGTH}
              value={careTips}
              onChange={(e) => setCareTips(e.target.value)}
              placeholder={t("Ex. Ne pas mettre de parfum directement sur le tissu")}
            />
            <div className="flex flex-wrap gap-2">
              {CARE_TIP_SUGGESTIONS.map((tip) => t(tip)).filter((tip) => !careTipLines(careTips).includes(tip)).map(
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
              defaultChecked={saved ? field("is_active") === "on" : model ? model.is_active : true}
              className="accent-primary mt-0.5 size-4 rounded"
            />
            <span>
              {t("Publier dans le catalogue")}
              <span className="text-muted-foreground block text-xs">
                {t("Le modèle apparaît dans /modeles et vous êtes automatiquement le tailleur des commandes passées dessus. Décochez pour le garder en brouillon.")}
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {styleUpload
                ? `${t("Photos")} ${styleUpload.done}/${styleUpload.total}…`
                : isEdit
                  ? t("Enregistrer")
                  : t("Ajouter le modèle")}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}

/**
 * Devis manuel ou automatique. En automatique, le tailleur fixe une fois son
 * prix, sa livraison et son délai : chaque demande de devis sur ce modèle reçoit
 * ce devis tout de suite (plus les suppléments des choix du client).
 */
function QuoteModeField({
  source,
  field,
}: {
  source: GarmentModel | null;
  /** Valeur reprise du brouillon, s'il y en a un. */
  field: (name: string) => string | undefined;
}) {
  const t = useT();
  const [mode, setMode] = useState<QuoteMode>(
    (field("quote_mode") ?? source?.quote_mode) === "auto" ? "auto" : "manual",
  );
  const choices: { value: QuoteMode; title: string; hint: string; icon: typeof Hand }[] = [
    {
      value: "manual",
      title: "Devis manuel",
      hint: "Vous lisez chaque demande et vous fixez le prix et le délai.",
      icon: Hand,
    },
    {
      value: "auto",
      title: "Devis automatique",
      hint: "Prix fixe : le client reçoit tout de suite le prix, la livraison et le délai.",
      icon: Zap,
    },
  ];

  return (
    <fieldset className="space-y-3 rounded-xl border p-3">
      <legend className="px-1 text-sm font-medium">{t("Devis")}</legend>
      <input type="hidden" name="quote_mode" value={mode} />
      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((c) => {
          const Icon = c.icon;
          const active = mode === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setMode(c.value)}
              aria-pressed={active}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                active ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted/50",
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block font-semibold">{t(c.title)}</span>
                <span className="text-muted-foreground block text-xs">{t(c.hint)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Toujours dans le formulaire : rebasculer en manuel garde les montants. */}
      <div className={cn("grid gap-3 sm:grid-cols-3", mode !== "auto" && "hidden")}>
        <div className="space-y-2">
          <Label htmlFor="model-quote-price">{t("Prix fixe (FCFA)")}</Label>
          <Input
            id="model-quote-price"
            name="quote_price"
            type="number"
            min={1}
            step={1}
            required={mode === "auto"}
            defaultValue={field("quote_price") ?? source?.quote_price ?? source?.price ?? ""}
            placeholder="35000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model-quote-delivery">{t("Livraison (FCFA)")}</Label>
          <Input
            id="model-quote-delivery"
            name="quote_delivery_fee"
            type="number"
            min={0}
            step={1}
            defaultValue={field("quote_delivery_fee") ?? source?.quote_delivery_fee ?? 0}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model-quote-days">{t("Prête en (jours)")}</Label>
          <Input
            id="model-quote-days"
            name="quote_ready_days"
            type="number"
            min={1}
            max={120}
            step={1}
            required={mode === "auto"}
            defaultValue={field("quote_ready_days") ?? source?.quote_ready_days ?? source?.avg_days ?? 7}
            placeholder="7"
          />
        </div>
        <p className="text-muted-foreground text-xs sm:col-span-3">
          {t("Les suppléments de vos choix de style s'ajoutent au prix fixe. Livraison à 0 = gratuite. Vous pouvez toujours modifier un devis tant que le client n'a pas payé.")}
        </p>
      </div>
    </fieldset>
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

/** Le catalogue rangé comme sur le site : Homme, Femme…, puis JALOFA EUROPE. */
function catalogGroups(
  catalog: GarmentModel[],
  categories: ModelCategory[],
): { label: string; items: GarmentModel[] }[] {
  const groups = new Map<string, GarmentModel[]>();
  for (const m of catalog) {
    const label = m.europe_type
      ? "JALOFA EUROPE"
      : (categories.find((c) => c.slug === m.category_slug)?.name ?? "Autres");
    groups.set(label, [...(groups.get(label) ?? []), m]);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

/**
 * Les mètres de tissu ne se remplissent plus ici : ils viennent de « Mes
 * métrages », écrits une fois pour tous les modèles.
 */
function BodyFitsNotice({ ready, group }: { ready: boolean; group: string }) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        !ready && "border-amber-500/50 bg-amber-500/10",
      )}
    >
      <Ruler className="text-muted-foreground size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("Mètres de tissu")}</p>
        <p className="text-muted-foreground text-xs">
          {ready
            ? `${t("Repris de « Mes métrages »")} (${t(group)}).`
            : `${t("Remplissez « Mes métrages »")} (${t(group)}) ${t("une seule fois : ils valent pour tous vos modèles.")}`}
        </p>
      </div>
      <Link
        href="/tailleur/espace/metrages"
        className={buttonVariants({ variant: ready ? "ghost" : "default", size: "sm" })}
      >
        {ready ? t("Modifier") : t("Remplir")}
      </Link>
    </div>
  );
}
