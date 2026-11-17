"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";

/** Le brouillon a été repris : on le dit, et on peut repartir de zéro. */
export function DraftNotice({
  onStartOver,
  withPhotos = true,
}: {
  onStartOver: () => void;
  /** Le formulaire a des photos, qui ne se gardent pas dans le brouillon. */
  withPhotos?: boolean;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p className="min-w-0 flex-1">
        {t("Nous avons repris ce que vous aviez rempli.")}
        {withPhotos && (
          <>
            {" "}
            <span className="text-muted-foreground">
              {t("Les photos ajoutées ne sont pas gardées : remettez-les.")}
            </span>
          </>
        )}
      </p>
      <Button type="button" variant="ghost" size="sm" onClick={onStartOver}>
        <RotateCcw className="size-4" />
        {t("Recommencer")}
      </Button>
    </div>
  );
}
