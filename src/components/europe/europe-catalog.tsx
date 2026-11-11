"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { CatalogTile } from "@/components/catalog/models-catalog";
import { useT } from "@/components/i18n/locale-provider";
import { EUROPE_TYPES, eurToXof, matchesMaking, type EuropeType } from "@/lib/europe";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "";

/** Tranches de prix en euros : c'est la devise des ateliers européens. */
const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: "0-200", label: "Moins de 200 €", min: 0, max: 200 },
  { value: "200-500", label: "200 € à 500 €", min: 200, max: 500 },
  { value: "500-1000", label: "500 € à 1 000 €", min: 500, max: 1000 },
  { value: "1000-", label: "Plus de 1 000 €", min: 1000, max: Number.POSITIVE_INFINITY },
];

const MAKING_FILTERS: { value: "sur_mesure" | "pret_a_porter"; label: string }[] = [
  { value: "sur_mesure", label: "Sur mesure" },
  { value: "pret_a_porter", label: "Prêt-à-porter" },
];

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-white/25 bg-black pr-9 pl-3 text-base text-white md:text-sm"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </span>
    </label>
  );
}

/**
 * La vitrine filtrable de JALOFA EUROPE. Tout s'affiche, quel que soit le pays
 * du visiteur ; les filtres (catégorie, pays, ville, prix, confection) ne font
 * que restreindre. Le filtrage se fait ici, sur les produits déjà chargés.
 */
export function EuropeCatalog({
  models,
  initialType,
}: {
  models: GarmentModel[];
  initialType?: EuropeType | null;
}) {
  const t = useT();
  const [type, setType] = useState<string>(initialType ?? ALL);
  const [country, setCountry] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [price, setPrice] = useState(ALL);
  const [making, setMaking] = useState(ALL);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const countries = useMemo(
    () =>
      [...new Set(models.map((m) => m.origin?.country).filter((c): c is string => !!c))].sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [models],
  );
  const cities = useMemo(
    () =>
      [
        ...new Set(
          models
            .filter((m) => !country || m.origin?.country === country)
            .map((m) => m.origin?.city?.trim())
            .filter((c): c is string => !!c),
        ),
      ].sort((a, b) => a.localeCompare(b, "fr")),
    [models, country],
  );

  const visible = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.value === price);
    return models.filter((m) => {
      if (type && m.europe_type !== type) return false;
      if (country && m.origin?.country !== country) return false;
      if (city && m.origin?.city?.trim() !== city) return false;
      if (making && !matchesMaking(m.making_type, making as "sur_mesure" | "pret_a_porter"))
        return false;
      if (range) {
        if (m.price == null) return false;
        if (m.price < eurToXof(range.min) || m.price >= eurToXof(range.max)) return false;
      }
      return true;
    });
  }, [models, type, country, city, price, making]);

  const activeCount = [country, city, price, making].filter(Boolean).length;

  function reset() {
    setType(ALL);
    setCountry(ALL);
    setCity(ALL);
    setPrice(ALL);
    setMaking(ALL);
  }

  return (
    <div>
      {/* Les catégories, toujours visibles : c'est le premier choix. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {[{ value: ALL, label: "Tout" }, ...EUROPE_TYPES].map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            aria-pressed={type === item.value}
            onClick={() => setType(item.value)}
            className={cn(
              "h-11 shrink-0 rounded-lg border px-4 text-sm font-medium whitespace-nowrap transition-colors md:px-5",
              type === item.value
                ? "border-white bg-white text-black"
                : "border-white/25 hover:border-white",
            )}
          >
            {t(item.label)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-medium hover:border-white md:hidden"
        >
          <SlidersHorizontal className="size-4" />
          {t("Filtres")}
          {activeCount > 0 && (
            <span className="rounded-full bg-white px-1.5 text-xs text-black">{activeCount}</span>
          )}
        </button>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {t("{n} créations", { n: visible.length })}
        </p>
        {(activeCount > 0 || type) && (
          <button
            type="button"
            onClick={reset}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <X className="size-4" /> {t("Tout effacer")}
          </button>
        )}
      </div>

      <div
        className={cn(
          "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid md:grid-cols-4",
          filtersOpen ? "grid" : "hidden",
        )}
      >
        <SelectField
          label={t("Pays de l'atelier")}
          value={country}
          onChange={(v) => {
            setCountry(v);
            setCity(ALL);
          }}
        >
          <option value={ALL}>{t("Tous les pays")}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {t(c)}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("Ville")} value={city} onChange={setCity}>
          <option value={ALL}>{t("Toutes les villes")}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("Prix")} value={price} onChange={setPrice}>
          <option value={ALL}>{t("Tous les prix")}</option>
          {PRICE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.label)}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("Confection")} value={making} onChange={setMaking}>
          <option value={ALL}>{t("Sur mesure et prêt-à-porter")}</option>
          {MAKING_FILTERS.map((m) => (
            <option key={m.value} value={m.value}>
              {t(m.label)}
            </option>
          ))}
        </SelectField>
      </div>

      {visible.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3 md:gap-x-3 lg:grid-cols-4">
          {visible.map((model) => {
            const info = EUROPE_TYPES.find((e) => e.value === model.europe_type);
            return (
              <CatalogTile
                key={model.id}
                model={model}
                categoryName={info?.short}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-white/20 px-6 py-14 text-center">
          <p className="text-lg font-medium">
            {models.length === 0
              ? t("Les premiers ateliers européens arrivent.")
              : t("Aucune création ne correspond à ces filtres.")}
          </p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            {models.length === 0
              ? t("Robes, smokings, costumes et chemises, faits en Europe : revenez très bientôt.")
              : t("Essayez une autre catégorie, un autre pays ou une autre tranche de prix.")}
          </p>
        </div>
      )}
    </div>
  );
}
