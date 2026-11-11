import Link from "@/components/i18n/link";

import { EuropeBadge } from "@/components/europe/europe-badge";
import { EuropePrice } from "@/components/europe/europe-price";
import { deliveryPolicy } from "@/lib/delivery";
import { europeTypeInfo, makingTypeLabel, originLabel } from "@/lib/europe";
import type { GarmentModel } from "@/lib/types";
import { getT } from "@/lib/i18n/server";

/**
 * La fiche d'une création JALOFA EUROPE, en un coup d'œil : qui la fait, où,
 * dans quelle matière, sur mesure ou non, en combien de temps, comment elle
 * arrive. Tout vient de ce que l'atelier a publié ; une ligne vide n'est pas
 * affichée.
 */
export async function EuropeProductFacts({ model }: { model: GarmentModel }) {
  const t = await getT();
  const origin = model.origin;
  if (!origin?.europe) return null;

  const type = europeTypeInfo(model.europe_type);
  const making = makingTypeLabel(model.making_type);
  const place = originLabel(origin);

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: t("Atelier"),
      value: model.tailor_id ? (
        <Link href={`/tailleurs/${model.tailor_id}`} className="underline underline-offset-4">
          {origin.shop_name ?? t("L'atelier")}
        </Link>
      ) : (
        origin.shop_name
      ),
    },
    { label: t("Fabriqué à"), value: place },
    { label: t("Catégorie"), value: type ? t(type.short) : null },
    { label: t("Matière et tissu"), value: model.material },
    { label: t("Confection"), value: making ? t(making) : null },
    {
      label: t("Tailles"),
      value:
        model.making_type === "pret_a_porter"
          ? model.sizes
          : model.sizes
            ? `${model.sizes} · ${t("ou sur mesure, à vos mesures")}`
            : t("Sur mesure, à vos mesures"),
    },
    { label: t("Délai de confection"), value: t("~{n} jours", { n: model.avg_days }) },
    { label: t("Livraison"), value: t(deliveryPolicy(model.delivery_zone)) },
    {
      label: t("Prix"),
      value:
        model.price != null ? (
          <span>
            {t("Dès")} <EuropePrice amount={model.price} className="font-medium" />
          </span>
        ) : null,
    },
  ];

  return (
    <section className="mt-5 rounded-xl border border-white/15 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <EuropeBadge country={origin.country} />
      </div>
      <dl className="mt-3 divide-y divide-white/10 text-sm">
        {rows
          .filter((row) => row.value)
          .map((row) => (
            <div key={row.label} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0">{row.value}</dd>
            </div>
          ))}
      </dl>
      <p className="text-muted-foreground mt-3 text-xs">
        {t("Le paiement se fait en FCFA ; le prix en euros est la conversion exacte (1 € = 655,957 FCFA).")}
      </p>
    </section>
  );
}
