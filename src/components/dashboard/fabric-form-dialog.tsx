"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveFabric } from "@/lib/actions/fabrics";
import { useFormDraft, useSavedDraft } from "@/lib/form-draft";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import { DeliveryZoneField } from "@/components/dashboard/delivery-zone-field";
import { DraftNotice } from "@/components/dashboard/draft-notice";
import { FabricColorPicker } from "@/components/dashboard/fabric-color-picker";
import { fabricColorHex, parseFabricColors } from "@/lib/fabric-colors";
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
import { CURRENCY, formatPrice } from "@/lib/constants";
import { eurToXof, xofToEur } from "@/lib/europe";
import {
  BRAND_SUGGESTIONS,
  CARE_INSTRUCTIONS,
  DRAPES,
  OPACITIES,
  PATTERNS,
  SALES_UNITS,
  SALES_UNIT_KEYS,
  STRETCHES,
  USAGES,
  WEIGHTS,
  fabricUnitPrice,
  parseSalesUnit,
  type SalesUnit,
} from "@/lib/fabric-specs";
import type { FreeDeliveryZone } from "@/lib/delivery";
import type { Fabric, FabricCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

const NONE = "__none__";

/** Formats acceptés par le stockage (cf. `uploadImage`). */
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
/** Marge sous la limite de 4 Mo d'une Server Action (texte du formulaire compris). */
const MAX_BODY_PHOTOS_BYTES = 3.5 * 1024 * 1024;

type Picked = { file: File; url: string } | null;

/** L'état React du formulaire qui n'est pas dans ses champs nommés. */
type FabricDraftExtra = {
  category: string;
  unit: SalesUnit;
  priceEur: string;
  colorPrices: Record<string, string>;
};

export function FabricFormDialog({
  open,
  onOpenChange,
  fabric,
  categories,
  onSaved,
  onReset,
  europe = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric: Fabric | null;
  categories: FabricCategory[];
  /** Appelé avec l'id du tissu une fois enregistré. */
  onSaved?: (fabricId: string) => void;
  /** « Recommencer » : le parent remonte un formulaire vierge. */
  onReset?: () => void;
  /** Boutique en Europe (JALOFA EUROPE) : prix saisi en €, livraison « Europe ». */
  europe?: boolean;
}) {
  const draftKey = `fabric:${fabric?.id ?? "new"}`;
  const saved = useSavedDraft<FabricDraftExtra>(draftKey);
  const initialUnitPrice = fabric ? fabricUnitPrice(fabric) : null;
  const [priceEur, setPriceEur] = useState<string>(
    saved?.extra.priceEur ??
      (initialUnitPrice != null ? String(xofToEur(initialUnitPrice)) : ""),
  );
  const isEdit = Boolean(fabric);
  const t = useT();
  const [category, setCategory] = useState<string>(
    saved?.extra.category ?? fabric?.category_slug ?? NONE,
  );
  const [unit, setUnit] = useState<SalesUnit>(
    saved?.extra.unit ?? parseSalesUnit(fabric?.sales_unit),
  );
  // File + its preview URL move together so the URL is revoked on replacement.
  const [picked, setPicked] = useState<Picked>(null);
  const [pickedDetail, setPickedDetail] = useState<Picked>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Par couleur, facultatif : un prix différent et/ou une photo.
  const [colorList, setColorList] = useState<string[]>(() =>
    parseFabricColors(saved ? (saved.fields.color?.[0] ?? "") : fabric?.color),
  );
  const [colorPrices, setColorPrices] = useState<Record<string, string>>(
    () => saved?.extra.colorPrices ?? initialColorPrices(fabric, europe),
  );
  // Brouillon gardé dans le navigateur : page rechargée ou quittée par erreur,
  // on reprend là où on en était (sauf les photos).
  const { formRef, field, fieldAll, clear } = useFormDraft<FabricDraftExtra>(draftKey, saved, {
    category,
    unit,
    priceEur,
    colorPrices,
  });
  function startOver() {
    clear();
    onReset?.();
  }
  const [colorFiles, setColorFiles] = useState<Record<string, Picked>>({});

  function pickColorFile(color: string, next: File | null) {
    setColorFiles((m) => {
      const prev = m[color];
      if (prev) URL.revokeObjectURL(prev.url);
      return { ...m, [color]: next ? { file: next, url: URL.createObjectURL(next) } : null };
    });
  }

  /** Ce qui part au serveur : prix (FCFA) et photo déjà en ligne, par couleur. */
  const variantsJson = JSON.stringify(
    Object.fromEntries(
      colorList.map((c) => {
        const raw = Number(String(colorPrices[c] ?? "").replace(",", "."));
        const price = Number.isFinite(raw) && raw > 0 ? (europe ? eurToXof(raw) : Math.round(raw)) : null;
        return [c, { price, image_url: fabric?.color_variants?.[c]?.image_url ?? null }];
      }),
    ),
  );

  const file = picked?.file ?? null;
  const detailFile = pickedDetail?.file ?? null;
  const preview = picked?.url ?? fabric?.image_url ?? null;
  const detailPreview = pickedDetail?.url ?? fabric?.detail_image_url ?? null;
  const per = t(SALES_UNITS[unit].per);

  const itemsMap: Record<string, string> = {
    [NONE]: t("Choisir…"),
    ...Object.fromEntries(categories.map((c) => [c.slug, t(c.name)])),
  };

  function pick(next: File | null) {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(next ? { file: next, url: URL.createObjectURL(next) } : null);
  }
  function pickDetail(next: File | null) {
    if (pickedDetail) URL.revokeObjectURL(pickedDetail.url);
    setPickedDetail(next ? { file: next, url: URL.createObjectURL(next) } : null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!file && !fabric?.image_url) {
      setError(t("Ajoutez une photo du tissu."));
      return;
    }
    if (!detailFile && !fabric?.detail_image_url) {
      setError(t("Ajoutez une 2e photo : un gros plan sur le tissage."));
      return;
    }

    // La catégorie est obligatoire : l'acheteur doit savoir ce qu'il achète.
    if (category === NONE) {
      setError(t("Choisissez la catégorie du tissu."));
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("category_slug", category === NONE ? "" : category);

    // Couleur et motif obligatoires ; « Toucher & tombé », « Entretien &
    // usages » et la finition sont facultatifs.
    const missing = (
      [
        ["color", "Choisissez au moins une couleur."],
        ["pattern", "Choisissez le motif."],
      ] as const
    ).find(([field]) => !String(formData.get(field) ?? "").trim());
    if (missing) {
      setError(t(missing[1]));
      return;
    }

    startTransition(async () => {
      // Une erreur levée ici (photo illisible, envoi refusé, réseau) remonterait
      // jusqu'à la page et l'écran « This page couldn't load » : on l'attrape.
      try {
        await submitFabric(formData);
      } catch {
        setError(t("L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez avec des photos plus légères."));
      }
    });
  }

  async function submitFabric(formData: FormData) {
    // Shrink here rather than server-side: a raw phone shot exceeds the
    // Server Action body limit and would be rejected before upload.
    let total = 0;
    const tooHeavy = t("Cette photo est trop lourde. Choisissez-en une plus légère.");
    const unreadable = t("Cette photo ne peut pas être lue. Choisissez une photo JPEG ou PNG.");
    const prepare = async (f: File) => {
      const image = await resizeImage(f);
      if (!ACCEPTED_TYPES.has(image.type)) return unreadable;
      if (image.size > MAX_UPLOAD_BYTES) return tooHeavy;
      total += image.size;
      return image;
    };
    for (const [field, f] of [
      ["image", file],
      ["detail_image", detailFile],
    ] as const) {
      if (!f) continue;
      const image = await prepare(f);
      if (typeof image === "string") {
        setError(image);
        return;
      }
      formData.set(field, image);
    }
    // Photos par couleur : le fichier et sa couleur partent dans le même ordre.
    for (const c of colorList) {
      const f = colorFiles[c]?.file;
      if (!f) continue;
      const image = await prepare(f);
      if (typeof image === "string") {
        setError(image);
        return;
      }
      formData.append("color_image", image);
      formData.append("color_image_for", c);
    }
    // Toutes les photos partent ensemble : au-delà de la limite, le serveur
    // refuserait l'envoi en bloc.
    if (total > MAX_BODY_PHOTOS_BYTES) {
      setError(t("Vos photos sont trop lourdes ensemble. Retirez des photos de couleur ou choisissez des photos plus légères."));
      return;
    }

    const res = await saveFabric(null, formData);
    if (res?.ok) {
      clear();
      toast.success(
        isEdit
          ? t("Tissu mis à jour.")
          : formData.get("is_active") === "on"
            ? t("Tissu ajouté et mis en ligne.")
            : t("Tissu ajouté (brouillon, non visible en boutique)."),
      );
      if (res.id) onSaved?.(res.id);
      onOpenChange(false);
    } else if (res) {
      setError(t(res.error));
    }
  }

  // Brouillon : fermer (clic à côté, Échap, croix) ne vide rien. Le contenu reste
  // monté et le parent ne le remonte qu'au changement de tissu ou après l'envoi.
  const k = fabric?.id ?? "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-2xl" keepMounted>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Modifier le tissu") : t("Ajouter un tissu")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("Mettez à jour les informations de ce tissu.")
              : t("Renseignez les informations du tissu à mettre en vente.")}{" "}
            {t("Les champs marqués « facultatif » peuvent rester vides.")}
          </DialogDescription>
        </DialogHeader>

        {saved && <DraftNotice onStartOver={startOver} />}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" key={k}>
          {fabric && <input type="hidden" name="id" value={fabric.id} />}
          {/* Falls back to the current swatches when the vendor doesn't re-pick them. */}
          <input type="hidden" name="image_url" value={fabric?.image_url ?? ""} />
          <input type="hidden" name="detail_image_url" value={fabric?.detail_image_url ?? ""} />

          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {t(error)}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="fabric-name">{t("Nom du tissu")}</Label>
            <Input
              id="fabric-name"
              name="name"
              required
              defaultValue={field("name") ?? fabric?.name ?? ""}
              placeholder={t("Ex. Bazin Riche Blanc")}
            />
          </div>

          {/* 1. Vente & dimensions */}
          <Section n={1} title={t("Vente & dimensions")}>
            <div className="space-y-2">
              <Label>{t("Vendu")}</Label>
              <Chips
                name="sales_unit"
                options={SALES_UNIT_KEYS.map((u) => ({ value: u, label: t(SALES_UNITS[u].label) }))}
                value={unit}
                onChange={(v) => setUnit(v as SalesUnit)}
              />
            </div>

            <div className="space-y-2">
              {europe ? (
                <>
                  <Label htmlFor="fabric-price">
                    {t("Prix")} / {per} (€)
                  </Label>
                  <Input
                    id="fabric-price"
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={priceEur}
                    onChange={(e) => setPriceEur(e.target.value)}
                    placeholder="0"
                  />
                  {/* Enregistré et payé en FCFA : c'est la devise de JALOFA. */}
                  <input
                    type="hidden"
                    name="price_per_unit"
                    value={priceEur.trim() ? String(eurToXof(Number(priceEur) || 0)) : ""}
                  />
                  {priceEur.trim() && (
                    <p className="text-muted-foreground text-xs">
                      {t("Soit {price}", { price: formatPrice(eurToXof(Number(priceEur) || 0)) })} / {per}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Label htmlFor="fabric-price">
                    {t("Prix")} / {per} ({CURRENCY})
                  </Label>
                  <Input
                    id="fabric-price"
                    name="price_per_unit"
                    type="number"
                    min={0}
                    step={1}
                    required
                    defaultValue={field("price_per_unit") ?? initialUnitPrice ?? ""}
                    placeholder="0"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fabric-width">{t("Laize (cm)")}</Label>
                <Input
                  id="fabric-width"
                  name="width_cm"
                  type="number"
                  min={30}
                  max={400}
                  step={1}
                  required
                  defaultValue={field("width_cm") ?? fabric?.width_cm ?? ""}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fabric-min">{t("Minimum")}</Label>
                <Input
                  id="fabric-min"
                  name="min_order_qty"
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.5}
                  required
                  defaultValue={field("min_order_qty") ?? fabric?.min_order_qty ?? 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fabric-stock">{t("Stock")}</Label>
                <Input
                  id="fabric-stock"
                  name="stock_quantity"
                  type="number"
                  min={isEdit ? 0 : 0.5}
                  step={0.5}
                  required
                  defaultValue={field("stock_quantity") ?? (fabric ? (fabric.stock_meters ?? 0) : "")}
                  placeholder="50"
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              {t("Laize = largeur du tissu. Standard Wax : 115 cm, Lin/Coton/Bazin : 140-150 cm.")}{" "}
              {t("Minimum et stock en {unit}.", { unit: t(SALES_UNITS[unit].many) })}
            </p>
          </Section>

          {/* 2. Matière & origine */}
          <Section n={2} title={t("Matière & origine")}>
            <div className="space-y-2">
              <Label>
                {t("Catégorie")} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as string)}
                items={itemsMap}
              >
                <SelectTrigger
                  className={cn("w-full", category === NONE && "text-muted-foreground")}
                  aria-required
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {t(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fabric-composition">{t("Composition")}</Label>
                <Input
                  id="fabric-composition"
                  name="composition"
                  required
                  defaultValue={field("composition") ?? fabric?.composition ?? fabric?.material ?? ""}
                  placeholder={t("Ex. 100% Coton")}
                />
                {/* Ancien champ, toujours lu par le catalogue. */}
                <input type="hidden" name="material" value={fabric?.material ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fabric-brand">
                  {t("Marque / Origine")}
                </Label>
                <Input
                  id="fabric-brand"
                  name="origin_brand"
                  required
                  list="fabric-brand-suggestions"
                  defaultValue={field("origin_brand") ?? fabric?.origin_brand ?? ""}
                  placeholder="Vlisco, Uniwax…"
                />
                <datalist id="fabric-brand-suggestions">
                  {BRAND_SUGGESTIONS.map((b) => (
                    <option key={b} value={t(b)} />
                  ))}
                </datalist>
              </div>
            </div>
          </Section>

          {/* 3. Propriétés physiques */}
          <Section n={3} title={t("Toucher & tombé")} hint={t("facultatif")}>
            <ChipField
              label={t("Épaisseur")}
              name="weight"
              defaultValue={saved ? field("weight") : fabric?.weight}
              options={Object.entries(WEIGHTS).map(([value, w]) => ({
                value,
                label: t(w.label),
                hint: t(w.hint),
              }))}
            />
            <div className="space-y-2">
              <Label htmlFor="fabric-gsm">
                {t("Grammage (g/m²)")}
              </Label>
              <Input
                id="fabric-gsm"
                name="grammage_gsm"
                type="number"
                min={10}
                max={1500}
                step={1}
                className="max-w-32"
                defaultValue={field("grammage_gsm") ?? fabric?.grammage_gsm ?? ""}
              />
            </div>
            <ChipField
              label={t("Opacité")}
              name="opacity"
              defaultValue={saved ? field("opacity") : fabric?.opacity}
              options={Object.entries(OPACITIES).map(([value, o]) => ({
                value,
                label: t(o.label),
                hint: o.hint ? t(o.hint) : undefined,
              }))}
            />
            <ChipField
              label={t("Tombé")}
              name="drape"
              defaultValue={saved ? field("drape") : fabric?.drape}
              options={Object.entries(DRAPES).map(([value, d]) => ({ value, label: t(d.label) }))}
            />
            <ChipField
              label={t("Élasticité")}
              name="stretch"
              defaultValue={saved ? field("stretch") : fabric?.stretch}
              options={Object.entries(STRETCHES).map(([value, s]) => ({ value, label: t(s.label) }))}
            />
          </Section>

          {/* 4. Visuel & couleurs */}
          <Section n={4} title={t("Photos & couleurs")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <PhotoField
                id="fabric-image"
                label={t("Vue d'ensemble du motif")}
                preview={preview}
                onPick={pick}
                isEdit={isEdit}
              />
              <PhotoField
                id="fabric-detail-image"
                label={t("Gros plan sur le tissage")}
                preview={detailPreview}
                onPick={pickDetail}
                isEdit={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Couleurs")}</Label>
              <p className="text-muted-foreground text-xs">
                {t("Touchez d'abord la couleur dominante.")}
              </p>
              <FabricColorPicker
                key={k}
                defaultValue={saved ? (field("color") ?? "") : fabric?.color}
                onChange={setColorList}
              />
            </div>
            <input type="hidden" name="color_variants" value={variantsJson} />
            {colorList.length > 1 && (
              <div className="space-y-2">
                <Label>
                  {t("Prix ou photo par couleur")}{" "}
                  <span className="text-muted-foreground text-xs font-normal">({t("facultatif")})</span>
                </Label>
                <p className="text-muted-foreground text-xs">
                  {t("Même tissu, autre couleur : pas besoin de photo. Mettez un prix seulement si cette couleur coûte plus ou moins cher.")}
                </p>
                <ul className="divide-y rounded-lg border">
                  {colorList.map((c) => {
                    const preview = colorFiles[c]?.url ?? fabric?.color_variants?.[c]?.image_url ?? null;
                    const inputId = `color-photo-${c.replace(/\W+/g, "-")}`;
                    return (
                      <li key={c} className="flex items-center gap-3 p-2">
                        <span
                          className="size-6 shrink-0 rounded-full border border-white/20"
                          style={{ backgroundColor: fabricColorHex(c) ?? undefined }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{t(c)}</span>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          aria-label={t("Prix de {c}", { c: t(c) })}
                          value={colorPrices[c] ?? ""}
                          onChange={(e) => setColorPrices((m) => ({ ...m, [c]: e.target.value }))}
                          placeholder={t("Même prix")}
                          className="w-28"
                        />
                        <span className="text-muted-foreground w-10 text-xs">
                          {europe ? "€" : CURRENCY}
                        </span>
                        <label
                          htmlFor={inputId}
                          className="bg-muted relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed"
                          title={t("Photo de cette couleur")}
                        >
                          {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="" className="size-full object-cover" />
                          ) : (
                            <ImagePlus className="text-muted-foreground size-4" />
                          )}
                          <input
                            id={inputId}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            className="sr-only"
                            onChange={(e) => {
                              pickColorFile(c, e.target.files?.[0] ?? null);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <ChipField
              label={t("Motif")}
              name="pattern"
              defaultValue={saved ? field("pattern") : fabric?.pattern}
              options={Object.entries(PATTERNS).map(([value, p]) => ({ value, label: t(p.label) }))}
            />
            <div className="space-y-2">
              <Label htmlFor="fabric-finish">
                {t("Finition")}{" "}
                <span className="text-muted-foreground text-xs font-normal">({t("facultatif")})</span>
              </Label>
              <Input
                id="fabric-finish"
                name="finish"
                defaultValue={field("finish") ?? fabric?.finish ?? ""}
                placeholder={t("Ex. Amidonné, Brillant, Mat, Sequins")}
              />
            </div>
          </Section>

          {/* 5. Entretien & usages */}
          <Section n={5} title={t("Entretien & usages")} hint={t("facultatif")}>
            <ChipField
              multiple
              label={t("Entretien")}
              name="care_instructions"
              defaultValues={fieldAll("care_instructions") ?? fabric?.care_instructions ?? []}
              options={Object.entries(CARE_INSTRUCTIONS).map(([value, c]) => ({
                value,
                label: t(c.label),
              }))}
            />
            <ChipField
              multiple
              label={t("Idéal pour")}
              name="recommended_usages"
              defaultValues={fieldAll("recommended_usages") ?? fabric?.recommended_usages ?? []}
              options={Object.entries(USAGES).map(([value, u]) => ({ value, label: t(u.label) }))}
            />
            <div className="space-y-2">
              <Label htmlFor="fabric-description">
                {t("Description")}{" "}
                <span className="text-muted-foreground text-xs font-normal">({t("facultatif")})</span>
              </Label>
              <Textarea
                id="fabric-description"
                name="description"
                rows={2}
                defaultValue={field("description") ?? fabric?.description ?? ""}
                placeholder={t("Détails, tissage, usage recommandé…")}
              />
            </div>
          </Section>

          <DeliveryZoneField
            defaultValue={(field("delivery_zone") as FreeDeliveryZone | undefined) ?? fabric?.delivery_zone}
            europe={europe}
          />

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={saved ? field("is_active") === "on" : fabric ? fabric.is_active : true}
              className="accent-primary mt-0.5 size-4 rounded"
            />
            <span>
              {t("Mettre en ligne dans la boutique")}
              <span className="text-muted-foreground block text-xs">
                {t("Le tissu apparaît aussitôt dans le catalogue et peut être commandé. Décochez pour le garder en brouillon.")}
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
              {isEdit ? t("Enregistrer") : t("Ajouter le tissu")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initialColorPrices(fabric: Fabric | null, europe: boolean): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fabric?.color_variants ?? {}).flatMap(([c, v]) =>
      v?.price ? [[c, String(europe ? xofToEur(v.price) : v.price)]] : [],
    ),
  );
}

function Section({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-xl border p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
        <span className="bg-primary text-primary-foreground grid size-6 place-items-center rounded-full text-xs">
          {n}
        </span>
        {title}
        {hint && <span className="text-muted-foreground text-xs font-normal">({hint})</span>}
      </legend>
      {children}
    </fieldset>
  );
}

type ChipOption = { value: string; label: string; hint?: string };

/** Boutons radio contrôlés (l'unité de vente change le libellé du prix). */
function Chips({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value} className={chipClass(value === o.value)}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

/**
 * Un choix à gros boutons — un seul (radio, re-touchable pour décocher) ou
 * plusieurs (cases). La valeur part dans le formulaire par les inputs natifs.
 */
function ChipField({
  label,
  name,
  options,
  multiple = false,
  defaultValue,
  defaultValues,
}: {
  label: string;
  name: string;
  options: ChipOption[];
  multiple?: boolean;
  defaultValue?: string | null;
  defaultValues?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(
    multiple ? (defaultValues ?? []) : defaultValue ? [defaultValue] : [],
  );

  function toggle(v: string) {
    setSelected((s) =>
      s.includes(v) ? s.filter((x) => x !== v) : multiple ? [...s, v] : [v],
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={chipClass(on)}
            >
              <span>{o.label}</span>
              {o.hint && (
                <span className={cn("text-[11px] font-normal", on ? "opacity-80" : "text-muted-foreground")}>
                  {o.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}

function chipClass(on: boolean) {
  return cn(
    "flex min-h-10 cursor-pointer flex-col items-start justify-center rounded-lg border px-3 py-1.5 text-left text-sm font-medium transition-colors",
    on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
  );
}

/**
 * Tout le carré est le bouton : c'est là qu'on touche pour choisir la photo.
 * Le fichier part redimensionné (cf. handleSubmit), donc l'input n'a pas de `name`.
 */
function PhotoField({
  id,
  label,
  preview,
  onPick,
  isEdit,
}: {
  id: string;
  label: string;
  preview: string | null;
  onPick: (file: File | null) => void;
  isEdit: boolean;
}) {
  const t = useT();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-2">
      <span className="bg-muted hover:bg-muted/70 relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="text-muted-foreground size-6" />
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="border-input hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium">
          <ImagePlus className="size-3.5" />
          {preview ? t("Changer la photo") : t("Ajouter une photo")}
        </span>
        {isEdit && preview && (
          <span className="text-muted-foreground block text-[11px]">
            {t("Laissez vide pour garder la photo actuelle.")}
          </span>
        )}
      </span>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </label>
  );
}
