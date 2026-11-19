"use client";

import { useState, useTransition } from "react";
import { Hand, Loader2, Ruler, Zap } from "lucide-react";
import { toast } from "sonner";

import Link from "@/components/i18n/link";
import { useT } from "@/components/i18n/locale-provider";
import {
  ModelStyleEditor,
  toDraftStyleGroups,
  type DraftStyleGroup,
} from "@/components/dashboard/model-style-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveModelSettings, uploadModelStylePhoto } from "@/lib/actions/models";
import { resizeImage } from "@/lib/image";
import {
  fitGroupFor,
  fitGroupLabel,
  tailorBodyFitProblem,
  type TailorBodyFits,
} from "@/lib/model-body-fit";
import { modelStyleProblem } from "@/lib/model-style";
import type { GarmentModel, QuoteMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const NONE = "__none__";

const DIFFICULTIES: { value: string; label: string }[] = [
  { value: "facile", label: "Facile" },
  { value: "moyen", label: "Intermédiaire" },
  { value: "difficile", label: "Avancé" },
];

/**
 * « Mes recommandations » → un modèle : délai de confection, devis, difficulté,
 * style (photos par choix) et rappel des mètres de tissu. Sortis du formulaire
 * d'ajout pour le garder court.
 */
export function ModelSettingsDialog({
  model,
  bodyFits,
  open,
  onOpenChange,
}: {
  model: GarmentModel;
  bodyFits: TailorBodyFits;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [difficulty, setDifficulty] = useState<string>(model.difficulty ?? NONE);
  const [styleGroups, setStyleGroups] = useState<DraftStyleGroup[]>(() =>
    toDraftStyleGroups(model.style_groups),
  );
  const [styleUpload, setStyleUpload] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const difficultyItems: Record<string, string> = {
    [NONE]: t("Non précisée"),
    ...Object.fromEntries(DIFFICULTIES.map((d) => [d.value, t(d.label)])),
  };

  /** Envoie une à une les photos de style encore sur le téléphone. */
  async function uploadStylePhotos(): Promise<DraftStyleGroup[] | null> {
    const total = styleGroups.flatMap((g) => g.options).filter((o) => o.file).length;
    let done = 0;
    if (total > 0) setStyleUpload({ done, total });
    try {
      const uploaded: DraftStyleGroup[] = [];
      for (const group of styleGroups) {
        const options = [];
        for (const option of group.options) {
          if (!option.file) {
            options.push(option);
            continue;
          }
          const body = new FormData();
          body.set("photo", await resizeImage(option.file));
          const res = await uploadModelStylePhoto(body);
          if (!res.ok) {
            const message = `« ${option.name || group.name} » : ${t(res.error)}`;
            setError(message);
            toast.error(message);
            return null;
          }
          if (option.preview) URL.revokeObjectURL(option.preview);
          const saved = { ...option, photo: res.url, file: undefined, preview: undefined };
          options.push(saved);
          setStyleGroups((prev) =>
            prev.map((g) =>
              g.slug === group.slug
                ? { ...g, options: g.options.map((o) => (o.slug === option.slug ? saved : o)) }
                : g,
            ),
          );
          done += 1;
          setStyleUpload({ done, total });
        }
        uploaded.push({ ...group, options });
      }
      return uploaded;
    } finally {
      setStyleUpload(null);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("id", model.id);
    formData.set("difficulty", difficulty === NONE ? "" : difficulty);

    // Un modèle publié doit garder un style complet (une photo par choix).
    if (model.is_active) {
      const problem = modelStyleProblem(
        styleGroups.map((g) => ({
          slug: g.slug,
          name: g.name,
          options: g.options.map((o) => ({
            slug: o.slug,
            name: o.name,
            photo: o.preview ?? o.photo,
            extra: 0,
          })),
        })),
      );
      if (problem) {
        setError(t(problem));
        toast.error(t(problem));
        return;
      }
    }

    startTransition(async () => {
      const uploadedStyle = await uploadStylePhotos();
      if (!uploadedStyle) return;
      formData.set(
        "style_groups",
        JSON.stringify(
          uploadedStyle.map((g) => ({
            slug: g.slug,
            name: g.name,
            options: g.options.map((o) => ({
              slug: o.slug,
              name: o.name,
              photo: o.photo,
              extra: Number(o.extra) || 0,
            })),
          })),
        ),
      );
      const res = await saveModelSettings(formData);
      if (res.ok) {
        toast.success(t("Réglages enregistrés."));
        onOpenChange(false);
      } else {
        setError(t(res.error));
        toast.error(t(res.error));
      }
    });
  }

  const category = model.category_slug ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
          <DialogDescription>
            {t("Délai, devis, difficulté et style de ce modèle.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="settings-days">{t("Confection (jours)")}</Label>
            <Input
              id="settings-days"
              name="avg_days"
              type="number"
              min={1}
              max={365}
              step={1}
              defaultValue={model.avg_days ?? 7}
              placeholder="7"
            />
          </div>

          <QuoteModeField model={model} />

          <div className="space-y-2">
            <Label>{t("Difficulté")}</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as string)}
              items={difficultyItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("Non précisée")}</SelectItem>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {t(d.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ModelStyleEditor modelName={model.name} groups={styleGroups} onChange={setStyleGroups} />

          <BodyFitsNotice
            ready={!tailorBodyFitProblem(model.body_fits, bodyFits, category)}
            group={fitGroupLabel(fitGroupFor(category))}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("Annuler")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {styleUpload
                ? `${t("Photos")} ${styleUpload.done}/${styleUpload.total}…`
                : t("Enregistrer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Devis manuel ou automatique. En automatique, le tailleur fixe une fois son
 * prix, sa livraison et son délai : chaque demande de devis sur ce modèle reçoit
 * ce devis tout de suite (plus les suppléments des choix du client).
 */
function QuoteModeField({ model }: { model: GarmentModel }) {
  const t = useT();
  const [mode, setMode] = useState<QuoteMode>(model.quote_mode === "auto" ? "auto" : "manual");
  const choices: { value: QuoteMode; title: string; hint: string; icon: typeof Hand }[] = [
    {
      value: "manual",
      title: "Devis manuel",
      hint: "Vous lisez chaque demande et vous fixez le prix et le délai.",
      icon: Hand,
    },
    {
      value: "auto",
      title: "Devis automatique",
      hint: "Prix fixe : le client reçoit tout de suite le prix, la livraison et le délai.",
      icon: Zap,
    },
  ];

  return (
    <fieldset className="space-y-3 rounded-xl border p-3">
      <legend className="px-1 text-sm font-medium">{t("Devis")}</legend>
      <input type="hidden" name="quote_mode" value={mode} />
      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((c) => {
          const Icon = c.icon;
          const active = mode === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setMode(c.value)}
              aria-pressed={active}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                active ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted/50",
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block font-semibold">{t(c.title)}</span>
                <span className="text-muted-foreground block text-xs">{t(c.hint)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Toujours dans le formulaire : rebasculer en manuel garde les montants. */}
      <div className={cn("grid gap-3 sm:grid-cols-3", mode !== "auto" && "hidden")}>
        <div className="space-y-2">
          <Label htmlFor="settings-quote-price">{t("Prix fixe (FCFA)")}</Label>
          <Input
            id="settings-quote-price"
            name="quote_price"
            type="number"
            min={1}
            step={1}
            required={mode === "auto"}
            defaultValue={model.quote_price ?? model.price ?? ""}
            placeholder="35000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-quote-delivery">{t("Livraison (FCFA)")}</Label>
          <Input
            id="settings-quote-delivery"
            name="quote_delivery_fee"
            type="number"
            min={0}
            step={1}
            defaultValue={model.quote_delivery_fee ?? 0}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-quote-days">{t("Prête en (jours)")}</Label>
          <Input
            id="settings-quote-days"
            name="quote_ready_days"
            type="number"
            min={1}
            max={120}
            step={1}
            required={mode === "auto"}
            defaultValue={model.quote_ready_days ?? model.avg_days ?? 7}
            placeholder="7"
          />
        </div>
        <p className="text-muted-foreground text-xs sm:col-span-3">
          {t("Les suppléments de vos choix de style s'ajoutent au prix fixe. Livraison à 0 = gratuite. Vous pouvez toujours modifier un devis tant que le client n'a pas payé.")}
        </p>
      </div>
    </fieldset>
  );
}

/** Les mètres de tissu viennent de « Mes métrages », écrits une fois pour tous. */
function BodyFitsNotice({ ready, group }: { ready: boolean; group: string }) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        !ready && "border-amber-500/50 bg-amber-500/10",
      )}
    >
      <Ruler className="text-muted-foreground size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("Mètres de tissu")}</p>
        <p className="text-muted-foreground text-xs">
          {ready
            ? `${t("Repris de « Mes métrages »")} (${t(group)}).`
            : `${t("Remplissez « Mes métrages »")} (${t(group)}) ${t("une seule fois : ils valent pour tous vos modèles.")}`}
        </p>
      </div>
      <Link
        href="/tailleur/espace/metrages"
        className={buttonVariants({ variant: ready ? "ghost" : "default", size: "sm" })}
      >
        {ready ? t("Modifier") : t("Remplir")}
      </Link>
    </div>
  );
}
