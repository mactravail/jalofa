"use client";

import { BodyPhotoPicker } from "@/components/order/body-photo-picker";
import { useConfigurator } from "@/components/order/configurator-context";
import { ToggleChip } from "@/components/order/configurator-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEASUREMENT_FIELDS, STANDARD_SIZES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

export default function MeasurementsStep() {
  const { state, update } = useConfigurator();
  const t = useT();
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <ToggleChip
          active={state.measurementMode === "standard"}
          onClick={() => update({ measurementMode: "standard" })}
        >
          {t("Taille standard")}
        </ToggleChip>
        <ToggleChip
          active={state.measurementMode === "manual"}
          onClick={() => update({ measurementMode: "manual" })}
        >
          {t("Mesures détaillées")}
        </ToggleChip>
      </div>

      {state.measurementMode === "standard" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {STANDARD_SIZES.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => update({ standardSize: size })}
                className={cn(
                  "size-12 rounded-lg border text-sm font-semibold transition-colors",
                  state.standardSize === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {size}
              </button>
            ))}
          </div>
          <BodyPhotoPicker
            photo={state.bodyPhoto}
            onChange={(bodyPhoto) => update({ bodyPhoto })}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {MEASUREMENT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key} className="text-xs">
                {t(f.label)} (cm)
              </Label>
              <Input
                id={f.key}
                type="number"
                inputMode="decimal"
                value={state.manual[f.key] ?? ""}
                onChange={(e) =>
                  update({ manual: { ...state.manual, [f.key]: e.target.value } })
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
