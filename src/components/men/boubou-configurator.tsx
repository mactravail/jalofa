"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Ruler, ShoppingBag, Sparkles, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { BoubouIcon } from "@/components/men/boubou-icons";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import {
  BOUBOU_BASE_PRICE,
  BOUBOU_DETAIL_DEFAULTS,
  BOUBOU_PIECES,
  boubouOptionsSurcharge,
  boubouPieceChoices,
  boubouPieceSurcharge,
  type BoubouDetails,
} from "@/lib/boubou-options";
import { FABRIC_CATEGORIES } from "@/lib/fixtures";
import type { Fabric, GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Hockerty-style split-screen personaliser for the men's three-piece grand
// boubou: a sticky live preview on the left, illustrated option groups on the
// right. Unlike the dress personaliser there is no garment switcher — this page
// is reached by choosing "Grand boubou", so the only thing to decide here is
// how that boubou is made. The three pieces (robe, kaftan, trousers) are shown
// one at a time behind tabs, so the option list stays short and the wearer is
// walked through the whole outfit instead of scrolling past it.

const PRIMARY = BOUBOU_PIECES[0];

const catName = (slug: string | null) =>
  FABRIC_CATEGORIES.find((c) => c.slug === slug)?.name ?? "Tous";

/** Fresh copy of the defaults — the constant is nested, so clone both levels. */
const cloneDefaults = (): BoubouDetails =>
  Object.fromEntries(
    Object.entries(BOUBOU_DETAIL_DEFAULTS).map(([piece, groups]) => [
      piece,
      { ...groups },
    ]),
  );

export function BoubouConfigurator({
  fabrics,
  model,
}: {
  fabrics: Fabric[];
  model: GarmentModel | null;
}) {
  const [pieceSlug, setPieceSlug] = useState<string>(PRIMARY.slug);
  const [details, setDetails] = useState<BoubouDetails>(cloneDefaults);
  const [fabricCat, setFabricCat] = useState<string | null>(null);
  const [active, setActive] = useState<string>("tissu");

  // The three pieces are cut from the same cloth by default (how a boubou is
  // normally ordered); unlinking lets each piece carry its own fabric.
  const [linkedFabric, setLinkedFabric] = useState(true);
  const [fabricIds, setFabricIds] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(BOUBOU_PIECES.map((p) => [p.slug, fabrics[0]?.id ?? null])),
  );

  const piece = useMemo(
    () => BOUBOU_PIECES.find((p) => p.slug === pieceSlug) ?? PRIMARY,
    [pieceSlug],
  );
  const pieceIndex = BOUBOU_PIECES.indexOf(piece);
  const nextPiece = BOUBOU_PIECES[pieceIndex + 1] ?? null;
  const isPrimary = piece.slug === PRIMARY.slug;

  const fabricIdFor = (slug: string) =>
    linkedFabric ? fabricIds[PRIMARY.slug] : fabricIds[slug];
  const fabricFor = (slug: string) =>
    fabrics.find((f) => f.id === fabricIdFor(slug)) ?? null;

  const activeFabric = fabricFor(piece.slug);
  const linkedName = fabrics.find((f) => f.id === fabricIds[PRIMARY.slug])?.name ?? "—";

  const categories = useMemo(() => {
    const slugs = new Set<string>();
    for (const f of fabrics) if (f.category_slug) slugs.add(f.category_slug);
    return [...slugs];
  }, [fabrics]);

  const shownFabrics = useMemo(
    () => (fabricCat ? fabrics.filter((f) => f.category_slug === fabricCat) : fabrics),
    [fabrics, fabricCat],
  );

  // Sections of the piece currently being personalised — Tissu first, then its
  // illustrated groups.
  const sections = useMemo(
    () => [
      { slug: "tissu", name: "Tissu" },
      ...piece.groups.map((g) => ({ slug: g.slug, name: g.name })),
    ],
    [piece],
  );

  const chosen = useMemo(
    () => boubouPieceChoices(piece, details[piece.slug]),
    [piece, details],
  );

  const fabricPrice = useMemo(
    () =>
      BOUBOU_PIECES.reduce((sum, p) => {
        const id = linkedFabric ? fabricIds[PRIMARY.slug] : fabricIds[p.slug];
        const f = fabrics.find((x) => x.id === id);
        return sum + (f ? f.price_per_meter * p.fabricMeters : 0);
      }, 0),
    [fabrics, fabricIds, linkedFabric],
  );

  const surcharge = boubouOptionsSurcharge(details);
  const total = BOUBOU_BASE_PRICE + fabricPrice + surcharge;

  // Highlight the section closest to the top of the viewport as the reader
  // scrolls. Re-attached on every piece change — the sections are swapped out.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(`sec-${s.slug}`))
      .filter((el): el is HTMLElement => el !== null);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id.replace("sec-", ""));
        }
      },
      { rootMargin: "-160px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const goTo = (slug: string) =>
    document.getElementById(`sec-${slug}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  const changePiece = (slug: string) => {
    setPieceSlug(slug);
    setActive("tissu");
    requestAnimationFrame(() =>
      document
        .getElementById("piece-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const setOption = (group: string, option: string) =>
    setDetails((d) => ({ ...d, [piece.slug]: { ...d[piece.slug], [group]: option } }));

  const setFabric = (id: string) =>
    setFabricIds((ids) => ({ ...ids, [linkedFabric ? PRIMARY.slug : piece.slug]: id }));

  // Unlinking seeds every piece with the fabric already chosen, so nothing
  // jumps under the wearer the moment they take control.
  const unlinkFabric = () => {
    const id = fabricIds[PRIMARY.slug];
    setFabricIds(Object.fromEntries(BOUBOU_PIECES.map((p) => [p.slug, id])));
    setLinkedFabric(false);
  };

  const reset = () => {
    setDetails(cloneDefaults());
    setFabricIds(
      Object.fromEntries(BOUBOU_PIECES.map((p) => [p.slug, fabrics[0]?.id ?? null])),
    );
    setLinkedFabric(true);
    setFabricCat(null);
  };

  const addToCart = () =>
    toast.success("Grand boubou ajouté au panier", {
      description: `3 pièces · ${linkedFabric ? linkedName : "tissus assortis"} · ${formatPrice(total)}`,
    });

  const orderHref =
    `/commande/nouvelle?type=full` +
    (model ? `&model=${model.id}` : "") +
    (fabricIds[PRIMARY.slug] ? `&fabric=${fabricIds[PRIMARY.slug]}` : "");

  // Shared price + CTA block, reused by the desktop sidebar footer and the
  // mobile bottom bar.
  const footer = (
    <div className="flex items-center gap-3">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">
          Les 3 pièces · TVA incluse
        </p>
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
            {activeFabric?.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeFabric.image_url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
              />
            )}
            <div className="from-background/30 to-background/80 absolute inset-0 bg-gradient-to-b" />

            {/* top row — fabric of the piece being worked on + piece name */}
            <div className="relative z-10 flex items-start justify-between gap-2 p-4">
              {activeFabric && (
                <span className="bg-background/85 flex items-center gap-2 rounded-full py-1 pr-3 pl-1.5 text-xs font-medium shadow-sm backdrop-blur">
                  {activeFabric.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeFabric.image_url}
                      alt=""
                      className="size-6 rounded-full object-cover"
                    />
                  )}
                  <span className="max-w-[9rem] truncate">{activeFabric.name}</span>
                </span>
              )}
              <span className="bg-background/85 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
                Pièce {pieceIndex + 1}/{BOUBOU_PIECES.length} · {piece.short}
              </span>
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
                  <p className="text-sm">Aperçu de votre grand boubou</p>
                </div>
              )}
            </div>

            {/* live spec strip — the choices made on the active piece */}
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
                    <BoubouIcon name={option.icon} className="text-foreground h-8 w-full" />
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
          {/* sticky nav — piece tabs, then the sections of that piece */}
          <div className="bg-background/90 sticky top-16 z-20 -mx-4 space-y-2 border-b px-4 py-2 backdrop-blur lg:mx-0 lg:rounded-b-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {BOUBOU_PIECES.map((p, i) => {
                const on = p.slug === piece.slug;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => changePiece(p.slug)}
                    aria-current={on ? "step" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      on ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-full text-[10px] font-semibold",
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    {p.short}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {sections.map((s) => (
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
          <div id="piece-top" className="flex items-start justify-between gap-3 scroll-mt-40 pt-6">
            <div>
              <p className="text-primary text-xs font-medium tracking-wide uppercase">
                Homme · Grand boubou sur mesure
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Composez votre grand boubou
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Un grand boubou se porte en trois pièces. Personnalisez-les
                l&apos;une après l&apos;autre : le boubou, le kaftan intérieur et le
                pantalon.
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

          {/* piece header */}
          <div className="bg-muted/40 mt-6 rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Pièce {pieceIndex + 1} sur {BOUBOU_PIECES.length}
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight">{piece.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{piece.hint}</p>
          </div>

          {/* Tissu */}
          <section id="sec-tissu" className="scroll-mt-40 pt-8">
            <SectionHeading
              n={1}
              title="Tissu"
              hint={`La matière de votre ${piece.name.toLowerCase()} · ${piece.fabricMeters} m`}
            />

            {!isPrimary && linkedFabric ? (
              <div className="bg-card flex items-center gap-3 rounded-xl border p-3">
                {fabricFor(piece.slug)?.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fabricFor(piece.slug)?.image_url ?? ""}
                    alt=""
                    className="size-12 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{linkedName}</p>
                  <p className="text-muted-foreground text-xs">
                    Même tissu que le grand boubou
                  </p>
                </div>
                <button
                  type="button"
                  onClick={unlinkFabric}
                  className="text-primary ml-auto shrink-0 text-xs font-medium hover:underline"
                >
                  Choisir un tissu différent
                </button>
              </div>
            ) : (
              <>
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
                    const sel = f.id === fabricIdFor(piece.slug);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFabric(f.id)}
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
                {isPrimary && (
                  <label className="text-muted-foreground mt-3 flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={linkedFabric}
                      onChange={(e) =>
                        e.target.checked ? setLinkedFabric(true) : unlinkFabric()
                      }
                      className="accent-primary size-4"
                    />
                    Utiliser ce tissu pour les trois pièces
                  </label>
                )}
              </>
            )}
          </section>

          {/* Illustrated design groups of the active piece */}
          {piece.groups.map((group, i) => (
            <section
              key={group.slug}
              id={`sec-${group.slug}`}
              className="scroll-mt-40 pt-8"
            >
              <SectionHeading n={i + 2} title={group.name} hint={group.hint} />
              <div className="grid grid-cols-3 gap-2.5">
                {group.options.map((opt) => {
                  const sel = details[piece.slug]?.[group.slug] === opt.slug;
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
                      <BoubouIcon
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

          {/* Next piece, or the full recap once the three are done */}
          {nextPiece ? (
            <section className="pt-10">
              <div className="bg-card flex items-center gap-4 rounded-2xl border p-5">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Pièce suivante
                  </p>
                  <p className="mt-0.5 font-semibold">{nextPiece.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{nextPiece.hint}</p>
                </div>
                <Button
                  className="ml-auto shrink-0"
                  onClick={() => changePiece(nextPiece.slug)}
                >
                  Continuer <span aria-hidden>→</span>
                </Button>
              </div>
            </section>
          ) : (
            <section className="pt-10">
              <div className="bg-card rounded-2xl border p-5">
                <h2 className="text-base font-semibold tracking-tight">
                  Récapitulatif · les 3 pièces
                </h2>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <PriceRow
                    label="Façon atelier · 3 pièces"
                    value={formatPrice(BOUBOU_BASE_PRICE)}
                  />
                  {BOUBOU_PIECES.map((p) => {
                    const f = fabricFor(p.slug);
                    return (
                      <PriceRow
                        key={p.slug}
                        label={`Tissu · ${p.short} — ${f?.name ?? "—"} (${p.fabricMeters} m)`}
                        value={formatPrice((f?.price_per_meter ?? 0) * p.fabricMeters)}
                      />
                    );
                  })}
                  {BOUBOU_PIECES.map((p) => {
                    const extra = boubouPieceSurcharge(p.slug, details[p.slug]);
                    if (extra <= 0) return null;
                    return (
                      <PriceRow
                        key={`opt-${p.slug}`}
                        label={`Options · ${p.short}`}
                        value={`+${formatPrice(extra)}`}
                      />
                    );
                  })}
                  <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
                    <dt>Total</dt>
                    <dd className="text-primary">{formatPrice(total)}</dd>
                  </div>
                </dl>

                {/* every choice, piece by piece */}
                <div className="mt-4 space-y-3 border-t pt-4">
                  {BOUBOU_PIECES.map((p) => (
                    <div key={p.slug}>
                      <button
                        type="button"
                        onClick={() => changePiece(p.slug)}
                        className="hover:text-primary text-sm font-medium"
                      >
                        {p.name}
                      </button>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                        {boubouPieceChoices(p, details[p.slug])
                          .map((c) => c.option.name)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-muted-foreground mt-4 space-y-1.5 border-t pt-4 text-sm">
                  <p className="flex items-center gap-2">
                    <Ruler className="size-4" /> Vos mesures seront prises à
                    l&apos;étape suivante.
                  </p>
                  <p className="flex items-center gap-2">
                    <Truck className="size-4" /> Confection ~{model?.avg_days ?? 10}{" "}
                    jours · livraison à Dakar.
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
          )}

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
