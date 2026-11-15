"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/components/i18n/locale-provider";
import {
  draftBodyFitsToModel,
  ModelBodyFitEditor,
  toDraftBodyFits,
  type DraftBodyFit,
} from "@/components/dashboard/model-body-fit-editor";
import { Button } from "@/components/ui/button";
import { saveMyBodyFits } from "@/lib/actions/body-fits";
import {
  FIT_GROUPS,
  hasBodyFitMeters,
  modelBodyFitProblem,
  type FitGroup,
  type TailorBodyFits,
} from "@/lib/model-body-fit";
import { cn } from "@/lib/utils";

type Drafts = Record<FitGroup, DraftBodyFit[]>;

function initialDrafts(fits: TailorBodyFits): Drafts {
  return Object.fromEntries(
    FIT_GROUPS.map((g) => [g.slug, toDraftBodyFits(fits[g.slug], g.slug)]),
  ) as Drafts;
}

/** « Mes métrages » : un tableau par collection, écrit une fois pour tous les modèles. */
export function TailorBodyFitsForm({ fits }: { fits: TailorBodyFits }) {
  const t = useT();
  const [group, setGroup] = useState<FitGroup>("homme");
  const [drafts, setDrafts] = useState<Drafts>(() => initialDrafts(fits));
  const [isPending, startTransition] = useTransition();

  const status = (g: FitGroup) => {
    const model = draftBodyFitsToModel(drafts[g]);
    if (!modelBodyFitProblem(model, g)) return "done";
    return hasBodyFitMeters(model) ? "partial" : "empty";
  };

  // La femme et l'homme se coupent souvent pareil : on reprend les mètres en un geste.
  const canCopyHomme =
    group === "femme" &&
    hasBodyFitMeters(draftBodyFitsToModel(drafts.homme)) &&
    !hasBodyFitMeters(draftBodyFitsToModel(drafts.femme));

  function copyHomme() {
    setDrafts((prev) => ({
      ...prev,
      femme: prev.femme.map((f) => {
        const from = prev.homme.find((h) => h.body === f.body);
        return from ? { ...f, meters: { ...from.meters } } : f;
      }),
    }));
  }

  function save() {
    const payload = Object.fromEntries(
      FIT_GROUPS.map((g) => [g.slug, draftBodyFitsToModel(drafts[g.slug])]),
    );
    startTransition(async () => {
      const result = await saveMyBodyFits(JSON.stringify(payload));
      if (result.ok) toast.success(t("Métrages enregistrés : ils s'affichent sur tous vos modèles."));
      else toast.error(t(result.error));
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border p-1">
        {FIT_GROUPS.map((g) => {
          const s = status(g.slug);
          return (
            <button
              key={g.slug}
              type="button"
              onClick={() => setGroup(g.slug)}
              aria-pressed={group === g.slug}
              className={cn(
                "flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
                group === g.slug ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {t(g.label)}
              {s === "done" && <Check className="size-4 text-emerald-500" />}
              {s === "partial" && <span className="size-2 rounded-full bg-amber-500" />}
            </button>
          );
        })}
      </div>

      <p className="text-muted-foreground text-sm">
        {t("Pour chaque corps, écrivez les mètres de tissu qu'il vous faut selon la taille de la personne. Le client verra ce métrage.")}
      </p>

      {canCopyHomme && (
        <Button type="button" variant="outline" className="w-full" onClick={copyHomme}>
          <Copy className="size-4" />
          {t("Reprendre les mètres « Homme »")}
        </Button>
      )}

      <ModelBodyFitEditor
        key={group}
        bare
        categorySlug={group}
        fits={drafts[group]}
        onChange={(next) => setDrafts((prev) => ({ ...prev, [group]: next }))}
      />

      <Button type="button" size="lg" className="w-full" onClick={save} disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {t("Enregistrer")}
      </Button>
    </div>
  );
}
