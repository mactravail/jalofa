"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { BodyFigure } from "@/components/order/body-figure";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bodyFigureKindFor,
  bodyTypesFor,
  heightBandsFor,
  type BodyType,
} from "@/lib/body-types";
import { BODY_RANGE_FIELDS, defaultBodyRanges } from "@/lib/model-body-fit";
import type { BodyRangeKey, HeightBand, ModelBodyFit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

/** Le tableau en cours de saisie : des textes, le temps que le tailleur écrive. */
export type DraftBodyFit = {
  body: BodyType;
  meters: Record<HeightBand, string>;
  ranges: Record<BodyRangeKey, { min: string; max: string }>;
  /** Le tailleur a touché aux intervalles : changer de catégorie ne les écrase plus. */
  edited: boolean;
};

const BANDS: HeightBand[] = ["petite", "moyenne", "grande", "tres_grande"];

const text = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const num = (s: string) => (s.trim() === "" ? null : Number(s));

function draftRanges(ranges: ModelBodyFit["ranges"]): DraftBodyFit["ranges"] {
  return Object.fromEntries(
    BODY_RANGE_FIELDS.map((f) => [
      f.key,
      { min: text(ranges[f.key]?.min), max: text(ranges[f.key]?.max) },
    ]),
  ) as DraftBodyFit["ranges"];
}

function draftMeters(meters?: ModelBodyFit["meters"]): DraftBodyFit["meters"] {
  return Object.fromEntries(BANDS.map((b) => [b, text(meters?.[b])])) as DraftBodyFit["meters"];
}

/** Le tableau enregistré, ou les intervalles de départ pour ce qui manque. */
export function toDraftBodyFits(
  fits: ModelBodyFit[] | undefined,
  categorySlug: string | null | undefined,
): DraftBodyFit[] {
  return bodyTypesFor(categorySlug).map((option) => {
    const saved = fits?.find((f) => f.body === option.slug);
    return saved
      ? {
          body: option.slug,
          meters: draftMeters(saved.meters),
          ranges: draftRanges(saved.ranges),
          edited: true,
        }
      : {
          body: option.slug,
          meters: draftMeters(),
          ranges: draftRanges(defaultBodyRanges(categorySlug, option.slug)),
          edited: false,
        };
  });
}

/**
 * Le vêtement change de catégorie : les silhouettes et les intervalles de départ
 * suivent. Ce que le tailleur a déjà écrit reste à sa place.
 */
export function rebaseDraftBodyFits(
  drafts: DraftBodyFit[],
  categorySlug: string | null | undefined,
): DraftBodyFit[] {
  const fresh = toDraftBodyFits(undefined, categorySlug);
  return fresh.map((base) => {
    const previous = drafts.find((d) => d.body === base.body);
    if (!previous) return base;
    return previous.edited ? previous : { ...base, meters: previous.meters };
  });
}

export function draftBodyFitsToModel(drafts: DraftBodyFit[]): ModelBodyFit[] {
  return drafts.map((d) => ({
    body: d.body,
    meters: Object.fromEntries(BANDS.map((b) => [b, num(d.meters[b])])) as ModelBodyFit["meters"],
    ranges: Object.fromEntries(
      BODY_RANGE_FIELDS.map((f) => [
        f.key,
        { min: num(d.ranges[f.key].min), max: num(d.ranges[f.key].max) },
      ]),
    ) as ModelBodyFit["ranges"],
  }));
}

export function ModelBodyFitEditor({
  categorySlug,
  fits,
  onChange,
}: {
  categorySlug: string | null;
  fits: DraftBodyFit[];
  onChange: (fits: DraftBodyFit[]) => void;
}) {
  const [openBody, setOpenBody] = useState<BodyType | null>(null);
  const t = useT();
  const kind = bodyFigureKindFor(categorySlug);
  const labels = Object.fromEntries(bodyTypesFor(categorySlug).map((b) => [b.slug, t(b.label)]));
  const bands = heightBandsFor(categorySlug);

  const patch = (body: BodyType, change: Partial<DraftBodyFit>) =>
    onChange(fits.map((f) => (f.body === body ? { ...f, ...change } : f)));

  return (
    <div className="space-y-2">
      <Label>{t("Mètres de tissu nécessaires")}</Label>
      <p className="text-muted-foreground text-xs">
        {t("Pour chaque corps, écrivez les mètres de tissu qu'il vous faut selon la taille de la personne. Le client verra ce métrage.")}
      </p>

      <div className="space-y-2">
        {fits.map((fit) => {
          const open = openBody === fit.body;
          const label = labels[fit.body];
          return (
            <div key={fit.body} className="rounded-xl border p-2.5">
              <div className="flex items-center gap-2.5">
                <BodyFigure
                  kind={kind}
                  shape={fit.body}
                  className="text-muted-foreground h-12 w-7 shrink-0"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
                <button
                  type="button"
                  onClick={() => setOpenBody(open ? null : fit.body)}
                  aria-expanded={open}
                  className="text-muted-foreground flex min-h-9 shrink-0 items-center gap-1 text-xs"
                >
                  {t("Mesures du corps")}
                  <ChevronDown
                    className={cn("size-4 transition-transform", open && "rotate-180")}
                  />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {bands.map((band) => (
                  <label key={band.slug} className="min-w-0">
                    <span className="text-muted-foreground mb-1 block truncate text-center text-[10px]">
                      {band.short}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0.5}
                      step={0.5}
                      value={fit.meters[band.slug]}
                      onChange={(e) =>
                        patch(fit.body, {
                          meters: { ...fit.meters, [band.slug]: e.target.value },
                        })
                      }
                      aria-label={`${t("Mètres de tissu")}, ${label}, ${t(band.label)}`}
                      placeholder="m"
                      className="px-1.5 text-center"
                    />
                  </label>
                ))}
              </div>

              {open && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="text-muted-foreground text-xs">
                    {t("Proposées au départ : corrigez-les selon votre coupe.")}
                  </p>
                  {BODY_RANGE_FIELDS.map((field) => {
                    const range = fit.ranges[field.key];
                    const setRange = (side: "min" | "max", value: string) =>
                      patch(fit.body, {
                        edited: true,
                        ranges: {
                          ...fit.ranges,
                          [field.key]: { ...range, [side]: value },
                        },
                      });
                    return (
                      <div key={field.key} className="flex items-center gap-1.5">
                        <span className="min-w-0 flex-1 truncate text-xs">{t(field.label)}</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={range.min}
                          onChange={(e) => setRange("min", e.target.value)}
                          aria-label={`${t(field.label)} min, ${label}`}
                          className="w-[4.5rem] text-right"
                        />
                        <span className="text-muted-foreground text-xs">{t("à")}</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={range.max}
                          onChange={(e) => setRange("max", e.target.value)}
                          aria-label={`${t(field.label)} max, ${label}`}
                          className="w-[4.5rem] text-right"
                        />
                        <span className="text-muted-foreground text-xs">cm</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
