"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Ruler, ShoppingBag, Sparkles, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DressIcon } from "@/components/women/dress-icons";
import { formatPrice } from "@/lib/constants";
import {
  DRESS_BASE_PRICE,
  DRESS_DETAIL_DEFAULTS,
  DRESS_FABRIC_METERS,
  DRESS_GROUPS,
} from "@/lib/dress-options";
import { FABRIC_CATEGORIES } from "@/lib/fixtures";
import type { Fabric, GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Sumissura-style split-screen personaliser for a women's made-to-measure
// dress: a sticky live preview on the left, illustrated option groups on the
// right. Selecting a fabric or a design detail updates the preview and the
// running price. Demo data (fabrics + dress silhouettes) is injected by the
// server page.

type SectionMeta = { slug: string; name: string };

const SECTIONS: SectionMeta[] = [
  { slug: "tissu", name: "Tissu" },
  ...DRESS_GROUPS.map((g) => ({ slug: g.slug, name: g.name })),
];

const catName = (slug: string | null) =>
  FABRIC_CATEGORIES.find((c) => c.slug === slug)?.name ?? "Tous";

export function DressConfigurator({
  fabrics,
  models,
}: {
  fabrics: Fabric[];
  models: GarmentModel[];
}) {
  const [modelId, setModelId] = useState<string | null>(models[0]?.id ?? null);
  const [fabricId, setFabricId] = useState<string | null>(fabrics[0]?.id ?? null);
  const [fabricCat, setFabricCat] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({
    ...DRESS_DETAIL_DEFAULTS,
  });
  const [active, setActive] = useState<string>("tissu");

  const model = useMemo(
    () => models.find((m) => m.id === modelId) ?? models[0] ?? null,
    [models, modelId],
  );
  const fabric = useMemo(
    () => fabrics.find((f) => f.id === fabricId) ?? null,
    [fabrics, fabricId],
  );

  const categories = useMemo(() => {
    const slugs = new Set<string>();
    for (const f of fabrics) if (f.category_slug) slugs.add(f.category_slug);
    return [...slugs];
  }, [fabrics]);

  const shownFabrics = useMemo(
    () => (fabricCat ? fabrics.filter((f) => f.category_slug === fabricCat) : fabrics),
    [fabrics, fabricCat],
  );

  // The chosen option object for every group — drives both the price and the
  // live "spec" strip in the preview.
  const chosen = useMemo(
    () =>
      DRESS_GROUPS.map((g) => ({
        group: g,
        option: g.options.find((o) => o.slug === details[g.slug]) ?? g.options[0],
      })),
    [details],
  );

  const surcharge = chosen.reduce((s, c) => s + (c.option.priceDelta ?? 0), 0);
  const fabricPrice = fabric ? fabric.price_per_meter * DRESS_FABRIC_METERS : 0;
  const total = DRESS_BASE_PRICE + fabricPrice + surcharge;

  // Highlight the section closest to the top of the viewport as the reader
  // scrolls through the option groups.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`sec-${s.slug}`)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id.replace("sec-", ""));
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const goTo = (slug: string) =>
    document.getElementById(`sec-${slug}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  const setOption = (group: string, option: string) =>
    setDetails((d) => ({ ...d, [group]: option }));

  const reset = () => {
    setDetails({ ...DRESS_DETAIL_DEFAULTS });
    setFabricId(fabrics[0]?.id ?? null);
    setFabricCat(null);
  };

  const addToCart = () =>
    toast.success("Robe ajoutée au panier", {
      description: `${model?.name ?? "Robe"} · ${fabric?.name ?? "Tissu"} · ${formatPrice(total)}`,
    });

  const orderHref =
    `/commande/nouvelle?type=full` +
    (modelId ? `&model=${modelId}` : "") +
    (fabricId ? `&fabric=${fabricId}` : "");

  // Shared price + CTA block, reused by the desktop sidebar footer and the
  // mobile bottom bar.
  const footer = (
    <div className="flex items-center gap-3">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Total · TVA incluse</p>
        <p className="text-primary text-2xl font-bold leading-tight">
          {formatPrice(total)}
        </p>
      </div>
      <Button size="lg" className="ml-auto h-11 px-4 text-base" onClick={addToCart}>
        <ShoppingBag className="size-4" /> Ajouter au panier
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 lg:pb-0">
      <div className="lg:grid lg:grid-cols-[1fr_minmax(380px,440px)] lg:gap-8">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT — sticky live preview                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="pt-4 lg:sticky lg:top-16 lg:self-start lg:pt-8">
          <div className="bg-muted/40 relative flex h-[46vh] flex-col overflow-hidden rounded-3xl border lg:h-[calc(100vh-6rem)]">
            {/* soft fabric-tinted backdrop */}
            {fabric?.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fabric.image_url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
              />
            )}
            <div className="from-background/30 to-background/80 absolute inset-0 bg-gradient-to-b" />

            {/* top row — fabric badge + base model switch */}
            <div className="relative z-10 flex items-start justify-between gap-2 p-4">
              {fabric && (
                <span className="bg-background/85 flex items-center gap-2 rounded-full py-1 pr-3 pl-1.5 text-xs font-medium shadow-sm backdrop-blur">
                  {fabric.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fabric.image_url}
                      alt=""
                      className="size-6 rounded-full object-cover"
                    />
                  )}
                  <span className="max-w-[9rem] truncate">{fabric.name}</span>
                </span>
              )}
              {models.length > 1 && (
                <div className="bg-background/85 flex gap-1 rounded-full p-1 shadow-sm backdrop-blur">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelId(m.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        m.id === modelId
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* garment photo */}
            <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center px-6">
              {model?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={model.image_url}
                  alt={model.name}
                  className="max-h-full max-w-full rounded-2xl object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Sparkles className="size-8 opacity-40" />
                  <p className="text-sm">Aperçu de votre robe</p>
                </div>
              )}
            </div>

            {/* live spec strip */}
            <div className="relative z-10 p-3">
              <div className="bg-background/85 flex gap-1 overflow-x-auto rounded-2xl border p-2 shadow-sm backdrop-blur">
                {chosen.map(({ group, option }) => (
                  <button
                    key={group.slug}
                    type="button"
                    onClick={() => goTo(group.slug)}
                    title={`${group.name} : ${option.name}`}
                    className="hover:bg-muted flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition-colors"
                  >
                    <DressIcon name={option.icon} className="text-foreground h-8 w-full" />
                    <span className="w-full truncate text-[10px] leading-tight">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT — customisation scroller                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="min-w-0">
          {/* section chip nav */}
          <div className="bg-background/90 sticky top-16 z-20 -mx-4 border-b px-4 py-2 backdrop-blur lg:mx-0 lg:rounded-b-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => goTo(s.slug)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active === s.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* intro */}
          <div className="flex items-start justify-between gap-3 pt-6">
            <div>
              <p className="text-primary text-xs font-medium tracking-wide uppercase">
                Femme · Robe sur mesure
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Composez votre robe
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Choisissez votre tissu, puis chaque détail. L&apos;aperçu et le prix
                se mettent à jour en direct.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-muted-foreground hover:text-foreground mt-1 flex shrink-0 items-center gap-1 text-xs"
            >
              <Undo2 className="size-3.5" /> Réinitialiser
            </button>
          </div>

          {/* Tissu */}
          <section id="sec-tissu" className="scroll-mt-32 pt-8">
            <SectionHeading n={1} title="Tissu" hint="La matière de votre robe" />
            <div className="mb-3 flex flex-wrap gap-2">
              <CatChip active={!fabricCat} onClick={() => setFabricCat(null)}>
                Tous
              </CatChip>
              {categories.map((slug) => (
                <CatChip
                  key={slug}
                  active={fabricCat === slug}
                  onClick={() => setFabricCat(slug)}
                >
                  {catName(slug)}
                </CatChip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shownFabrics.map((f) => {
                const sel = f.id === fabricId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFabricId(f.id)}
                    aria-pressed={sel}
                    className={cn(
                      "relative overflow-hidden rounded-xl border text-left transition-colors",
                      sel ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted",
                    )}
                  >
                    {sel && (
                      <span className="text-primary-foreground bg-primary absolute top-1.5 left-1.5 z-10 grid size-5 place-items-center rounded-full">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {f.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.image_url}
                        alt={f.name}
                        className="aspect-square w-full object-cover"
                      />
                    )}
                    <div className="p-2">
                      <p className="line-clamp-1 text-xs font-medium">{f.name}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {formatPrice(f.price_per_meter)}/m
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Illustrated design groups */}
          {DRESS_GROUPS.map((group, i) => (
            <section
              key={group.slug}
              id={`sec-${group.slug}`}
              className="scroll-mt-32 pt-8"
            >
              <SectionHeading n={i + 2} title={group.name} hint={group.hint} />
              <div className="grid grid-cols-3 gap-2.5">
                {group.options.map((opt) => {
                  const sel = details[group.slug] === opt.slug;
                  return (
                    <button
                      key={opt.slug}
                      type="button"
                      onClick={() => setOption(group.slug, opt.slug)}
                      aria-pressed={sel}
                      className={cn(
                        "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                        sel
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-border hover:bg-muted/40",
                      )}
                    >
                      {sel && (
                        <span className="text-primary-foreground bg-primary absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-full">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                      <DressIcon
                        name={opt.icon}
                        className={cn(
                          "h-16 w-full",
                          sel ? "text-foreground" : "text-muted-foreground/70",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs leading-tight",
                          sel ? "text-foreground font-medium" : "text-muted-foreground",
                        )}
                      >
                        {opt.name}
                      </span>
                      {opt.priceDelta ? (
                        <span className="text-muted-foreground text-[10px]">
                          +{opt.priceDelta.toLocaleString("fr-FR")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-[10px]">
                          Inclus
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* recap */}
          <section className="pt-10">
            <div className="bg-card rounded-2xl border p-5">
              <h2 className="text-base font-semibold tracking-tight">Récapitulatif</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <PriceRow label="Façon atelier (base)" value={formatPrice(DRESS_BASE_PRICE)} />
                <PriceRow
                  label={`Tissu · ${fabric?.name ?? "—"} (${DRESS_FABRIC_METERS} m)`}
                  value={formatPrice(fabricPrice)}
                />
                {chosen
                  .filter((c) => (c.option.priceDelta ?? 0) > 0)
                  .map((c) => (
                    <PriceRow
                      key={c.group.slug}
                      label={`${c.group.name} · ${c.option.name}`}
                      value={`+${formatPrice(c.option.priceDelta ?? 0)}`}
                    />
                  ))}
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="text-primary">{formatPrice(total)}</dd>
                </div>
              </dl>
              <div className="text-muted-foreground mt-4 space-y-1.5 border-t pt-4 text-sm">
                <p className="flex items-center gap-2">
                  <Ruler className="size-4" /> Vos mesures seront prises à l&apos;étape
                  suivante.
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="size-4" /> Confection ~{model?.avg_days ?? 9} jours ·
                  livraison à Dakar.
                </p>
              </div>
              <Link
                href={orderHref}
                className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-1 text-sm font-medium"
              >
                Continuer vers la commande <span aria-hidden>→</span>
              </Link>
            </div>
          </section>

          {/* desktop sticky footer */}
          <div className="bg-background/95 sticky bottom-0 z-20 mt-6 hidden border-t py-4 backdrop-blur lg:block">
            {footer}
          </div>
        </div>
      </div>

      {/* mobile bottom bar */}
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-6xl px-1">{footer}</div>
      </div>
    </div>
  );
}

function SectionHeading({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="bg-muted text-muted-foreground grid size-6 place-items-center rounded-full text-xs font-semibold">
          {n}
        </span>
        {title}
      </h2>
      <p className="text-muted-foreground mt-0.5 text-sm">{hint}</p>
    </div>
  );
}

function CatChip({
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
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
