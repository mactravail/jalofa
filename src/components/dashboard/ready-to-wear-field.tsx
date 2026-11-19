"use client";

import { useState } from "react";
import { Check, ImagePlus, Loader2, Plus, Shirt, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { uploadModelStylePhoto } from "@/lib/actions/models";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import { useT } from "@/components/i18n/locale-provider";
import { MAX_READY_COLORS, READY_COLOR_SWATCHES, readyColorHex } from "@/lib/ready-to-wear";
import { STANDARD_SIZES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * « Tel quel » = prêt-à-porter. Le tailleur dit lui-même si ce modèle existe
 * déjà cousu, prêt à partir, et dans quelles couleurs. Sans « Oui » ni couleur,
 * le client ne voit que « Sur mesure ».
 *
 * Champs envoyés : `ready_form` (repère), `ready_to_wear` (« on »), et un
 * `ready_colors` par couleur cochée, un `ready_sizes` par taille cochée,
 * `ready_color_prices` (JSON) : le prix
 * propre à une couleur, quand elle coûte plus ou moins que le modèle, et
 * `ready_color_images` (JSON) : la photo du modèle dans cette couleur, envoyée
 * dès qu'elle est choisie (une à une, sous la limite d'une Server Action).
 */
export function ReadyToWearField({
  defaultOn,
  defaultColors,
  defaultSizes = [],
  defaultPrices = {},
  defaultImages = {},
}: {
  defaultOn: boolean;
  defaultColors: string[];
  defaultSizes?: string[];
  defaultPrices?: Record<string, number>;
  defaultImages?: Record<string, string>;
}) {
  const t = useT();
  const [on, setOn] = useState(defaultOn);
  const [colors, setColors] = useState<string[]>(defaultColors);
  // Un ancien modèle prêt-à-porter sans tailles enregistrées était vendu dans
  // toutes les tailles : on les montre cochées, le tailleur décoche.
  const [sizes, setSizes] = useState<string[]>(
    defaultSizes.length > 0 ? defaultSizes : defaultOn ? [...STANDARD_SIZES] : [],
  );
  const toggleSize = (s: string) =>
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : STANDARD_SIZES.filter((x) => x === s || prev.includes(x)),
    );
  const [custom, setCustom] = useState("");
  // Prix par couleur, en texte tant qu'on tape ; vide = prix du modèle.
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(defaultPrices).map(([c, p]) => [c, String(p)])),
  );
  // Photo par couleur : son adresse une fois en ligne ; `uploading` pendant l'envoi.
  const [images, setImages] = useState<Record<string, string>>(defaultImages);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const imagesJson = JSON.stringify(
    Object.fromEntries(colors.flatMap((c) => (images[c] ? [[c, images[c]]] : []))),
  );

  async function pickImage(color: string, file: File | undefined) {
    if (!file) return;
    setUploading((u) => ({ ...u, [color]: true }));
    try {
      const image = await resizeImage(file);
      if (image.size > MAX_UPLOAD_BYTES) {
        toast.error(t("Cette photo est trop lourde. Choisissez-en une plus légère."));
        return;
      }
      const body = new FormData();
      body.set("photo", image);
      const res = await uploadModelStylePhoto(body);
      if (!res.ok) {
        toast.error(t(res.error));
        return;
      }
      setImages((prev) => ({ ...prev, [color]: res.url }));
    } catch {
      toast.error(t("L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez."));
    } finally {
      setUploading((u) => ({ ...u, [color]: false }));
    }
  }

  const pricesJson = JSON.stringify(
    Object.fromEntries(
      colors.flatMap((c) => {
        const n = Math.round(Number(prices[c]));
        return prices[c]?.trim() && Number.isFinite(n) && n > 0 ? [[c, n]] : [];
      }),
    ),
  );

  const toggle = (name: string) =>
    setColors((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : prev.length >= MAX_READY_COLORS
          ? prev
          : [...prev, name],
    );

  const addCustom = () => {
    const name = custom.trim().slice(0, 40);
    if (!name) return;
    if (!colors.some((c) => c.toLowerCase() === name.toLowerCase())) toggle(name);
    setCustom("");
  };

  const customColors = colors.filter((c) => !READY_COLOR_SWATCHES.some((s) => s.name === c));

  return (
    <fieldset className="space-y-3 rounded-xl border p-4">
      <input type="hidden" name="ready_form" value="1" />
      {on && <input type="hidden" name="ready_to_wear" value="on" />}
      {on && colors.map((c) => <input key={c} type="hidden" name="ready_colors" value={c} />)}
      {on && sizes.map((s) => <input key={s} type="hidden" name="ready_sizes" value={s} />)}
      {on && <input type="hidden" name="ready_color_prices" value={pricesJson} />}
      {on && <input type="hidden" name="ready_color_images" value={imagesJson} />}

      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium">
        <Shirt className="text-primary size-4" /> {t("Prêt-à-porter (« Tel quel »)")}
      </legend>
      <p className="text-muted-foreground text-xs">
        {t("Ce modèle est-il déjà cousu, prêt à partir ? Le client choisit alors juste sa couleur et sa taille.")}
      </p>

      <div role="radiogroup" aria-label={t("Disponible en prêt-à-porter")} className="grid grid-cols-2 gap-2">
        {[
          { value: true, label: t("Oui, disponible") },
          { value: false, label: t("Non, sur mesure seulement") },
        ].map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on === o.value}
            onClick={() => setOn(o.value)}
            className={cn(
              "rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-colors",
              on === o.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {on && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("Quelles couleurs avez-vous ?")}</p>
          <div className="flex flex-wrap gap-2">
            {READY_COLOR_SWATCHES.map((s) => {
              const active = colors.includes(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(s.name)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border-2 py-1 pr-3 pl-1 text-xs font-medium transition-colors",
                    active ? "border-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-6 place-items-center rounded-full border border-white/20"
                    style={{ background: s.hex }}
                  >
                    {active && <Check className="size-3.5 text-white mix-blend-difference" strokeWidth={3} />}
                  </span>
                  {t(s.name)}
                </button>
              );
            })}
            {customColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className="border-primary flex items-center gap-1.5 rounded-full border-2 py-1 pr-2 pl-3 text-xs font-medium"
              >
                {c} <X className="size-3.5" aria-label={t("Retirer")} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              maxLength={40}
              placeholder={t("Autre couleur (ex. Bleu nuit brodé or)")}
            />
            <button
              type="button"
              onClick={addCustom}
              className="hover:bg-muted flex shrink-0 items-center gap-1 rounded-lg border px-3 text-sm font-medium"
            >
              <Plus className="size-4" /> {t("Ajouter")}
            </button>
          </div>
          {colors.length === 0 && (
            <p className="text-destructive text-xs">{t("Choisissez au moins une couleur.")}</p>
          )}
          {colors.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">{t("Photo et prix de chaque couleur")}</p>
              <p className="text-muted-foreground text-xs">
                {t("Touchez l'appareil photo pour montrer le modèle dans cette couleur. Prix vide : la couleur est au prix du modèle.")}
              </p>
              <ul className="space-y-2">
                {colors.map((c) => {
                  const hex = readyColorHex(c);
                  const inputId = `ready-photo-${c.replace(/\W+/g, "-")}`;
                  const img = images[c];
                  const busy = uploading[c];
                  return (
                    <li key={c} className="flex items-center gap-2">
                      <label
                        htmlFor={inputId}
                        title={t("Photo de cette couleur")}
                        className={cn(
                          "relative grid size-12 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border-2",
                          img ? "border-transparent" : "border-dashed",
                        )}
                        style={!img && hex ? { borderColor: hex } : undefined}
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="size-full object-cover" />
                        ) : (
                          <ImagePlus className="text-muted-foreground size-5" />
                        )}
                        {busy && (
                          <span className="absolute inset-0 grid place-items-center bg-black/60">
                            <Loader2 className="size-4 animate-spin text-white" />
                          </span>
                        )}
                        <input
                          id={inputId}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="sr-only"
                          disabled={busy}
                          onChange={(e) => {
                            void pickImage(c, e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span
                          aria-hidden
                          className="bg-muted size-4 shrink-0 rounded-full border border-white/20"
                          style={hex ? { background: hex } : undefined}
                        />
                        <span className="truncate text-sm">{t(c)}</span>
                        {img && !busy && (
                          <button
                            type="button"
                            onClick={() =>
                              setImages((prev) => {
                                const next = { ...prev };
                                delete next[c];
                                return next;
                              })
                            }
                            aria-label={t("Retirer la photo")}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={prices[c] ?? ""}
                        onChange={(e) => setPrices((prev) => ({ ...prev, [c]: e.target.value }))}
                        placeholder={t("Prix du modèle")}
                        aria-label={t("Prix en {color}", { color: t(c) })}
                        className="w-28"
                      />
                      <span className="text-muted-foreground text-xs">FCFA</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">{t("Quelles tailles avez-vous ?")}</p>
            <div className="flex flex-wrap gap-2">
              {STANDARD_SIZES.map((s) => {
                const active = sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "h-11 min-w-12 rounded-lg border-2 px-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {sizes.length === 0 && (
              <p className="text-destructive text-xs">{t("Choisissez au moins une taille.")}</p>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {t("Sans prix par couleur, le prix payé « tel quel » est le prix « à partir de » de ce modèle.")}
          </p>
        </div>
      )}
    </fieldset>
  );
}
