"use client";

import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { formatPrice } from "@/lib/constants";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

// Choix du tissu pour la version personnalisée : il se fait ICI, sur la fiche du
// modèle, puis voyage dans le configurateur via `?fabric=`. Le configurateur est
// une page d'achat — il ne rechoisit plus le tissu, il n'en règle que le métrage.
export function FabricPicker({
  fabrics,
  groups,
  value,
  onChange,
}: {
  fabrics: Fabric[];
  /** Plusieurs rangées titrées (« Tissus de l'atelier », « Autres vendeurs »).
   *  Absent : une seule rangée avec tous les `fabrics`. */
  groups?: { label: string; fabrics: Fabric[] }[];
  value: string | null;
  onChange: (fabricId: string) => void;
}) {
  // Ce que le vendeur a écrit sur son tissu se lit ICI, sans quitter la fiche
  // du vêtement : partir vers /tissus, c'est perdre le modèle en cours de
  // choix. Le dépliant reste ouvert quand on change de pastille — on compare.
  const [details, setDetails] = useState(false);
  const t = useT();
  const detailsId = useId();
  const selected = fabrics.find((f) => f.id === value) ?? null;

  if (fabrics.length === 0) return null;

  const rows = (groups ?? [{ label: "", fabrics }]).filter((g) => g.fabrics.length > 0);

  return (
    <div>
      <p className="text-sm font-medium">{t("Choisissez votre tissu")}</p>
      {rows.map((row) => (
        <div key={row.label} className="mt-2">
          {row.label && (
            <p className="text-muted-foreground mb-1.5 text-xs font-medium">{row.label}</p>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {row.fabrics.map((f) => {
              const active = f.id === value;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => onChange(f.id)}
                  aria-pressed={active}
                  aria-label={f.name}
                  title={f.name}
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-lg border transition-colors",
                    active ? "border-primary ring-primary/30 ring-2" : "hover:border-border",
                  )}
                >
                  {f.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image_url} alt={f.name} className="size-full object-cover" />
                  )}
                  {active && (
                    <span className="text-primary-foreground bg-primary absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {selected && (
        <div className="mt-2">
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">{selected.name}</span>
            {selected.color ? ` · ${selected.color}` : ""} ·{" "}
            {formatPrice(selected.price_per_meter)} / m
          </p>

          <button
            type="button"
            onClick={() => setDetails((d) => !d)}
            aria-expanded={details}
            aria-controls={details ? detailsId : undefined}
            className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
          >
            {details ? t("Voir moins") : t("Voir plus")}
            <ChevronDown
              className={cn("size-3.5 transition-transform", details && "rotate-180")}
              aria-hidden
            />
          </button>

          {details && (
            <div id={detailsId} className="bg-muted/40 mt-2 rounded-xl border p-3.5">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {selected.description ?? t("Le vendeur n'a pas encore détaillé cette matière.")}
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex gap-3">
                  <dt className="text-muted-foreground w-24 shrink-0">{t("Matière")}</dt>
                  <dd>{selected.material ?? "—"}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-muted-foreground w-24 shrink-0">{t("Coloris")}</dt>
                  <dd>{selected.color ?? "—"}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
