"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { ChevronDown, X } from "lucide-react";

import { ProductPrice } from "@/components/europe/europe-price";
import { EuropeBadge } from "@/components/europe/europe-badge";
import { modelHref } from "@/lib/model-href";
import { modelPhotos } from "@/lib/constants";
import { display } from "@/lib/display-font";
import type { GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

// La page /modeles façon « collection » (Dolly Noire) : un hero photo avec le
// titre en bas à gauche, une barre noire FILTRER / TRIER PAR / N MODÈLES, puis
// une grille bord à bord de tuiles grises — le nom et le prix en dessous.

type Sort = "featured" | "price-asc" | "price-desc" | "fastest";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "En vedette" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "fastest", label: "Le plus rapide" },
];

const HERO = {
  src: "/models/mood-hero.jpg",
  alt: "Trois personnes en tenue, sous un faisceau de lumière dans le noir",
};

export function ModelsCatalog({
  models,
  categories,
  initialCategory,
  initialQuery,
  context,
}: {
  models: GarmentModel[];
  categories: { slug: string; name: string }[];
  initialCategory?: string;
  initialQuery?: string;
  context?: string;
}) {
  const [category, setCategory] = useState<string | null>(
    initialCategory ?? null,
  );
  const [query, setQuery] = useState(initialQuery ?? "");
  const t = useT();
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(Boolean(initialQuery));

  // Seules les catégories qui ont au moins un modèle méritent un bouton.
  const usedCategories = useMemo(
    () =>
      categories.filter((c) => models.some((m) => m.category_slug === c.slug)),
    [categories, models],
  );

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.slug, c.name])),
    [categories],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = models.filter(
      (m) =>
        (!category || m.category_slug === category) &&
        (!q || m.name.toLowerCase().includes(q)),
    );
    // Sans prix propre, un modèle part en fin de liste quel que soit le sens.
    const price = (m: GarmentModel, dir: 1 | -1) =>
      m.price == null ? Number.POSITIVE_INFINITY : dir * m.price;
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => price(a, 1) - price(b, 1));
      case "price-desc":
        return [...list].sort((a, b) => price(a, -1) - price(b, -1));
      case "fastest":
        return [...list].sort((a, b) => a.avg_days - b.avg_days);
      default:
        return list;
    }
  }, [models, category, query, sort]);

  const activeFilters = (category ? 1 : 0) + (query.trim() ? 1 : 0);

  return (
    <div className="bg-black text-white">
      {/* Hero ------------------------------------------------------------ */}
      <section className="relative h-[70svh] min-h-[26rem] overflow-hidden bg-black md:h-[38rem]">
        {/* La photo est sombre à gauche : le titre s'y pose, les trois
            silhouettes restent visibles à droite. */}
        <Image
          src={HERO.src}
          alt={t(HERO.alt)}
          fill
          preload
          sizes="100vw"
          className="object-cover object-[72%_30%] md:object-[center_35%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-transparent via-45% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-10 md:px-8 md:pb-14">
          <p
            className={cn(
              display.className,
              "text-xs tracking-[0.3em] text-white/70 uppercase md:text-sm",
            )}
          >
            {t("Collection · Sur mesure")}
          </p>
          <h1
            className={cn(
              display.className,
              "mt-3 text-6xl leading-[0.95] tracking-tight md:text-8xl",
            )}
          >
            {t("Modèles")}
          </h1>
          <p className="mt-4 max-w-md text-base text-white/80 md:text-lg">
            {t("Des habits coupés pour vous, par un tailleur, à vos mesures.")}
          </p>
        </div>
      </section>

      {/* Barre filtre / tri ------------------------------------------------ */}
      <div className="border-y border-white/10">
        <div
          className={cn(
            display.className,
            "mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 text-sm tracking-[0.12em] uppercase md:px-8",
          )}
        >
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="flex h-10 items-center gap-2 transition-opacity hover:opacity-70"
          >
            {t("Filtrer")}
            {activeFilters > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-white text-[11px] text-black">
                {activeFilters}
              </span>
            )}
          </button>

          <label className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline">{t("Trier par :")}</span>
            <span className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 appearance-none rounded-md border border-white/25 bg-black py-0 pr-9 pl-3 tracking-[0.12em] uppercase outline-none focus-visible:border-white sm:min-w-56"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.label)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            </span>
          </label>

          <span className="hidden whitespace-nowrap sm:inline">
            {visible.length > 1 ? t("{n} modèles", { n: visible.length }) : t("{n} modèle", { n: visible.length })}
          </span>
        </div>
      </div>

      {filtersOpen && (
        <div className="mx-auto max-w-7xl space-y-4 border-b border-white/10 px-4 py-5 md:px-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Rechercher un modèle…")}
            className="h-11 w-full max-w-sm rounded-md border border-white/25 bg-black px-3 text-base outline-none placeholder:text-white/50 focus-visible:border-white"
          />
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!category} onClick={() => setCategory(null)}>
              {t("Tous")}
            </FilterChip>
            {usedCategories.map((c) => (
              <FilterChip
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
              >
                {t(c.name)}
              </FilterChip>
            ))}
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCategory(null);
                  setQuery("");
                }}
                className="flex h-10 items-center gap-1.5 px-2 text-sm text-white/70 hover:text-white"
              >
                <X className="size-4" /> {t("Effacer")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grille ------------------------------------------------------------ */}
      {visible.length === 0 ? (
        <p className="py-20 text-center text-white/70">
          {t("Aucun modèle ne correspond à votre recherche.")}
        </p>
      ) : (
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pt-8 pb-20 sm:gap-5 md:px-8 md:pt-12 lg:grid-cols-4 lg:gap-6">
          {visible.map((model) => (
            <li key={model.id} className="flex">
              <CatalogTile
                model={model}
                context={context}
                categoryName={categoryNames.get(model.category_slug ?? "")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CatalogTile({
  model,
  context,
  categoryName,
}: {
  model: GarmentModel;
  context?: string;
  categoryName?: string;
}) {
  // Au survol, la deuxième photo (le vêtement porté) remplace la première.
  const [cover, worn] = modelPhotos(model);
  const t = useT();
  return (
    // Une vraie carte : photo et texte dans le même cadre, pour qu'on ne lise
    // jamais le nom d'un modèle collé à la photo du suivant.
    <Link
      href={modelHref(model, context)}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-950 transition-colors hover:border-white/30"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-neutral-900">
        {cover && (
          <Image
            src={cover}
            alt={model.name}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-cover transition duration-700 ease-out group-hover:scale-[1.03]",
              worn && "group-hover:opacity-0",
            )}
          />
        )}
        {worn && (
          <Image
            src={worn}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
          />
        )}
        {model.origin?.europe && (
          <EuropeBadge
            overlay
            country={model.origin.country}
            className="absolute top-2 left-2 max-w-[calc(100%-1rem)]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pt-3 pb-4 md:px-4 md:pt-4 md:pb-5">
        {categoryName && (
          <p
            className={cn(
              display.className,
              "text-[11px] tracking-[0.2em] text-white/50 uppercase",
            )}
          >
            {t(categoryName)}
          </p>
        )}
        <h2 className="mt-1 line-clamp-2 text-[15px] leading-snug font-medium md:text-base">
          {model.name}
        </h2>
        <p className="mt-auto pt-2 text-sm text-white/70">
          {model.price != null ? (
            <>
              {t("Dès")}{" "}
              <ProductPrice
                amount={model.price}
                europe={model.origin?.europe}
                className="font-medium text-white"
              />
            </>
          ) : (
            <>{t("Prêt en ~{n} jours", { n: model.avg_days })}</>
          )}
        </p>
      </div>
    </Link>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-md border px-4 text-sm transition-colors",
        active
          ? "border-white bg-white text-black"
          : "border-white/25 hover:border-white",
      )}
    >
      {children}
    </button>
  );
}
