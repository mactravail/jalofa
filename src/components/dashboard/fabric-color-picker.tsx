"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { FABRIC_COLORS, parseFabricColors } from "@/lib/fabric-colors";
import { cn } from "@/lib/utils";

/**
 * Pastilles de couleur à cocher (plusieurs possibles). La valeur part dans le
 * formulaire via un champ caché `color` : « Bleu, Or ».
 */
export function FabricColorPicker({
  defaultValue,
  name = "color",
}: {
  defaultValue?: string | null;
  name?: string;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    parseFabricColors(defaultValue),
  );

  function toggle(color: string) {
    setSelected((s) =>
      s.includes(color) ? s.filter((c) => c !== color) : [...s, color],
    );
  }

  // Une ancienne couleur saisie à la main reste gardée (et décochable).
  const extra = selected.filter((c) => !FABRIC_COLORS.some((p) => p.name === c));

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected.join(", ")} />
      <div className="grid grid-cols-5 gap-x-1 gap-y-2.5 sm:grid-cols-7">
        {FABRIC_COLORS.map((c) => {
          const active = selected.includes(c.name);
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggle(c.name)}
              aria-pressed={active}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border border-white/20 transition",
                  active && "ring-primary ring-offset-background ring-2 ring-offset-2",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {active && (
                  <Check
                    className="size-4 drop-shadow"
                    style={{ color: isLight(c.hex) ? "#000" : "#fff" }}
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-center text-[10px] leading-tight",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
      {extra.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {extra.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className="bg-muted rounded-full px-2 py-0.5 text-xs"
            >
              {c} ✕
            </button>
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        {selected.length
          ? `Choisi : ${selected.join(", ")}`
          : "Touchez les couleurs de votre tissu (plusieurs possibles)."}
      </p>
    </div>
  );
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}
