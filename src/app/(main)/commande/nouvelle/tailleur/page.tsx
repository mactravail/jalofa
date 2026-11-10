"use client";

import { useEffect } from "react";
import { BadgeCheck } from "lucide-react";

import { useConfigurator } from "@/components/order/configurator-context";
import { formatPrice } from "@/lib/constants";
import { tailoringPriceFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

export default function TailorStep() {
  const { data, state, update } = useConfigurator();
  const tr = useT();

  // Une création signée : son auteur est proposé d'office (en tête, déjà
  // coché), mais le client reste libre de confier la confection à un autre.
  const model = data.models.find((m) => m.id === state.modelId) ?? null;
  const author = model?.tailor_id
    ? (data.tailors.find((t) => t.id === model.tailor_id) ?? null)
    : null;
  const tailors = author
    ? [author, ...data.tailors.filter((t) => t.id !== author.id)]
    : data.tailors;

  // Présélection seulement quand rien n'est encore choisi : un autre tailleur
  // retenu par le client n'est jamais écrasé.
  const authorId = author?.id ?? null;
  const { tailorId } = state;
  useEffect(() => {
    if (authorId && !tailorId) update({ tailorId: authorId });
  }, [authorId, tailorId, update]);

  return (
    <div className="grid gap-3">
      {author && (
        <p className="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-xs">
          <span className="text-foreground font-medium">{model?.name}</span>{" "}
          {tr("est une création de {name} : son atelier est choisi par défaut. Vous pouvez aussi choisir un autre tailleur.", { name: author.shop_name ?? "" })}
        </p>
      )}

      {tailors.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => update({ tailorId: t.id })}
          className={cn(
            "flex gap-3 overflow-hidden rounded-xl border p-2 text-left transition-colors",
            state.tailorId === t.id
              ? "border-primary ring-primary/30 ring-2"
              : "hover:bg-muted",
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
                  <BadgeCheck className="size-3" /> {tr("Créateur du modèle")}
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
                    : tr("dès {price}", { price: formatPrice(price) });
                return `${label} · ${tr("{n} j", { n: t.avg_delivery_days })} · ★ ${t.rating.toFixed(1)}`;
              })()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
