"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import Link from "@/components/i18n/link";
import { useT } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveMyCareTips } from "@/lib/actions/models";
import { careTipLines, MAX_CARE_TIPS_LENGTH } from "@/lib/model-style";
import { CARE_TIP_SUGGESTIONS } from "@/lib/style-presets";

/** « Mes recommandations » : une liste, écrite une fois pour tous les modèles. */
export function TailorCareTipsForm({
  tips: initial,
  modelCount,
}: {
  tips: string;
  modelCount: number;
}) {
  const t = useT();
  const [tips, setTips] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const lines = careTipLines(tips);
  const suggestions = CARE_TIP_SUGGESTIONS.map((tip) => t(tip)).filter(
    (tip) => !lines.includes(tip),
  );

  function save() {
    startTransition(async () => {
      const result = await saveMyCareTips(tips);
      if (result.ok) {
        toast.success(t("Recommandations enregistrées : elles s'affichent sur tous vos modèles."));
      } else {
        toast.error(t(result.error));
      }
    });
  }

  if (modelCount === 0) {
    return (
      <div className="max-w-xl rounded-xl border p-4 text-sm">
        <p>{t("Ajoutez d'abord un modèle : vos recommandations s'afficheront dessus.")}</p>
        <Link
          href="/tailleur/espace/creations?nouveau=1"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 font-semibold text-white"
        >
          <Plus className="size-4" /> {t("Ajouter un modèle")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-muted-foreground text-sm">
        {t("Touchez pour ajouter, ou écrivez les vôtres. Une recommandation par ligne.")}
      </p>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tip) => (
            <button
              key={tip}
              type="button"
              onClick={() => setTips((prev) => [...careTipLines(prev), tip].join("\n"))}
              className="hover:bg-muted flex items-center gap-1 rounded-full border px-3 py-2 text-left text-sm font-medium"
            >
              <Plus className="size-4 shrink-0" />
              {tip}
            </button>
          ))}
        </div>
      )}

      <Textarea
        aria-label={t("Mes recommandations")}
        rows={6}
        maxLength={MAX_CARE_TIPS_LENGTH}
        value={tips}
        onChange={(e) => setTips(e.target.value)}
        placeholder={t("Ex. Ne pas mettre de parfum directement sur le tissu")}
      />

      <Button onClick={save} disabled={isPending} className="h-12 w-full text-base">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {t("Enregistrer")}
      </Button>
    </div>
  );
}
