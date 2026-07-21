"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Ruler, ShoppingBag, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { ShoeIcon } from "@/components/shoes/shoe-icons";
import { ShoePreview } from "@/components/shoes/shoe-preview";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import {
  LACE_COLORS,
  LEATHER_MATERIALS,
  MONOGRAM_PRICE,
  SHOE_BASE_PRICE,
  SHOE_DETAIL_DEFAULTS,
  SHOE_GROUPS,
  SHOE_LEATHERS,
  SHOE_MODELS,
  shoeOptionsSurcharge,
} from "@/lib/shoe-options";
import { cn } from "@/lib/utils";

// Hockerty-style split-screen personaliser for a pair of men's made-to-measure
// shoes: a sticky live SVG preview on the left, illustrated option groups on
// the right. Every choice updates the preview and the running FCFA price. All
// data is client-side (`src/lib/shoe-options.ts`) — there is no shoe catalogue
// in the demo database yet.

type SectionMeta = { slug: string; name: string };

const SECTIONS: SectionMeta[] = [
  { slug: "modele", name: "Modèle" },
  { slug: "cuir", name: "Cuir" },
  { slug: "bout", name: "Bout" },
  { slug: "semelle", name: "Semelle" },
  { slug: "doublure", name: "Doublure" },
  { slug: "lacets", name: "Lacets" },
  { slug: "finition", name: "Finition" },
  { slug: "monogramme", name: "Monogramme" },
];

const materialName = (slug: string) =>
  LEATHER_MATERIALS.find((m) => m.slug === slug)?.name ?? slug;

