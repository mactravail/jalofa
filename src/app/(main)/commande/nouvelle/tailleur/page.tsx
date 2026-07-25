"use client";

import { useEffect } from "react";
import { BadgeCheck, Lock } from "lucide-react";

import { useConfigurator } from "@/components/order/configurator-context";
import { formatPrice } from "@/lib/constants";
import { tailoringPriceFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export default function TailorStep() {
  const { data, state, update } = useConfigurator();

  // Une création signée se confectionne chez son auteur : il est le seul choix.
  const model = data.models.find((m) => m.id === state.modelId) ?? null;
  const author = model?.tailor_id
    ? (data.tailors.find((t) => t.id === model.tailor_id) ?? null)
    : null;
  const tailors = author ? [author] : data.tailors;

  // La fiche modèle passe déjà `?tailor=`, mais on ne peut pas s'y fier : on
  // repasse aussi par ici via le fil d'Ariane, avec le tailleur d'un brouillon
  // précédent encore en mémoire.
  const lockedId = author?.id ?? null;
  const { tailorId } = state;
  useEffect(() => {
    if (lockedId && tailorId !== lockedId) update({ tailorId: lockedId });
  }, [lockedId, tailorId, update]);

  return (
    <div className="grid gap-3">
      {author && (
        <p className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-lg border p-3 text-xs">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="text-foreground font-medium">{model?.name}</span> est
            une création de {author.shop_name} — c&apos;est son atelier qui la
            confectionne. Pour choisir un autre tailleur, partez d&apos;un modèle
            du catalogue.
          </span>
        </p>
      )}

      {tailors.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => update({ tailorId: t.id })}
          disabled={Boolean(author)}
          className={cn(
            "flex gap-3 overflow-hidden rounded-xl border p-2 text-left transition-colors",
            state.tailorId === t.id
              ? "border-primary ring-primary/30 ring-2"
              : "hover:bg-muted",
            author && "cursor-default",
          )}
        >
          {t.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.cover_url}
              alt={t.shop_name ?? ""}
              className="size-20 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 py-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{t.shop_name}</p>
              {author?.id === t.id && (
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                  <BadgeCheck className="size-3" /> Créateur du modèle
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">{t.city}</p>
            <p className="mt-1 text-xs">
              {(() => {
                const price = tailoringPriceFor(t, model);
                const label =
                  model?.tailor_id === t.id && model?.price != null
                    ? formatPrice(price)
                    : `dès ${formatPrice(price)}`;
                return `${label} · ${t.avg_delivery_days} j · ★ ${t.rating.toFixed(1)}`;
              })()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
