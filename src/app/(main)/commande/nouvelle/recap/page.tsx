"use client";

import Image from "next/image";

import { useConfigurator } from "@/components/order/configurator-context";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEASUREMENT_FIELDS, formatPrice } from "@/lib/constants";
import { styleDetailSummary } from "@/lib/style-options";

export default function ReviewStep() {
  const { data, state, update, model, fabric, tailor, price } = useConfigurator();

  const styleName = data.styles.find((s) => s.slug === state.styleSlug)?.name ?? null;
  const isFabricOnly = state.type === "fabric_only";

  const personalisation =
    isFabricOnly ? [] : styleDetailSummary(model, state.styleDetails);

  const styleRefs = isFabricOnly ? [] : state.styleRefs;

  const measurementSummary =
    isFabricOnly
      ? null
      : state.measurementMode === "standard"
        ? `Taille ${state.standardSize}`
        : (() => {
            const filled = MEASUREMENT_FIELDS.filter((f) => state.manual[f.key]?.trim());
            return filled.length
              ? filled.map((f) => `${f.label} ${state.manual[f.key]} cm`).join(" · ")
              : "Mesures détaillées";
          })();

  const rows: { label: string; value: string | null }[] = [
    { label: "Modèle", value: model?.name ?? null },
    { label: "Occasion", value: styleName },
    ...personalisation.map((d) => ({ label: d.group, value: d.option })),
    {
      label: "Tissu",
      value:
        state.type === "own_fabric"
          ? "Tissu personnel"
          : fabric
            ? `${fabric.name} · ${state.fabricMeters} m`
            : null,
    },
    { label: "Tailleur", value: tailor?.shop_name ?? null },
    { label: "Mesures", value: measurementSummary },
  ].filter((r) => r.value !== null);

  return (
    <div className="space-y-6">
      <dl className="divide-border overflow-hidden rounded-xl border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 border-b px-4 py-3 last:border-b-0">
            <dt className="text-muted-foreground text-sm">{r.label}</dt>
            <dd className="text-right text-sm font-medium">{r.value}</dd>
          </div>
        ))}
        <div className="bg-muted/40 flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm font-semibold">
            {isFabricOnly ? "Sous-total" : "À partir de"}
          </dt>
          <dd className="text-primary text-right text-base font-bold">
            {formatPrice(price.total)}
          </dd>
        </div>
      </dl>

      {!isFabricOnly && (
        <p className="text-muted-foreground -mt-3 text-xs">
          Prix indicatif : en personnalisant, vous demandez un devis. Le tailleur
          vous répondra avec le prix final.
        </p>
      )}

      {styleRefs.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">
            Vos inspirations ({styleRefs.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {styleRefs.map((ref) => (
              <div
                key={ref.id}
                className="bg-muted/40 relative size-16 overflow-hidden rounded-lg border"
              >
                <Image
                  src={ref.dataUrl}
                  alt={ref.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Ces photos seront transmises au tailleur avec votre commande.
          </p>
        </section>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">
          {isFabricOnly ? "Note pour le vendeur (facultatif)" : "Note pour le tailleur (facultatif)"}
        </Label>
        <Textarea
          id="notes"
          value={state.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder={
            isFabricOnly
              ? "Précisions sur la quantité, la découpe, la date souhaitée..."
              : "Précisions sur le style, les finitions, la date souhaitée..."
          }
        />
      </div>

      <p className="text-muted-foreground text-sm">
        {isFabricOnly ? (
          <>
            Ajoutez ce tissu au panier. La livraison et le paiement seront choisis
            à la caisse, pour l&apos;ensemble de votre commande.
          </>
        ) : (
          <>
            Envoyez votre demande de devis : gratuit et sans engagement. Le
            tailleur vous répondra avec le prix final, puis vous accepterez et
            paierez.
          </>
        )}
      </p>
    </div>
  );
}
