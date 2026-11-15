"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { refreshSavedProfile } from "@/components/account/use-saved-profile";
import { useT } from "@/components/i18n/locale-provider";
import { ToggleChip } from "@/components/order/configurator-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMyMeasurements, saveMyMeasurements } from "@/lib/actions/saved-profile";
import { MEASUREMENT_FIELDS, STANDARD_SIZES, type MeasurementMode } from "@/lib/constants";
import type { SavedMeasurement } from "@/lib/saved-profile";
import { cn } from "@/lib/utils";

/** Taille standard ou mesures détaillées, enregistrées une fois pour toutes. */
export function MyMeasurementsForm({ initial }: { initial: SavedMeasurement | null }) {
  const t = useT();
  const [mode, setMode] = useState<MeasurementMode>(initial?.mode ?? "standard");
  const [size, setSize] = useState<string | null>(initial?.standard_size ?? null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial?.values ?? {}).map(([k, v]) => [k, String(v)])),
  );
  const [saved, setSaved] = useState(Boolean(initial));
  const [pending, start] = useTransition();

  const canSave =
    mode === "standard" ? Boolean(size) : Object.values(values).some((v) => v.trim() !== "");

  const save = () =>
    start(async () => {
      const res = await saveMyMeasurements({
        mode,
        standard_size: mode === "standard" ? size : null,
        values:
          mode === "manual"
            ? Object.fromEntries(
                Object.entries(values)
                  .filter(([, v]) => v.trim() !== "")
                  .map(([k, v]) => [k, Number(v.replace(",", "."))]),
              )
            : {},
      });
      if (!res.ok) {
        toast.error(t(res.error));
        return;
      }
      refreshSavedProfile();
      setSaved(true);
      toast.success(t("Mesures enregistrées"), {
        description: t("À votre prochaine commande, nous vous proposerons de les utiliser."),
      });
    });

  const remove = () =>
    start(async () => {
      const res = await deleteMyMeasurements();
      if (!res.ok) {
        toast.error(t(res.error));
        return;
      }
      refreshSavedProfile();
      setSaved(false);
      setSize(null);
      setValues({});
      toast.success(t("Mesures supprimées"));
    });

  return (
    <div className="space-y-6 rounded-xl border p-4 sm:p-6">
      <div className="flex gap-2">
        <ToggleChip active={mode === "standard"} onClick={() => setMode("standard")}>
          {t("Taille standard")}
        </ToggleChip>
        <ToggleChip active={mode === "manual"} onClick={() => setMode("manual")}>
          {t("Mesures détaillées")}
        </ToggleChip>
      </div>

      {mode === "standard" ? (
        <div className="flex flex-wrap gap-2">
          {STANDARD_SIZES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={cn(
                "size-12 rounded-lg border text-sm font-semibold transition-colors",
                size === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {MEASUREMENT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`my-${f.key}`} className="text-xs">
                {t(f.label)} (cm)
              </Label>
              <Input
                id={`my-${f.key}`}
                type="number"
                inputMode="decimal"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" onClick={save} disabled={!canSave || pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {t("Enregistrer mes mesures")}
        </Button>
        {saved && (
          <Button type="button" variant="ghost" onClick={remove} disabled={pending}>
            <Trash2 className="size-4" />
            {t("Supprimer")}
          </Button>
        )}
      </div>
    </div>
  );
}