export function ShoeConfigurator() {
  const [modelSlug, setModelSlug] = useState(SHOE_MODELS[0].slug);
  const [leatherSlug, setLeatherSlug] = useState(SHOE_LEATHERS[0].slug);
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({
    ...SHOE_DETAIL_DEFAULTS,
  });
  const [laceSlug, setLaceSlug] = useState(LACE_COLORS[0].slug);
  const [monogram, setMonogram] = useState("");
  const [active, setActive] = useState("modele");

  const model = useMemo(
    () => SHOE_MODELS.find((m) => m.slug === modelSlug) ?? SHOE_MODELS[0],
    [modelSlug],
  );
  const leather = useMemo(
    () => SHOE_LEATHERS.find((l) => l.slug === leatherSlug) ?? SHOE_LEATHERS[0],
    [leatherSlug],
  );
  const lace = useMemo(
    () => LACE_COLORS.find((l) => l.slug === laceSlug) ?? LACE_COLORS[0],
    [laceSlug],
  );

  const shownLeathers = useMemo(
    () =>
      materialFilter
        ? SHOE_LEATHERS.filter((l) => l.materialSlug === materialFilter)
        : SHOE_LEATHERS,
    [materialFilter],
  );

  // Chosen option object for each illustrated group — drives the spec strip.
  const chosen = useMemo(
    () =>
      SHOE_GROUPS.map((g) => ({
        group: g,
        option: g.options.find((o) => o.slug === details[g.slug]) ?? g.options[0],
      })),
    [details],
  );

  // Sections shown depend on the model (loafers/monks/boots have no laces).
  const sections = useMemo(
    () => (model.laced ? SECTIONS : SECTIONS.filter((s) => s.slug !== "lacets")),
    [model.laced],
  );

  // Contiguous step numbers over the *visible* sections, so hiding "Lacets"
  // doesn't leave a gap in the numbering.
  const stepNo = useMemo(
    () => Object.fromEntries(sections.map((s, i) => [s.slug, i + 1])) as Record<string, number>,
    [sections],
  );

  const laceColor = lace.color ?? leather.color;

  const groupSurcharge = shoeOptionsSurcharge(details);
  const modelDelta = model.priceDelta ?? 0;
  const leatherDelta = leather.priceDelta ?? 0;
  const laceDelta = model.laced ? lace.priceDelta ?? 0 : 0;
  const monogramDelta = monogram ? MONOGRAM_PRICE : 0;
  const total =
    SHOE_BASE_PRICE +
    modelDelta +
    leatherDelta +
    groupSurcharge +
    laceDelta +
    monogramDelta;

  // Highlight the section closest to the top of the viewport while scrolling.
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
    setModelSlug(SHOE_MODELS[0].slug);
    setLeatherSlug(SHOE_LEATHERS[0].slug);
    setMaterialFilter(null);
    setDetails({ ...SHOE_DETAIL_DEFAULTS });
    setLaceSlug(LACE_COLORS[0].slug);
    setMonogram("");
  };

  const addToCart = () =>
    toast.success("Chaussures ajoutées au panier", {
      description: `${model.name} · ${leather.name} · ${formatPrice(total)}`,
    });

  // Shared price + CTA block, reused by the desktop footer and the mobile bar.
  const footer = (
    <div className="flex items-center gap-3">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Total · la paire · TVA incluse</p>
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
            {/* soft leather-tinted backdrop */}
            <div
              aria-hidden
              className="absolute top-1/3 left-1/2 -z-0 size-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
              style={{ backgroundColor: leather.color }}
            />
            <div className="from-background/20 to-background/70 absolute inset-0 bg-gradient-to-b" />

            {/* top row — leather badge + model pill */}
            <div className="relative z-10 flex items-start justify-between gap-2 p-4">
              <span className="bg-background/85 flex items-center gap-2 rounded-full py-1 pr-3 pl-1.5 text-xs font-medium shadow-sm backdrop-blur">
                <span
                  className="size-6 rounded-full border border-black/10"
                  style={{ backgroundColor: leather.color }}
                />
                <span className="max-w-[10rem] truncate">
                  {leather.name}
                  <span className="text-muted-foreground">
                    {" · "}
                    {materialName(leather.materialSlug)}
                  </span>
                </span>
              </span>
              <span className="bg-background/85 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
                {model.name}
              </span>
            </div>

            {/* the parametric shoe */}
            <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center px-6">
              <ShoePreview
                model={model}
                color={leather.color}
                suede={leather.suede}
                toe={details.bout}
                sole={details.semelle}
                laceColor={laceColor}
                monogram={monogram}
                className="max-h-full w-full max-w-[520px] drop-shadow-xl"
              />
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
                    <ShoeIcon name={option.icon} className="text-foreground h-7 w-full" />
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
          <div className="flex items-start justify-between gap-3 pt-6">
            <div>
              <p className="text-primary text-xs font-medium tracking-wide uppercase">
                Homme · Chaussures sur mesure
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Composez vos chaussures
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Choisissez votre modèle et votre cuir, puis chaque détail.
                L&apos;aperçu et le prix se mettent à jour en direct.
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

          {/* Modèle */}
          <section id="sec-modele" className="scroll-mt-32 pt-8">
            <SectionHeading n={stepNo.modele} title="Modèle" hint="La base de vos chaussures" />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {SHOE_MODELS.map((m) => {
                const sel = m.slug === modelSlug;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => setModelSlug(m.slug)}
                    aria-pressed={sel}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors",
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
                    <ShoeIcon
                      name={m.icon}
                      className={cn(
                        "h-12 w-full",
                        sel ? "text-foreground" : "text-muted-foreground/70",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        sel ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      {m.name}
                    </span>
                    <span className="text-muted-foreground/70 text-[10px] leading-tight">
                      {m.priceDelta ? `+${m.priceDelta.toLocaleString("fr-FR")}` : "Inclus"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Cuir & couleur */}
          <section id="sec-cuir" className="scroll-mt-32 pt-8">
            <SectionHeading n={stepNo.cuir} title="Cuir & couleur" hint="La matière et la teinte" />
            <div className="mb-3 flex flex-wrap gap-2">
              <CatChip active={!materialFilter} onClick={() => setMaterialFilter(null)}>
                Tous
              </CatChip>
              {LEATHER_MATERIALS.map((m) => (
                <CatChip
                  key={m.slug}
                  active={materialFilter === m.slug}
                  onClick={() => setMaterialFilter(m.slug)}
                >
                  {m.name}
                </CatChip>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {shownLeathers.map((l) => {
                const sel = l.slug === leatherSlug;
                return (
                  <button
                    key={l.slug}
                    type="button"
                    onClick={() => setLeatherSlug(l.slug)}
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
                    <span
                      className="block aspect-square w-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <div className="p-2">
                      <p className="line-clamp-1 text-xs font-medium">{l.name}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {l.priceDelta ? `+${formatPrice(l.priceDelta)}` : "Inclus"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Bout / Semelle / Doublure — illustrated groups (lacets inserted after doublure) */}
          {SHOE_GROUPS.filter((g) => g.slug !== "finition").map((group) => (
            <IllustratedGroup
              key={group.slug}
              n={stepNo[group.slug]}
              group={group}
              value={details[group.slug]}
              onSelect={setOption}
            />
          ))}

          {/* Lacets */}
          {model.laced && (
            <section id="sec-lacets" className="scroll-mt-32 pt-8">
              <SectionHeading n={stepNo.lacets} title="Lacets" hint="La couleur des lacets" />
              <div className="flex flex-wrap gap-3">
                {LACE_COLORS.map((l) => {
                  const sel = l.slug === laceSlug;
                  const swatch = l.color ?? leather.color;
                  return (
                    <button
                      key={l.slug}
                      type="button"
                      onClick={() => setLaceSlug(l.slug)}
                      aria-pressed={sel}
                      title={l.name}
                      className={cn(
                        "flex w-16 flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-colors",
                        sel ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "size-8 rounded-full border border-black/10",
                          sel && "ring-primary ring-offset-background ring-2 ring-offset-2",
                        )}
                        style={{ backgroundColor: swatch }}
                      />
                      <span className="text-[10px] leading-tight">{l.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Finition */}
          {SHOE_GROUPS.filter((g) => g.slug === "finition").map((group) => (
            <IllustratedGroup
              key={group.slug}
              n={stepNo.finition}
              group={group}
              value={details[group.slug]}
              onSelect={setOption}
            />
          ))}

          {/* Monogramme */}
          <section id="sec-monogramme" className="scroll-mt-32 pt-8">
            <SectionHeading
              n={stepNo.monogramme}
              title="Monogramme"
              hint={`Vos initiales gravées sur le talon (+${formatPrice(MONOGRAM_PRICE)})`}
            />
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={monogram}
                onChange={(e) =>
                  setMonogram(
                    e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase(),
                  )
                }
                placeholder="AB"
                maxLength={3}
                aria-label="Initiales du monogramme"
                className="border-input bg-background focus-visible:ring-ring/50 h-11 w-28 rounded-lg border px-3 text-center text-lg font-semibold tracking-widest uppercase focus-visible:ring-2 focus-visible:outline-none"
              />
              <p className="text-muted-foreground text-sm">
                {monogram
                  ? `« ${monogram} » gravé · +${formatPrice(MONOGRAM_PRICE)}`
                  : "Jusqu'à 3 lettres — optionnel."}
              </p>
              {monogram && (
                <button
                  type="button"
                  onClick={() => setMonogram("")}
                  className="text-muted-foreground hover:text-foreground ml-auto text-xs"
                >
                  Retirer
                </button>
              )}
            </div>
          </section>

          {/* recap */}
          <section className="pt-10">
            <div className="bg-card rounded-2xl border p-5">
              <h2 className="text-base font-semibold tracking-tight">Récapitulatif</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <PriceRow label="Façon atelier (base)" value={formatPrice(SHOE_BASE_PRICE)} />
                <PriceRow
                  label={`Modèle · ${model.name}`}
                  value={modelDelta ? `+${formatPrice(modelDelta)}` : "Inclus"}
                />
                <PriceRow
                  label={`Cuir · ${leather.name}`}
                  value={leatherDelta ? `+${formatPrice(leatherDelta)}` : "Inclus"}
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
                {laceDelta > 0 && (
                  <PriceRow label={`Lacets · ${lace.name}`} value={`+${formatPrice(laceDelta)}`} />
                )}
                {monogramDelta > 0 && (
                  <PriceRow label={`Monogramme · ${monogram}`} value={`+${formatPrice(monogramDelta)}`} />
                )}
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="text-primary">{formatPrice(total)}</dd>
                </div>
              </dl>
              <div className="text-muted-foreground mt-4 space-y-1.5 border-t pt-4 text-sm">
                <p className="flex items-center gap-2">
                  <Ruler className="size-4" /> La pointure et la longueur du pied seront
                  prises à l&apos;étape suivante.
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="size-4" /> Confection ~3 semaines · livraison à Dakar.
                </p>
              </div>
              <Link
                href="/modeles"
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

function IllustratedGroup({
  n,
  group,
  value,
  onSelect,
}: {
  n: number;
  group: (typeof SHOE_GROUPS)[number];
  value: string;
  onSelect: (group: string, option: string) => void;
}) {
  return (
    <section id={`sec-${group.slug}`} className="scroll-mt-32 pt-8">
      <SectionHeading n={n} title={group.name} hint={group.hint} />
      <div className="grid grid-cols-3 gap-2.5">
        {group.options.map((opt) => {
          const sel = value === opt.slug;
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => onSelect(group.slug, opt.slug)}
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
              <ShoeIcon
                name={opt.icon}
                className={cn(
                  "h-14 w-full",
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
                <span className="text-muted-foreground/60 text-[10px]">Inclus</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
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
