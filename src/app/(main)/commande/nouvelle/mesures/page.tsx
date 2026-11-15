"use client";

import { useTransition } from "react";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SavedInfoPrompt } from "@/components/account/saved-info-prompt";
import { refreshSavedProfile, useSavedProfile } from "@/components/account/use-saved-profile";
import { BodyPhotoPicker } from "@/components/order/body-photo-picker";
import { useConfigurator } from "@/components/order/configurator-context";
import { ToggleChip } from "@/components/order/configurator-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveMyMeasurements } from "@/lib/actions/saved-profile";
import { MEASUREMENT_FIELDS, STANDARD_SIZES } from "@/lib/constants";
import type { SavedMeasurement } from "@/lib/saved-profile";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

export default function MeasurementsStep() {
  const { state, update } = useConfigurator();
  const t = useT();
  const profile = useSavedProfile();
  const saved = profile?.measurement ?? null;
  const [saving, startSaving] = useTransition();

  const summary = (m: SavedMeasurement) =>
    m.mode === "standard"
      ? t("Taille {size}", { size: m.standard_size ?? "" })
      : MEASUREMENT_FIELDS.filter((f) => m.values[f.key])
          .map((f) => `${t(f.label)} ${m.values[f.key]} cm`)
          .join(" · ");

  // « Oui » : les mesures du compte remplissent l'étape. « Non » : on repart
  // d'une fiche vide, pour d'autres mesures ou une autre personne.
  const choose = (choice: "saved" | "other") => {
    if (choice === "saved" && saved) {
      update({
        savedMeasurementChoice: "saved",
        measurementMode: saved.mode,
        standardSize: saved.standard_size ?? state.standardSize,
        manual: Object.fromEntries(Object.entries(saved.values).map(([k, v]) => [k, String(v)])),
      });
    } else {
      update({ savedMeasurementChoice: "other", manual: {}, bodyPhoto: null });
    }
  };

  const hasValues =
    state.measurementMode === "standard"
      ? Boolean(state.standardSize)
      : Object.values(state.manual).some((v) => v.trim() !== "");

  const saveToAccount = () =>
    startSaving(async () => {
      const res = await saveMyMeasurements({
        mode: state.measurementMode,
        standard_size: state.measurementMode === "standard" ? state.standardSize : null,
        values:
          state.measurementMode === "manual"
            ? Object.fromEntries(
                Object.entries(state.manual)
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
      update({ savedMeasurementChoice: "saved" });
      toast.success(t("Mesures enregistrées dans votre compte"));
    });

  return (
    <div className="space-y-5">
      {saved && (
        <SavedInfoPrompt
          title="Utiliser vos mesures enregistrées ?"
          summary={[summary(saved)]}
          choice={state.savedMeasurementChoice}
          onChoose={choose}
          otherLabel="Autres mesures"
        />
      )}

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

      {/* Client connecté : garder ces mesures pour les prochaines commandes.
          Pas proposé quand il vient de reprendre celles de son compte. */}
      {profile && state.savedMeasurementChoice !== "saved" && hasValues && (
        <button
          type="button"
          onClick={saveToAccount}
          disabled={saving}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm underline underline-offset-4"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}
          {saved ? t("Remplacer mes mesures enregistrées par celles-ci") : t("Enregistrer ces mesures dans mon compte")}
        </button>
      )}
    </div>
  );
}
