"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/components/i18n/locale-provider";
import { ChipField, Section } from "@/components/dashboard/fabric-form-dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { saveFabricRecommendations } from "@/lib/actions/fabrics";
import {
  CARE_INSTRUCTIONS,
  DRAPES,
  OPACITIES,
  SALES_UNITS,
  STRETCHES,
  USAGES,
  WEIGHTS,
  parseSalesUnit,
} from "@/lib/fabric-specs";
import type { Fabric } from "@/lib/types";

/**
 * « Mes recommandations » du vendeur : pour chaque tissu, sa laize, le minimum
 * de commande, le toucher & tombé et l'entretien — sortis du formulaire d'ajout.
 */
export function VendorFabricRecommendations({ fabrics }: { fabrics: Fabric[] }) {
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const current = fabrics.find((f) => f.id === openId) ?? null;

  if (fabrics.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border p-4 text-sm">
        {t("Ajoutez d'abord un tissu : vos recommandations s'afficheront dessus.")}
      </p>
    );
  }

  return (
    <section className="max-w-xl space-y-3">
      <p className="text-muted-foreground text-sm">
        {t("Touchez un tissu : laize, minimum, toucher et entretien.")}
      </p>

      <div className="divide-y rounded-xl border">
        {fabrics.map((fabric) => {
          const filled = Boolean(fabric.width_cm);
          return (
            <button
              key={fabric.id}
              type="button"
              onClick={() => setOpenId(fabric.id)}
              className="hover:bg-muted/50 flex w-full items-center gap-3 p-3 text-left"
            >
              <span className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
                {fabric.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fabric.image_url} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{fabric.name}</span>
                <span className="text-muted-foreground block text-sm">
                  {filled
                    ? t("Laize {w} cm", { w: fabric.width_cm ?? 0 })
                    : t("À compléter")}
                </span>
              </span>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </button>
          );
        })}
      </div>

      {current && (
        <FabricRecommendationsDialog
          key={current.id}
          fabric={current}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}

function FabricRecommendationsDialog({
  fabric,
  onClose,
}: {
  fabric: Fabric;
  onClose: () => void;
}) {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const unit = parseSalesUnit(fabric.sales_unit);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveFabricRecommendations(fabric.id, formData);
      if (res.ok) {
        toast.success(t("Recommandations enregistrées."));
        onClose();
      } else {
        setError(t(res.error));
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fabric.name}</DialogTitle>
          <DialogDescription>{t("Tout est facultatif.")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</p>
          )}

          <Section n={1} title={t("Laize & minimum")}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reco-width">{t("Laize (cm)")}</Label>
                <Input
                  id="reco-width"
                  name="width_cm"
                  type="number"
                  min={30}
                  max={400}
                  step={1}
                  defaultValue={fabric.width_cm ?? ""}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reco-min">{t("Minimum")}</Label>
                <Input
                  id="reco-min"
                  name="min_order_qty"
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.5}
                  defaultValue={fabric.min_order_qty ?? 1}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              {t("Laize = largeur du tissu. Standard Wax : 115 cm, Lin/Coton/Bazin : 140-150 cm.")}{" "}
              {t("Minimum en {unit}.", { unit: t(SALES_UNITS[unit].many) })}
            </p>
          </Section>

          <Section n={2} title={t("Toucher & tombé")}>
            <ChipField
              label={t("Épaisseur")}
              name="weight"
              defaultValue={fabric.weight}
              options={Object.entries(WEIGHTS).map(([value, w]) => ({
                value,
                label: t(w.label),
                hint: t(w.hint),
              }))}
            />
            <div className="space-y-2">
              <Label htmlFor="reco-gsm">{t("Grammage (g/m²)")}</Label>
              <Input
                id="reco-gsm"
                name="grammage_gsm"
                type="number"
                min={10}
                max={1500}
                step={1}
                className="max-w-32"
                defaultValue={fabric.grammage_gsm ?? ""}
              />
            </div>
            <ChipField
              label={t("Opacité")}
              name="opacity"
              defaultValue={fabric.opacity}
              options={Object.entries(OPACITIES).map(([value, o]) => ({
                value,
                label: t(o.label),
                hint: o.hint ? t(o.hint) : undefined,
              }))}
            />
            <ChipField
              label={t("Tombé")}
              name="drape"
              defaultValue={fabric.drape}
              options={Object.entries(DRAPES).map(([value, d]) => ({ value, label: t(d.label) }))}
            />
            <ChipField
              label={t("Élasticité")}
              name="stretch"
              defaultValue={fabric.stretch}
              options={Object.entries(STRETCHES).map(([value, s]) => ({ value, label: t(s.label) }))}
            />
          </Section>

          <Section n={3} title={t("Entretien & usages")}>
            <ChipField
              multiple
              label={t("Entretien")}
              name="care_instructions"
              defaultValues={fabric.care_instructions ?? []}
              options={Object.entries(CARE_INSTRUCTIONS).map(([value, c]) => ({
                value,
                label: t(c.label),
              }))}
            />
            <ChipField
              multiple
              label={t("Idéal pour")}
              name="recommended_usages"
              defaultValues={fabric.recommended_usages ?? []}
              options={Object.entries(USAGES).map(([value, u]) => ({ value, label: t(u.label) }))}
            />
            <div className="space-y-2">
              <Label htmlFor="reco-description">{t("Description")}</Label>
              <Textarea
                id="reco-description"
                name="description"
                rows={2}
                defaultValue={fabric.description ?? ""}
                placeholder={t("Détails, tissage, usage recommandé…")}
              />
            </div>
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("Annuler")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t("Enregistrer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
