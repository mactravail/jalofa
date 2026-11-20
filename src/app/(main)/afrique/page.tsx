import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import {
  COLLECTION_CTA,
  COLLECTION_HEADING,
} from "@/components/catalog/collection-sections";
import { CollectionHero } from "@/components/catalog/collection-hero";
import { Price } from "@/components/cart/price";
import { getFabrics, getModels } from "@/lib/data";
import { display } from "@/lib/display-font";
import { modelPhotos } from "@/lib/constants";
import { fabricUnit, fabricUnitPrice } from "@/lib/fabric-specs";
import { modelHref } from "@/lib/model-href";
import type { Fabric, GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "JALOFA AFRIQUE",
    description: t(
      "Habits homme, habits femme et tissus : les créations des tailleurs d'Afrique et les tissus JALOFA.",
    ),
  };
}

const PROMISES = [
  {
    icon: Scissors,
    title: "Des tailleurs d'expérience",
    text: "Les meilleurs ateliers du monde, notés par leurs clients.",
  },
  {
    icon: Ruler,
    title: "À vos mesures",
    text: "Votre corps, votre taille : l'habit tombe juste.",
  },
  {
    icon: BadgeCheck,
    title: "Votre tissu, votre style",
    text: "Bazin, wax, broderie : vous choisissez chaque détail.",
  },
  {
    icon: ShieldCheck,
    title: "Vous payez le pro directement",
    text: "Il vous envoie son Wave ou Orange Money. Aucun frais JALOFA.",
  },
];

// --- Les produits ---------------------------------------------------------------

type Filter = "tout" | "homme" | "femme" | "enfant" | "tissus";
type Sort = "nouveautes" | "prix-croissant" | "prix-decroissant" | "a-z";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "tout", label: "Tout" },
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "enfant", label: "Enfant" },
  { value: "tissus", label: "Tissus" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-croissant", label: "Prix croissant" },
  { value: "prix-decroissant", label: "Prix décroissant" },
  { value: "a-z", label: "De A à Z" },
];

const PAGE_SIZE = 24;
const NEW_FOR_MS = 30 * 24 * 60 * 60 * 1000;

const CATEGORY_LABEL: Record<string, string> = {
  homme: "Homme",
  femme: "Femme",
  enfant: "Enfant",
};

/** Un habit ou un tissu, ramené à ce qu'une carte affiche. */
type ProductItem = {
  kind: "model" | "fabric";
  id: string;
  href: string;
  image: string | null;
  /** 2e photo, montrée au survol (ordinateur). */
  hoverImage: string | null;
  name: string;
  /** La ligne « marque » : la boutique du pro, ou « JALOFA » pour la démo. */
  brand: string;
  kicker: string;
  /** homme / femme / enfant pour un habit ; null pour un tissu. */
  category: string | null;
  place: string | null;
  price: number | null;
  /** « mètre », « pagne »… pour un tissu. */
  per: string | null;
  soldOut: boolean;
  /** Publié par un vrai pro (sinon : catalogue / tissu de démo JALOFA). */
  fromPro: boolean;
  createdAt: string;
};

function createdAt(row: object): string {
  return (row as { created_at?: string }).created_at ?? "";
}

/**
 * Ce que montre JALOFA AFRIQUE : d'abord ce que publient les pros africains
 * (créations des tailleurs), puis le catalogue JALOFA (`tailor_id` null) et
 * les tissus, tous vendus par JALOFA. Un pro est africain dès qu'il n'a pas déclaré un pays
 * d'Europe ; le catalogue « europe-* » reste sur /europe.
 */
function africanProducts(
  models: GarmentModel[],
  fabrics: Fabric[],
): ProductItem[] {
  const garments: ProductItem[] = models
    .filter((m) => !m.origin?.europe && !(m.slug ?? "").startsWith("europe"))
    .map((m) => {
      const photos = modelPhotos(m);
      const fromPro = m.tailor_id !== null;
      return {
        kind: "model",
        id: m.id,
        href: modelHref(m),
        image: photos[0] ?? null,
        hoverImage: photos[1] ?? null,
        name: m.name,
        brand: (fromPro && m.origin?.shop_name) || "JALOFA",
        kicker: CATEGORY_LABEL[m.category_slug ?? ""] ?? "Habit",
        category: m.category_slug,
        place: fromPro ? m.origin?.city || m.origin?.country || null : null,
        price: m.price,
        per: null,
        soldOut: false,
        fromPro,
        createdAt: createdAt(m),
      };
    });
  const cloths: ProductItem[] = fabrics
    .filter((f) => !f.origin?.europe)
    .map((f) => {
      // Tous les tissus sont ceux de JALOFA (seul vendeur) : ils se rangent
      // avec le catalogue JALOFA, jamais parmi les créations des pros.
      return {
        kind: "fabric",
        id: f.id,
        href: `/tissus/${f.id}`,
        image: f.image_url,
        hoverImage: f.detail_image_url ?? null,
        name: f.name,
        brand: "JALOFA",
        kicker: "Tissu",
        category: null,
        place: null,
        price: fabricUnitPrice(f),
        per: fabricUnit(f).per,
        soldOut: f.in_stock === false,
        fromPro: false,
        createdAt: createdAt(f),
      };
    });
  return [...garments, ...cloths];
}

