"use client";

import { Check } from "lucide-react";

import { BodyFigure } from "@/components/order/body-figure";
import { useConfigurator } from "@/components/order/configurator-context";
import {
  bodyFigureKindFor,
  bodyOptionsFor,
  heightBandsFor,
  type BodyTypeOption,
} from "@/lib/body-types";
import { BODY_RANGE_FIELDS } from "@/lib/model-body-fit";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

export default function BodyStep() {
  const { data, state, update, model } = useConfigurator();
  const t = useT();

  const kind = bodyFigureKindFor(model?.category_slug);
  const options = bodyOptionsFor(model);
  const heights = heightBandsFor(model?.category_slug);
  const chosen = options.find((b) => b.slug === state.bodyType);
  const author = model?.tailor_id ? data.tailors.find((t) => t.id === model.tailor_id) : null;

  // Le corps présélectionne la taille de vêtement de l'étape Mesures. Ni lui ni la
  // taille ne touchent au métrage ici : le prix ne bouge qu'à l'étape Quantité.
  // Re-toucher le même corps garde ce que le client aurait changé entre-temps.
  const choose = (body: BodyTypeOption) => {
    if (body.slug === state.bodyType) return;
    update({ bodyType: body.slug, standardSize: body.size });
  };

  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {options.map((b) => {
            const active = state.bodyType === b.slug;
            return (
              <button
                type="button"
                key={b.slug}
                onClick={() => choose(b)}
                aria-pressed={active}
                className="group/opt flex flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={cn(
                    "bg-card relative flex aspect-[3/4] w-full items-center justify-center rounded-lg border p-2 transition-colors",
                    active
                      ? "border-primary ring-primary/40 ring-1"
                      : "border-border/60 group-hover/opt:border-foreground/30",
                  )}
                >
                  {active && (
                    <span className="text-primary-foreground bg-primary absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  <BodyFigure
                    kind={kind}
                    shape={b.slug}
                    className={cn(
                      "h-full w-full",
                      active ? "text-foreground" : "text-muted-foreground/80",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-sm leading-tight",
                    active ? "text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {t(b.label)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Les repères du tailleur, pour vérifier qu'on a choisi le bon corps. */}
        {chosen?.fit && (
          <div className="bg-muted/40 rounded-xl p-3.5 text-sm">
            <dl className="space-y-1.5">
              {BODY_RANGE_FIELDS.map((f) => {
                const range = chosen.fit?.ranges[f.key];
                return (
                  <div key={f.key} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t(f.label)}</dt>
                    <dd className="font-medium whitespace-nowrap">
                      {t("{min} à {max} cm", { min: range?.min ?? "", max: range?.max ?? "" })}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {author?.shop_name && (
              <p className="text-muted-foreground mt-2 text-xs">
                {t("Mesures indiquées par {name}.", { name: author.shop_name })}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Sans lien avec le corps : on peut être mince et faire 1,30 m comme 2 m. */}
      <section>
        <h3 className="mb-3 text-base font-semibold tracking-tight">{t("Votre taille estimée")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {heights.map((h) => {
            const active = state.heightBand === h.slug;
            return (
              <button
                type="button"
                key={h.slug}
                onClick={() => update({ heightBand: h.slug })}
                aria-pressed={active}
                className={cn(
                  "min-h-12 rounded-lg border px-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {t(h.label)}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
