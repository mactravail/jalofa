"use client";

import { BookmarkCheck, UserPlus } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type SavedChoice = "saved" | "other" | null;

/**
 * « Utiliser vos informations enregistrées ? » — posé au client connecté à
 * chaque commande : il a pu changer d'adresse ou de numéro, ou commander pour
 * quelqu'un d'autre. Deux gros boutons, puis une ligne pour revenir sur le choix.
 */
export function SavedInfoPrompt({
  title,
  summary,
  choice,
  onChoose,
  otherLabel,
  className,
}: {
  title: string;
  /** Ce qui est enregistré, en une ou deux lignes. */
  summary: string[];
  choice: SavedChoice;
  onChoose: (choice: "saved" | "other") => void;
  /** Le bouton « non » : « Autre adresse », « Pour quelqu'un d'autre »… */
  otherLabel: string;
  className?: string;
}) {
  const t = useT();

  if (choice) {
    return (
      <div
        className={cn(
          "bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm",
          className,
        )}
      >
        <span className="flex items-center gap-2">
          {choice === "saved" ? (
            <BookmarkCheck className="size-4 text-emerald-500" />
          ) : (
            <UserPlus className="text-muted-foreground size-4" />
          )}
          {choice === "saved" ? t("Informations enregistrées utilisées") : t(otherLabel)}
        </span>
        <button
          type="button"
          onClick={() => onChoose(choice === "saved" ? "other" : "saved")}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
        >
          {choice === "saved" ? t("Utiliser d'autres informations") : t("Reprendre mes informations")}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4", className)}>
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <BookmarkCheck className="size-4 text-emerald-500" />
          {t(title)}
        </p>
        {summary.map((line) => (
          <p key={line} className="text-muted-foreground mt-1 text-sm">
            {line}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChoose("saved")}
          className="bg-foreground text-background h-11 rounded-lg px-2 text-sm font-semibold"
        >
          {t("Oui, les utiliser")}
        </button>
        <button
          type="button"
          onClick={() => onChoose("other")}
          className="hover:bg-muted h-11 rounded-lg border px-2 text-sm font-semibold"
        >
          {t(otherLabel)}
        </button>
      </div>
    </div>
  );
}