function matches(item: ProductItem, filter: Filter): boolean {
  if (filter === "tout") return true;
  if (filter === "tissus") return item.kind === "fabric";
  return item.kind === "model" && item.category === filter;
}

/** Prix inconnu (« sur demande ») toujours en fin de liste. */
function priceKey(item: ProductItem, dir: 1 | -1): number {
  return item.price != null && item.price > 0
    ? item.price * dir
    : Number.MAX_SAFE_INTEGER;
}

/**
 * « Nouveautés » : les pros d'abord (les plus récents en tête), puis la démo
 * JALOFA, où habits et tissus sont intercalés (2 habits, 1 tissu…) pour que la
 * grille ne soit pas un bloc de tissus.
 */
function sortItems(items: ProductItem[], sort: Sort): ProductItem[] {
  const list = items.slice();
  if (sort === "prix-croissant")
    return list.sort((a, b) => priceKey(a, 1) - priceKey(b, 1));
  if (sort === "prix-decroissant")
    return list.sort((a, b) => priceKey(a, -1) - priceKey(b, -1));
  if (sort === "a-z")
    return list.sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const pros = list
    .filter((i) => i.fromPro)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const demoModels = list.filter((i) => !i.fromPro && i.kind === "model");
  const demoCloths = list.filter((i) => !i.fromPro && i.kind === "fabric");
  const demo: ProductItem[] = [];
  while (demoModels.length || demoCloths.length) {
    demo.push(...demoModels.splice(0, 2), ...demoCloths.splice(0, 1));
  }
  return [...pros, ...demo];
}

// --- Filtres de la colonne de gauche -----------------------------------------------

type Facet = "dispo" | "boutique" | "prix";

/** Ce que l'URL décrit : onglet, tri, filtres cochés, page. */
type Query = {
  voir: Filter;
  tri: Sort;
  dispo: string[];
  boutique: string[];
  prix: string[];
  page?: number;
};

const AVAILABILITY = [
  { value: "disponible", label: "Disponible" },
  { value: "epuise", label: "Épuisé" },
];

const PRICE_RANGES = [
  { value: "moins-10000", label: "Moins de 10 000 FCFA", min: 1, max: 9_999 },
  {
    value: "10000-25000",
    label: "10 000 – 25 000 FCFA",
    min: 10_000,
    max: 25_000,
  },
  {
    value: "25000-50000",
    label: "25 000 – 50 000 FCFA",
    min: 25_001,
    max: 50_000,
  },
  {
    value: "plus-50000",
    label: "Plus de 50 000 FCFA",
    min: 50_001,
    max: Infinity,
  },
  { value: "sur-demande", label: "Prix sur demande", min: 0, max: 0 },
];

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function facetValue(item: ProductItem, facet: Facet): string {
  if (facet === "dispo") return item.soldOut ? "epuise" : "disponible";
  if (facet === "boutique") return slugify(item.brand);
  const price = item.price ?? 0;
  if (price <= 0) return "sur-demande";
  return (
    PRICE_RANGES.find((r) => price >= r.min && price <= r.max)?.value ?? ""
  );
}

/** Filtres cochés, sauf `skip` : les compteurs d'une famille ignorent ses propres coches. */
function passes(item: ProductItem, query: Query, skip?: Facet): boolean {
  return (["dispo", "boutique", "prix"] as Facet[]).every(
    (facet) =>
      facet === skip ||
      query[facet].length === 0 ||
      query[facet].includes(facetValue(item, facet)),
  );
}

function list(value: string | undefined): string[] {
  return (value ?? "").split(",").filter(Boolean);
}

