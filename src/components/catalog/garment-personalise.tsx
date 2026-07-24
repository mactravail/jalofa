"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check, ChevronDown, ChevronRight, Wand2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { formatMeters } from "@/lib/fabric-metrage";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";

// « Le personnaliser » : le tissu se choisit ICI, sur la fiche du modèle, puis
// voyage dans le configurateur via `?fabric=`. Le configurateur est une page
// d'achat — il ne rechoisit plus le tissu, il n'en règle que le métrage.
export function GarmentPersonalise({
  fabrics,
  orderParams,
  initialFabricId,
}: {
  fabrics: Fabric[];
  /** Query string sans `fabric` (type / model / tailor déjà posés). */
  orderParams: string;
  /** Tissu déjà retenu en amont (ex. arrivé de /tissus). */
  initialFabricId?: string | null;
}) {
  const [fabricId, setFabricId] = useState<string | null>(
    initialFabricId ?? fabrics[0]?.id ?? null,
  );
  // Ce que le vendeur a écrit sur son tissu se lit ICI, sans quitter la fiche
  // du vêtement : partir vers /tissus, c'est perdre le modèle en cours de
  // choix. Le dépliant reste ouvert quand on change de pastille — on compare.
  const [details, setDetails] = useState(false);
  const detailsId = useId();
  const selected = fabrics.find((f) => f.id === fabricId) ?? null;

  const href = fabricId
    ? `/commande/nouvelle?${orderParams}&fabric=${fabricId}`
    : `/commande/nouvelle?${orderParams}`;

  return (
    <div className="bg-card rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Wand2 className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">Le personnaliser</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Choisissez le tissu, puis le style, les finitions et le tailleur.
          </p>
        </div>
      </div>

      {fabrics.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">Tissu</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {fabrics.map((f) => {
              const active = f.id === fabricId;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFabricId(f.id)}
                  aria-pressed={active}
                  aria-label={f.name}
                  title={f.name}
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-lg border transition-colors",
                    active
                      ? "border-primary ring-primary/30 ring-2"
                      : "hover:border-border",
                  )}
                >
                  {f.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.image_url}
                      alt={f.name}
                      className="size-full object-cover"
                    />
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
                {details ? "Voir moins" : "Voir plus"}
                <ChevronDown
                  className={cn("size-3.5 transition-transform", details && "rotate-180")}
                  aria-hidden
                />
              </button>

              {details && (
                <div id={detailsId} className="bg-muted/40 mt-2 rounded-xl border p-3.5">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {selected.description ??
                      "Le vendeur n'a pas encore détaillé cette matière."}
                  </p>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex gap-3">
                      <dt className="text-muted-foreground w-24 shrink-0">Matière</dt>
                      <dd>{selected.material ?? "—"}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-muted-foreground w-24 shrink-0">Coloris</dt>
                      <dd>{selected.color ?? "—"}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-muted-foreground w-24 shrink-0">En stock</dt>
                      <dd>{formatMeters(selected.stock_meters)}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/tissus/${selected.id}`}
                    className="text-muted-foreground hover:text-foreground mt-3 inline-flex items-center gap-0.5 text-sm underline-offset-2 hover:underline"
                  >
                    Fiche complète du tissu
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Link
        href={href}
        className={cn(buttonVariants({ size: "lg" }), "mt-5 h-11 w-full text-base")}
      >
        Personnaliser <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
