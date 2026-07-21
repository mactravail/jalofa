"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  ShoppingBag,
  Scissors,
  X,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import { Button } from "@/components/ui/button";
import { APP_NAME, ORDER_TYPE_LABELS, formatPrice, modelPhotos } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  buildCartItem,
  STEP_BY_SLUG,
  STEP_ICONS,
  STEP_LABELS,
  stepCanProceed,
  stepUrl,
  useConfigurator,
  type StepKey,
} from "@/components/order/configurator-context";
import { PriceRow, SelectionChip } from "@/components/order/configurator-ui";

export function ConfiguratorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const cfg = useConfigurator();
  const { addItem } = useCart();
  const { state, steps, model, fabric, tailor, price } = cfg;

  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const stepFromUrl = STEP_BY_SLUG[slug];
  const step: StepKey = stepFromUrl && steps.includes(stepFromUrl) ? stepFromUrl : steps[0];
  const stepIndex = Math.max(0, steps.indexOf(step));
  const isLast = step === "review";
  const canProceed = stepCanProceed(step, state);

  const styleName = cfg.data.styles.find((s) => s.slug === state.styleSlug)?.name ?? null;

  const addToCart = () => {
    addItem(buildCartItem(state, { model, fabric, tailor, styleName, price }));
    toast.success("Ajouté au panier");
    router.push("/panier");
  };

  const goNext = () => {
    if (isLast || !canProceed) return;
    const next = steps[stepIndex + 1];
    if (next) router.push(stepUrl(next));
  };
  const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : null;

  const deliveryDays = tailor?.avg_delivery_days ?? model?.avg_days ?? 14;
  const weeks = Math.max(1, Math.round(deliveryDays / 7));

  const panelTitle =
    state.type === "fabric_only" ? fabric?.name ?? "Tissu" : model?.name ?? "Votre tenue";
  const panelSubtitle = state.type === "fabric_only" ? "Au mètre" : "Sur mesure";

  // Buying fabric by the meter → show the bolt swatch; otherwise the garment
  // gallery: le vêtement seul d'abord, puis porté (devant, dos) et les détails.
  const wearsGarment = state.type !== "fabric_only";
  const boltImage = fabric?.image_url ?? null;
  const photos = wearsGarment
    ? model
      ? modelPhotos(model)
      : []
    : boltImage
      ? [boltImage]
      : [];

  // Reusable CTA (Continue / Add to cart) used by both the desktop card and the
  // mobile bottom bar.
  const cta = (idSuffix: string) =>
    isLast ? (
      <Button type="button" size="lg" className="w-full" onClick={addToCart} data-cta={idSuffix}>
        <ShoppingBag className="size-4" /> Ajouter au panier
      </Button>
    ) : (
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={goNext}
        disabled={!canProceed}
        data-cta={idSuffix}
      >
        Continuer <ChevronRight className="size-4" />
      </Button>
    );

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Slim top bar — brand + step + close */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Scissors className="size-4" />
          </span>
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </Link>
        <span className="bg-muted text-muted-foreground ml-1 hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline">
          Démo
        </span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground text-sm lg:hidden">
            <span className="text-foreground font-medium">{STEP_LABELS[step]}</span> · {stepIndex + 1}/
            {steps.length}
          </span>
          <Link
            href="/"
            aria-label="Fermer"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <X className="size-5" />
          </Link>
        </div>
      </header>

      {/* Body — rail · options · preview */}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[80px_minmax(300px,380px)_1fr]">
        {/* Col A — vertical step rail */}
        <nav
          aria-label="Étapes"
          className="bg-card order-1 flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-2 lg:order-none lg:h-full lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-0 lg:py-6"
        >
          {steps.map((s, i) => {
            const Icon = STEP_ICONS[s];
            const done = i < stepIndex;
            const active = i === stepIndex;
            const reachable = i <= stepIndex;
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-muted/50 border-transparent",
                  )}
                >
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className="whitespace-nowrap">{STEP_LABELS[s]}</span>
              </>
            );
            const classes = cn(
              "group flex shrink-0 flex-col items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors lg:px-1",
              active
                ? "text-primary"
                : reachable
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/40 cursor-not-allowed",
            );
            return reachable ? (
              <Link key={s} href={stepUrl(s)} className={classes}>
                {content}
              </Link>
            ) : (
              <span key={s} aria-disabled className={classes}>
                {content}
              </span>
            );
          })}
        </nav>

        {/* Col B — options panel (header shared; controls come from the step page) */}
        <section className="order-3 min-h-0 min-w-0 flex-1 overflow-y-auto border-t px-4 py-6 lg:order-none lg:h-full lg:flex-none lg:border-t-0 lg:border-r">
          <div className="mb-5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Étape {stepIndex + 1} / {steps.length}
            </p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">{STEP_LABELS[step]}</h2>
          </div>
          {children}
        </section>

        {/* Col C — worn preview + floating price / CTA */}
        <section className="bg-muted/30 order-2 relative flex h-[46vh] min-h-0 shrink-0 flex-col lg:order-none lg:h-full">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 lg:p-6 lg:pr-[336px]">
            {/* selection chips */}
            <div className="absolute left-4 top-4 z-10 flex max-w-[60%] flex-col gap-2 lg:left-5 lg:top-5">
              {model && <SelectionChip label={model.name} />}
              {fabric && state.type !== "fabric_only" && (
                <SelectionChip label={fabric.name} swatch={fabric.image_url} />
              )}
              {tailor && <SelectionChip label={tailor.shop_name ?? ""} />}
            </div>

            <GarmentGallery
              photos={photos}
              alt={wearsGarment ? model?.name ?? "Votre tenue" : panelTitle}
              emptyLabel={wearsGarment ? undefined : "Sélectionnez pour visualiser"}
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
              className="h-full w-full"
            />
          </div>

          {/* Floating panel — desktop only */}
          <div className="bg-card absolute right-6 top-6 hidden w-[300px] rounded-2xl border p-6 shadow-lg lg:block">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {ORDER_TYPE_LABELS[state.type]}
            </p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight">
              {panelTitle}
            </h1>
            <p className="text-muted-foreground text-sm">{panelSubtitle}</p>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-primary text-3xl font-bold">{formatPrice(price.total)}</span>
            </div>
            <p className="text-muted-foreground text-xs">TVA incluse · hors livraison</p>

            <div className="mt-5">{cta("desktop")}</div>

            {prevStep && (
              <Link
                href={stepUrl(prevStep)}
                className="text-muted-foreground hover:text-foreground mt-3 flex w-full items-center justify-center gap-1 text-sm"
              >
                <ArrowLeft className="size-3.5" /> Étape précédente
              </Link>
            )}

            <div className="text-muted-foreground mt-5 space-y-1.5 border-t pt-4 text-sm">
              <p>
                Commandez aujourd&apos;hui, recevez en{" "}
                <span className="text-foreground font-medium">
                  {weeks} semaine{weeks > 1 ? "s" : ""}
                </span>
              </p>
              <p className="font-medium">Livraison choisie à la caisse</p>
            </div>

            <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              {price.fabricPrice > 0 && <PriceRow label="Tissu" value={formatPrice(price.fabricPrice)} />}
              {price.tailoringPrice > 0 && (
                <PriceRow label="Confection" value={formatPrice(price.tailoringPrice)} />
              )}
            </dl>
          </div>
        </section>

        {/* Mobile bottom bar — compact price + CTA */}
        <div className="bg-card order-4 shrink-0 border-t p-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground truncate text-xs">
                {panelTitle} · {panelSubtitle}
              </p>
              <p className="text-primary text-xl font-bold leading-tight">
                {formatPrice(price.total)}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {prevStep && (
                <Link
                  href={stepUrl(prevStep)}
                  aria-label="Étape précédente"
                  className="text-muted-foreground hover:bg-muted flex size-11 items-center justify-center rounded-lg border"
                >
                  <ArrowLeft className="size-4" />
                </Link>
              )}
              <div className="w-44">{cta("mobile")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