function pageHref(query: Query, change: Partial<Query> = {}): string {
  const next = { ...query, page: undefined, ...change };
  const q = new URLSearchParams();
  if (next.voir !== "tout") q.set("voir", next.voir);
  if (next.tri !== "nouveautes") q.set("tri", next.tri);
  for (const facet of ["dispo", "boutique", "prix"] as Facet[]) {
    if (next[facet].length) q.set(facet, next[facet].join(","));
  }
  if (next.page && next.page > 1) q.set("page", String(next.page));
  const qs = q.toString();
  return `/afrique${qs ? `?${qs}` : ""}#produits`;
}

function toggled(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

/** La colonne « FILTRES » : des familles repliables, chaque option = un lien case à cocher. */
async function FilterPanel({
  query,
  groups,
}: {
  query: Query;
  groups: {
    facet: Facet;
    title: string;
    open: boolean;
    options: { value: string; label: string; count: number }[];
  }[];
}) {
  const t = await getT();
  const active = query.dispo.length + query.boutique.length + query.prix.length;
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-white/15 pb-5">
        <p
          className={cn(
            display.className,
            "text-base font-bold tracking-wide uppercase",
          )}
        >
          {t("Filtres")}
        </p>
        {active > 0 && (
          <Link
            href={pageHref(query, { dispo: [], boutique: [], prix: [] })}
            scroll={false}
            className="text-xs text-white/60 underline underline-offset-4 hover:text-white"
          >
            {t("Tout effacer")}
          </Link>
        )}
      </div>
      {groups.map((group) => (
        <details
          key={group.facet}
          open={group.open || query[group.facet].length > 0}
          className="group/facet border-b border-white/15"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            {t(group.title)}
            <ChevronDown
              className="size-4 transition-transform group-open/facet:rotate-180"
              aria-hidden
            />
          </summary>
          <ul className="space-y-2.5 pb-5 pl-2.5">
            {group.options.map((option) => {
              const checked = query[group.facet].includes(option.value);
              const disabled = option.count === 0 && !checked;
              return (
                <li key={option.value}>
                  <Link
                    href={pageHref(query, {
                      [group.facet]: toggled(query[group.facet], option.value),
                    })}
                    scroll={false}
                    role="checkbox"
                    aria-checked={checked}
                    aria-disabled={disabled || undefined}
                    className={cn(
                      "flex items-center gap-3 text-sm text-white/80 hover:text-white",
                      disabled && "pointer-events-none text-white/30",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center border",
                        checked
                          ? "border-white bg-white text-black"
                          : "border-white/40",
                      )}
                    >
                      {checked && (
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      )}
                    </span>
                    {t(option.label)} ({option.count})
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}

/** La carte produit, façon boutique : grande photo, puis marque, nom et prix centrés. */
async function ProductCard({
  item,
  isNew,
}: {
  item: ProductItem;
  isNew: boolean;
}) {
  const t = await getT();
  const sizes = "(max-width: 1024px) 50vw, (max-width: 1280px) 30vw, 22vw";
  return (
    <Link href={item.href} className="group flex w-full flex-col">
      <div className="relative aspect-3/4 overflow-hidden rounded-md bg-neutral-900">
        {item.image && (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes={sizes}
            className={cn(
              "object-cover transition duration-700 ease-out",
              item.hoverImage
                ? "md:group-hover:opacity-0"
                : "group-hover:scale-[1.03]",
            )}
          />
        )}
        {item.hoverImage && (
          <Image
            src={item.hoverImage}
            alt=""
            aria-hidden
            fill
            sizes={sizes}
            className="hidden object-cover opacity-0 transition duration-700 ease-out md:block md:group-hover:opacity-100"
          />
        )}
        {(item.soldOut || isNew) && (
          <span
            className={cn(
              "absolute top-2.5 left-2.5 px-1.5 py-0.5 text-[11px] font-bold tracking-wider uppercase md:text-xs",
              item.soldOut ? "bg-white text-black" : "bg-orange-500 text-black",
            )}
          >
            {t(item.soldOut ? "Épuisé" : "Nouveau")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center px-1 pt-4 text-center">
        <p className="line-clamp-1 text-[11px] font-bold tracking-wider uppercase md:text-xs">
          {item.brand}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/85 group-hover:underline md:text-sm">
          {item.name}
        </h3>
        <p className="mt-1.5 text-[13px] whitespace-nowrap text-white/85 md:text-sm">
          {item.price != null && item.price > 0 ? (
            <>
              {item.kind === "model" && <>{t("Dès")} </>}
              <Price amount={item.price} />
              {item.per && (
                <span className="text-xs text-white/60"> / {t(item.per)}</span>
              )}
            </>
          ) : (
            t("Prix sur demande")
          )}
        </p>
      </div>
    </Link>
  );
}

/**
 * JALOFA AFRIQUE, en page « collection » de boutique : hero, onglets, puis la
 * colonne FILTRES à gauche et la grille à droite (nombre + tri au-dessus),
 * pagination. Puis la promesse et l'appel aux pros.
 */
export default async function AfriquePage({
  searchParams,
}: {
  searchParams: Promise<{
    voir?: string;
    tri?: string;
    page?: string;
    dispo?: string;
    boutique?: string;
    prix?: string;
  }>;
}) {
  const [params, t, models, fabrics] = await Promise.all([
    searchParams,
    getT(),
    getModels(),
    getFabrics(),
  ]);

  const query: Query = {
    voir: FILTERS.some((f) => f.value === params.voir)
      ? (params.voir as Filter)
      : "tout",
    tri: SORTS.some((s) => s.value === params.tri)
      ? (params.tri as Sort)
      : "nouveautes",
    dispo: list(params.dispo),
    boutique: list(params.boutique),
    prix: list(params.prix),
  };
  const filter = query.voir;
  const sort = query.tri;

  const inTab = africanProducts(models, fabrics).filter((i) =>
    matches(i, filter),
  );
  const count = (facet: Facet, value: string) =>
    inTab.filter(
      (i) => passes(i, query, facet) && facetValue(i, facet) === value,
    ).length;

  const shops = [...new Set(inTab.map((i) => i.brand))].sort((a, b) =>
    a === "JALOFA" ? -1 : b === "JALOFA" ? 1 : a.localeCompare(b, "fr"),
  );
  const groups = [
    {
      facet: "dispo" as const,
      title: "Disponibilité",
      open: true,
      options: AVAILABILITY.map((o) => ({
        ...o,
        count: count("dispo", o.value),
      })),
    },
    {
      facet: "boutique" as const,
      title: "Boutique",
      open: false,
      options: shops.map((shop) => ({
        value: slugify(shop),
        label: shop,
        count: count("boutique", slugify(shop)),
      })),
    },
    {
      facet: "prix" as const,
      title: "Prix",
      open: false,
      options: PRICE_RANGES.map((r) => ({
        value: r.value,
        label: r.label,
        count: count("prix", r.value),
      })),
    },
  ];
  const activeFilters =
    query.dispo.length + query.boutique.length + query.prix.length;

  const visible = sortItems(
    inTab.filter((i) => passes(i, query)),
    sort,
  );
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(
    pages,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const shown = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const sortLabel = SORTS.find((s) => s.value === sort)?.label ?? "Nouveautés";
  const newSince = new Date(new Date().getTime() - NEW_FOR_MS).toISOString();
  const countLabel = `${visible.length} ${t(visible.length > 1 ? "produits" : "produit")}`;

  return (
    <>
      <CollectionHero
        number="06"
        eyebrow="Votre style mérite un tailleur d'exception"
        title="Prestige et exclusivité"
        titleClassName="text-[11vw] leading-[0.95] md:text-[5vw]"
        image={{
          src: "/models/afrique.jpg",
          alt: "Les mains d'un tailleur cousent un tissu à l'aiguille",
          // Sur mobile (portrait), on garde l'aiguille et les doigts au centre.
          position: "object-[57%_40%]",
        }}
        target="produits"
        compact
      />

      {/* Onglets de la collection, centrés et soulignés comme des liens */}
      <nav aria-label={t("Filtrer")} className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 py-6 md:justify-center md:gap-12 md:px-8 md:py-8">
          {FILTERS.map((item) => {
            const active = item.value === filter;
            return (
              <Link
                key={item.value}
                href={pageHref(query, {
                  voir: item.value,
                  dispo: [],
                  boutique: [],
                  prix: [],
                })}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 pb-0.5 text-[13px] whitespace-nowrap underline-offset-[5px] transition-colors md:text-sm",
                  active
                    ? "text-white underline decoration-1"
                    : "text-white/70 hover:text-white hover:underline",
                )}
              >
                {item.value === "tout"
                  ? t("Toute la collection")
                  : t(item.label)}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-screen-2xl px-4 md:px-8 xl:px-12">
        <section
          id="produits"
          className="grid scroll-mt-16 gap-x-12 pt-8 md:pt-10 lg:grid-cols-[15rem_1fr] xl:grid-cols-[17rem_1fr]"
        >
          {/* Colonne FILTRES (ordinateur) */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <FilterPanel query={query} groups={groups} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Nombre de produits · tri */}
            <div className="flex items-center justify-between gap-3 text-[13px] md:text-sm">
              <p className="text-white/85">{countLabel}</p>

              <details className="group/sort relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <span className="hidden text-white/50 sm:inline">
                    {t("Trier par")}
                  </span>
                  <span className="text-white/85">{t(sortLabel)}</span>
                  <ChevronDown
                    className="size-4 transition-transform group-open/sort:rotate-180"
                    aria-hidden
                  />
                </summary>
                <ul className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-md border border-white/15 bg-neutral-950 py-1 shadow-xl">
                  {SORTS.map((s) => (
                    <li key={s.value}>
                      <Link
                        href={pageHref(query, { tri: s.value })}
                        scroll={false}
                        aria-current={s.value === sort ? "true" : undefined}
                        className={cn(
                          "block px-4 py-2.5 text-sm hover:bg-white/10",
                          s.value === sort && "font-semibold text-orange-500",
                        )}
                      >
                        {t(s.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            {/* Filtres (mobile) : un bouton qui déplie la même colonne */}
            <details className="mt-4 border-y border-white/15 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-[13px] font-semibold [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal className="size-4" aria-hidden />
                {t("Filtres")}
                {activeFilters > 0 && (
                  <span className="text-white/50">({activeFilters})</span>
                )}
              </summary>
              <div className="pb-2">
                <FilterPanel query={query} groups={groups} />
              </div>
            </details>

            {shown.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
                {shown.map((item) => (
                  <ProductCard
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    isNew={
                      item.fromPro &&
                      !!item.createdAt &&
                      item.createdAt > newSince
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-dashed border-white/20 px-6 py-14 text-center">
                <p className="text-base font-medium">
                  {t("Aucun produit ne correspond.")}
                </p>
                <Link
                  href={pageHref(query, { dispo: [], boutique: [], prix: [] })}
                  scroll={false}
                  className="mt-3 inline-block text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                  {t("Tout effacer")}
                </Link>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <nav
                aria-label={t("Pages")}
                className="mt-12 flex items-center justify-center gap-1 md:mt-16"
              >
                {current > 1 && (
                  <Link
                    href={pageHref(query, { page: current - 1 })}
                    aria-label={t("Page précédente")}
                    className="grid size-9 place-items-center rounded-full hover:bg-white/10"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Link>
                )}
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={pageHref(query, { page: n })}
                    aria-current={n === current ? "page" : undefined}
                    className={cn(
                      "grid size-9 place-items-center rounded-full text-sm",
                      n === current
                        ? "bg-white text-black"
                        : "hover:bg-white/10",
                    )}
                  >
                    {n}
                  </Link>
                ))}
                {current < pages && (
                  <Link
                    href={pageHref(query, { page: current + 1 })}
                    aria-label={t("Page suivante")}
                    className="grid size-9 place-items-center rounded-full hover:bg-white/10"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* La promesse */}
        <section className="pt-16 md:pt-28">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="border-t border-white/15 pt-5">
                <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-3 text-lg font-medium">{t(title)}</h3>
                <p className="text-muted-foreground mt-1">{t(text)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Les tailleurs africains rejoignent JALOFA avec le compte pro habituel. */}
        <section className="my-16 grid gap-8 rounded-2xl border border-white/15 px-5 py-10 md:my-28 md:grid-cols-2 md:items-center md:gap-12 md:px-12 md:py-14">
          <div className="relative aspect-4/3 overflow-hidden rounded-xl md:order-2">
            <Image
              src="/look/tailleur.jpg"
              alt={t("Pied-de-biche d'une machine à coudre sur un tissu noir")}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
              {t("Tailleurs")}
            </p>
            <h2 className={cn(COLLECTION_HEADING, "mt-3")}>
              {t("Vous êtes un pro de la couture ?")}
            </h2>
            <p className="mt-4 max-w-2xl text-lg">
              {t(
                "Vendez gratuitement vos créations sur JALOFA, à des clients du monde entier.",
              )}
            </p>
            <Link
              href="/inscription?role=pro"
              className={cn(COLLECTION_CTA, "mt-8")}
            >
              {t("Vendre")}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
