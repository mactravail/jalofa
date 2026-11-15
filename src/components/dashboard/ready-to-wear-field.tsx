"use client";

import { useState } from "react";
import { Check, Plus, Shirt, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";
import { MAX_READY_COLORS, READY_COLOR_SWATCHES, readyColorHex } from "@/lib/ready-to-wear";
import { cn } from "@/lib/utils";

/**
 * « Tel quel » = prêt-à-porter. Le tailleur dit lui-même si ce modèle existe
 * déjà cousu, prêt à partir, et dans quelles couleurs. Sans « Oui » ni couleur,
 * le client ne voit que « Sur mesure ».
 *
 * Champs envoyés : `ready_form` (repère), `ready_to_wear` (« on »), et un
 * `ready_colors` par couleur cochée, `ready_color_prices` (JSON) : le prix
 * propre à une couleur, quand elle coûte plus ou moins que le modèle.
 */
export function ReadyToWearField({
  defaultOn,
  defaultColors,
  defaultPrices = {},
}: {
  defaultOn: boolean;
  defaultColors: string[];
  defaultPrices?: Record<string, number>;
}) {
  const t = useT();
  const [on, setOn] = useState(defaultOn);
  const [colors, setColors] = useState<string[]>(defaultColors);
  const [custom, setCustom] = useState("");
  // Prix par couleur, en texte tant qu'on tape ; vide = prix du modèle.
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(defaultPrices).map(([c, p]) => [c, String(p)])),
  );
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
      {on && <input type="hidden" name="ready_color_prices" value={pricesJson} />}

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
              <p className="text-sm font-medium">{t("Le prix change selon la couleur ?")}</p>
              <p className="text-muted-foreground text-xs">
                {t("Laissez vide : la couleur est au prix du modèle. Écrivez un prix seulement si cette couleur coûte plus ou moins.")}
              </p>
              <ul className="space-y-2">
                {colors.map((c) => {
                  const hex = readyColorHex(c);
                  return (
                    <li key={c} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="bg-muted size-6 shrink-0 rounded-full border border-white/20"
                        style={hex ? { background: hex } : undefined}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{t(c)}</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={prices[c] ?? ""}
                        onChange={(e) => setPrices((prev) => ({ ...prev, [c]: e.target.value }))}
                        placeholder={t("Prix du modèle")}
                        aria-label={t("Prix en {color}", { color: t(c) })}
                        className="w-32"
                      />
                      <span className="text-muted-foreground text-xs">FCFA</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            {t("Sans prix par couleur, le prix payé « tel quel » est le prix « à partir de » de ce modèle.")}
          </p>
        </div>
      )}
    </fieldset>
  );
}
