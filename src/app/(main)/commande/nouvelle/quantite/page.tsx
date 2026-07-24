"use client";

import { useEffect } from "react";
import { Check, Minus, PackageCheck, Plus, Ruler, Scissors, ShieldCheck } from "lucide-react";

import { useConfigurator } from "@/components/order/configurator-context";
import { formatPrice } from "@/lib/constants";
import {
  clampMeters,
  coverageFor,
  FABRIC_ONLY_PRESETS,
  formatMeters,
  garmentPresets,
  MAX_METERS,
  METERS_STEP,
  MIN_CUT_METERS,
  metrageFor,
} from "@/lib/fabric-metrage";
import { cn } from "@/lib/utils";

/** En dessous, le rouleau touche à sa fin — on le dit. */
const LOW_STOCK_METERS = 15;

export default function MetersStep() {
  const { state, update, fabric, model } = useConfigurator();

  const isFabricOnly = state.type === "fabric_only";
  const metrage = metrageFor(model);
  const stock = fabric?.stock_meters ?? 0;

  const min = isFabricOnly ? MIN_CUT_METERS : metrage.minimum;
  const max = Math.max(min, Math.min(stock > 0 ? stock : MAX_METERS, MAX_METERS));

  const meters = state.fabricMeters;
  const pricePerMeter = fabric?.price_per_meter ?? 0;
  const metersPrice = (m: number) => formatPrice(pricePerMeter * m);

  const setMeters = (value: number) => update({ fabricMeters: clampMeters(value, min, max) });

  // Le métrage arrive déjà juste (posé à l'amorçage d'après le vêtement) ; ce
  // garde-fou ne sert qu'aux brouillons d'une autre session, restés sous la
  // coupe minimale de la pièce ou au-dessus de ce qu'il reste du rouleau.
  const inBounds = clampMeters(meters, min, max);
  useEffect(() => {
    if (meters !== inBounds) update({ fabricMeters: inBounds });
  }, [meters, inBounds, update]);

  const presets = isFabricOnly ? FABRIC_ONLY_PRESETS : garmentPresets(metrage);
  const coverage = coverageFor(metrage, isFabricOnly);

  return (
    <div className="space-y-7">
      {/* Le tissu qu'on est en train de métrer — il se choisit en amont, on le
          rappelle ici pour qu'on sache ce qu'on coupe. */}
      {fabric && (
        <section className="flex items-center gap-3 rounded-xl border p-3">
          {fabric.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fabric.image_url}
              alt={fabric.name}
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fabric.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {[fabric.material, fabric.color].filter(Boolean).join(" · ") || "Tissu"}
            </p>
            <p className="mt-0.5 text-xs font-medium">{formatPrice(pricePerMeter)} / m</p>
          </div>
          {stock > 0 && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
                stock <= LOW_STOCK_METERS
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {stock <= LOW_STOCK_METERS
                ? `Plus que ${formatMeters(stock)}`
                : `${formatMeters(stock)} en stock`}
            </span>
          )}
        </section>
      )}

      {/* L'expertise atelier, énoncée avant de demander quoi que ce soit. */}
      <section className="bg-muted/40 flex items-start gap-2.5 rounded-xl p-3.5">
        <Ruler className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm leading-snug">
          {isFabricOnly ? (
            <>
              Le tissu est coupé au demi-mètre.{" "}
              <span className="text-muted-foreground">
                Comptez 3 m pour une pièce simple, 6 m pour une grande tenue.
              </span>
            </>
          ) : (
            <>
              Pour votre {model?.name ?? "tenue"}, l&apos;atelier taille dans{" "}
              <span className="font-semibold">{formatMeters(metrage.recommended)}</span>.{" "}
              <span className="text-muted-foreground">
                Grande carrure ou coupe très ample : prévoyez un mètre de plus.
              </span>
            </>
          )}
        </p>
      </section>

      {/* Trois intentions d'achat, pas trois nombres. */}
      <section>
        <h3 className="mb-3 text-base font-semibold tracking-tight">Métrage</h3>
        <div className="grid gap-2.5">
          {presets.map((p) => {
            const active = meters === p.meters;
            const unavailable = p.meters > max;
            return (
              <button
                type="button"
                key={p.meters}
                onClick={() => setMeters(p.meters)}
                disabled={unavailable}
                aria-pressed={active}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors sm:p-4",
                  active
                    ? "border-primary ring-primary/30 ring-2"
                    : "border-border/60 hover:border-border hover:bg-muted/40",
                  unavailable && "cursor-not-allowed opacity-45 hover:bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex w-12 shrink-0 flex-col items-center rounded-lg py-1.5 sm:w-14",
                    active ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <span className="text-base font-semibold leading-none">
                    {p.meters.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    mètres
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{p.title}</span>
                    {p.badge && !unavailable && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {p.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                    {unavailable ? "Stock insuffisant pour ce métrage." : p.desc}
                  </span>
                  {pricePerMeter > 0 && !unavailable && (
                    <span className="mt-1 block text-xs font-medium">
                      {metersPrice(p.meters)} de tissu
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Ajustement fin — pour qui sait déjà, sans quitter la page. */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">Ajuster</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMeters(meters - METERS_STEP)}
              disabled={meters <= min}
              aria-label="Retirer un demi-mètre"
              className="hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-16 text-center text-lg font-semibold tabular-nums">
              {formatMeters(meters)}
            </span>
            <button
              type="button"
              onClick={() => setMeters(meters + METERS_STEP)}
              disabled={meters >= max}
              aria-label="Ajouter un demi-mètre"
              className="hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={METERS_STEP}
          value={meters}
          onChange={(e) => setMeters(Number(e.target.value))}
          aria-label="Nombre de mètres"
          className="accent-primary mt-4 h-1.5 w-full cursor-pointer"
        />
        <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px]">
          <span>
            {isFabricOnly
              ? `Coupe minimale ${formatMeters(min)}`
              : `Minimum ${formatMeters(min)} pour cette pièce`}
          </span>
          <span>{formatMeters(max)}</span>
        </div>
      </section>

      {/* Ce que le métrage couvre — le palier suivant se prend en un clic. */}
      <section>
        <h3 className="mb-3 text-base font-semibold tracking-tight">
          Ce que couvre votre métrage
        </h3>
        <ul className="grid gap-1.5">
          {coverage.map((c) => {
            const covered = meters >= c.at;
            const reachable = c.at <= max;
            return (
              <li key={c.at}>
                <button
                  type="button"
                  onClick={() => setMeters(c.at)}
                  disabled={covered || !reachable}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    covered
                      ? "cursor-default"
                      : reachable
                        ? "hover:bg-muted/60"
                        : "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      covered ? "bg-primary border-primary text-primary-foreground" : "border-dashed",
                    )}
                  >
                    {covered && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn("block leading-snug", !covered && "text-muted-foreground")}
                    >
                      {c.label}
                    </span>
                    {!covered && reachable && (
                      <span className="mt-0.5 block text-xs font-medium underline underline-offset-2">
                        Passer à {formatMeters(c.at)}
                        {pricePerMeter > 0 &&
                          ` · +${formatPrice(pricePerMeter * (c.at - meters))}`}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Le calcul, posé noir sur blanc. */}
      {pricePerMeter > 0 && (
        <section className="rounded-xl border p-3.5">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {formatPrice(pricePerMeter)} × {formatMeters(meters)}
            </span>
            <span className="text-lg font-semibold">{metersPrice(meters)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {isFabricOnly
              ? "Prix du tissu, hors livraison."
              : "Tissu seul — la confection du tailleur s'ajoute à l'étape suivante."}
          </p>
        </section>
      )}

      {/* Les objections qu'on lève avant qu'elles n'arrivent. */}
      <ul className="text-muted-foreground grid gap-2.5 text-xs">
        <li className="flex items-start gap-2">
          <Scissors className="mt-0.5 size-3.5 shrink-0" />
          <span>Coupé d&apos;un seul tenant, dans le même bain de teinture.</span>
        </li>
        <li className="flex items-start gap-2">
          <PackageCheck className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {isFabricOnly
              ? "Métré et contrôlé par le vendeur avant expédition."
              : "Les chutes vous sont rendues avec la tenue."}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          <span>Métrage insuffisant repéré à l&apos;atelier : on vous appelle avant de couper.</span>
        </li>
      </ul>
    </div>
  );
}
