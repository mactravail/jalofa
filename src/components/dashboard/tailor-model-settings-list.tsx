"use client";

import { useState } from "react";
import { ChevronRight, Clock } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import { ModelSettingsDialog } from "@/components/dashboard/model-settings-dialog";
import type { TailorBodyFits } from "@/lib/model-body-fit";
import type { GarmentModel } from "@/lib/types";

/** « Mes recommandations » : chaque modèle, et ses réglages en un toucher. */
export function TailorModelSettingsList({
  models,
  bodyFits,
}: {
  models: GarmentModel[];
  bodyFits: TailorBodyFits;
}) {
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const current = models.find((m) => m.id === openId) ?? null;

  return (
    <section className="max-w-xl space-y-3">
      <div>
        <h2 className="text-base font-semibold">{t("Réglages de chaque modèle")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("Touchez un modèle : délai, devis, difficulté et style.")}
        </p>
      </div>

      <div className="divide-y rounded-xl border">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => setOpenId(model.id)}
            className="hover:bg-muted/50 flex w-full items-center gap-3 p-3 text-left"
          >
            <span className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
              {model.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={model.image_url} alt="" className="size-full object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{model.name}</span>
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <Clock className="size-3.5" />
                {t("~{n} j", { n: model.avg_days })}
                {" · "}
                {model.quote_mode === "auto" ? t("Devis automatique") : t("Devis manuel")}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground size-5 shrink-0" />
          </button>
        ))}
      </div>

      {current && (
        <ModelSettingsDialog
          key={current.id}
          model={current}
          bodyFits={bodyFits}
          open
          onOpenChange={(open) => !open && setOpenId(null)}
        />
      )}
    </section>
  );
}
