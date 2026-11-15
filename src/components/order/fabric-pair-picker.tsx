"use client";

import Image from "next/image";
import { Check } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import { formatPrice } from "@/lib/constants";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * « Tissu différent » : le client choisit un tissu pour la veste et un autre
 * pour le pantalon. Deux rangées de pastilles qui défilent, la pastille choisie
 * cochée et son nom rappelé dans le titre.
 */
export function FabricPairPicker({
  fabrics,
  jacketId,
  trousersId,
  onJacket,
  onTrousers,
  vestId,
  onVest,
}: {
  fabrics: Fabric[];
  jacketId: string | null;
  trousersId: string | null;
  onJacket: (id: string) => void;
  onTrousers: (id: string) => void;
  /** Costume 3 pièces : une troisième rangée pour le gilet. */
  vestId?: string | null;
  onVest?: (id: string) => void;
}) {
  const available = fabrics.filter((f) => f.is_active && f.in_stock !== false);
  if (available.length === 0) return null;

  return (
    <div className="mt-4 space-y-4 rounded-xl border p-3">
      <FabricRow label="Tissu de la veste" fabrics={available} value={jacketId} onChange={onJacket} />
      <FabricRow
        label="Tissu du pantalon"
        fabrics={available}
        value={trousersId}
        onChange={onTrousers}
      />
      {onVest && (
        <FabricRow
          label="Tissu du gilet"
          fabrics={available}
          value={vestId ?? null}
          onChange={onVest}
        />
      )}
    </div>
  );
}

function FabricRow({
  label,
  fabrics,
  value,
  onChange,
}: {
  label: string;
  fabrics: Fabric[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const t = useT();
  const chosen = fabrics.find((f) => f.id === value);
  return (
    <div>
      <p className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold">{t(label)}</span>
        {chosen && <span className="text-muted-foreground text-xs">· {chosen.name}</span>}
      </p>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {fabrics.map((f) => {
          const active = f.id === value;
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => onChange(f.id)}
              aria-pressed={active}
              className="group/fab flex w-16 shrink-0 snap-start flex-col items-center gap-1 text-center"
            >
              <span
                className={cn(
                  "bg-muted relative block size-11 overflow-hidden sm:size-14 rounded-lg border transition-colors",
                  active
                    ? "border-primary ring-primary/40 ring-1"
                    : "border-border/60 group-hover/fab:border-foreground/30",
                )}
              >
                {f.image_url && (
                  <Image src={f.image_url} alt={f.name} fill sizes="56px" className="object-cover" />
                )}
                {active && (
                  <span className="text-primary-foreground bg-primary absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "line-clamp-2 text-[9px] uppercase leading-tight tracking-wide",
                  active ? "text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                {f.name}
              </span>
              <span className="text-muted-foreground whitespace-nowrap text-[9px]">
                {formatPrice(f.price_per_meter)}/m
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
