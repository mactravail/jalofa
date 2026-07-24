"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Clock,
  Scissors,
  ShoppingBag,
  X,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { GarmentGallery } from "@/components/catalog/garment-gallery";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { ORDER_TYPE_LABELS, formatPrice, modelPhotos } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  buildCartItem,
  STEP_BY_SLUG,
  STEP_HELP,
  STEP_ICONS,
  STEP_LABELS,
  STEP_REQUIREMENT,
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

  // Le panneau des choix est la zone qui défile : en changeant d'étape il reste
  // monté, donc sans ça on arrive au milieu de la nouvelle étape.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const deliveryDays = tailor?.avg_delivery_days ?? model?.avg_days ?? 14;
  const weeks = Math.max(1, Math.round(deliveryDays / 7));

  const panelTitle =
    state.type === "fabric_only" ? fabric?.name ?? "Tissu" : model?.name ?? "Votre tenue";
  const panelSubtitle = state.type === "fabric_only" ? "Au mètre" : "Sur mesure";
  const requirement = canProceed ? null : STEP_REQUIREMENT[step];

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

  // Ce qui est déjà choisi, en une ligne — sur téléphone c'est le seul rappel
  // de la tenue, le grand bandeau photo n'y tient pas.
  const summaryLine = [
    panelSubtitle,
    wearsGarment ? fabric?.name : null,
    tailor?.shop_name,
  ]
    .filter(Boolean)
    .join(" · ");

  // Reusable CTA (Continue / Add to cart) used by both the desktop card and the
  // mobile bottom bar.
  const cta = (idSuffix: string, className?: string) =>
    isLast ? (
      <Button
        type="button"
        size="lg"
        className={cn("w-full", className)}
        onClick={addToCart}
        data-cta={idSuffix}
      >
        <ShoppingBag className="size-4" /> Ajouter au panier
      </Button>
    ) : (
      <Button
        type="button"
        size="lg"
        className={cn("w-full", className)}
        onClick={goNext}
        disabled={!canProceed}
        data-cta={idSuffix}
      >
        Continuer <ChevronRight className="size-4" />
      </Button>
    );

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Slim top bar — brand + close */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Link href="/" aria-label="JALOFA — accueil" className="flex items-center">
          <Wordmark size="sm" />
        </Link>
        <span className="bg-muted text-muted-foreground ml-1 hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline">
          Démo
        </span>

        <Link
          href="/"
          aria-label="Fermer"
          className="text-muted-foreground hover:bg-muted hover:text-foreground ml-auto flex size-9 items-center justify-center rounded-full transition-colors"
        >
          <X className="size-5" />
        </Link>
      </header>

      {/* Avancement (hors bureau, où le rail vertical le dit déjà).
          Une barre de segments plutôt que la rangée d'icônes : à 360 px les cinq
          icônes débordaient, et on se retrouvait à faire défiler la navigation
          avant même de pouvoir choisir quoi que ce soit. */}
      <ol className="flex shrink-0 items-center gap-1.5 border-b px-4 py-2 lg:hidden">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const reachable = i <= stepIndex;
          const bar = (
            <span
              className={cn(
                "block h-1 rounded-full transition-colors",
                done || active ? "bg-primary" : "bg-muted",
              )}
            />
          );
          return (
            <li key={s} className="flex-1">
              {reachable && !active ? (
                <Link
                  href={stepUrl(s)}
                  aria-label={`Revenir à l'étape ${i + 1} — ${STEP_LABELS[s]}`}
                  className="block py-2.5"
                >
                  {bar}
                </Link>
              ) : (
                <span
                  aria-current={active ? "step" : undefined}
                  aria-label={`Étape ${i + 1} — ${STEP_LABELS[s]}`}
                  className="block py-2.5"
                >
                  {bar}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Body — rail · choix · photo.
          Téléphone : une seule colonne qui défile, les choix occupent tout
          l'écran (avant, ils tenaient dans une fenêtre de ~110 px coincée entre
          la photo et la barre de prix). Tablette : photo à gauche, choix à
          droite. Bureau : rail · choix · photo. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,40%)_1fr] lg:grid-cols-[80px_minmax(300px,380px)_1fr] lg:grid-rows-1">
        {/* Col A — vertical step rail (bureau) */}
        <nav
          aria-label="Étapes"
          className="bg-card hidden lg:col-start-1 lg:row-start-1 lg:flex lg:h-full lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:border-r lg:py-6"
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
              "group flex shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors",
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
        <section
          ref={panelRef}
          className="col-start-1 row-start-1 min-h-0 min-w-0 overflow-y-auto px-4 py-5 sm:col-start-2 sm:border-l lg:col-start-2 lg:row-start-1 lg:h-full lg:border-l-0 lg:border-r lg:px-6 lg:py-6"
        >
          {/* Téléphone — la tenue en cours, en une ligne : on sait ce qu'on
              configure sans sacrifier la moitié de l'écran à une photo. */}
          <div className="mb-5 flex items-center gap-3 rounded-xl border p-2.5 sm:hidden">
            <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
              {photos[0] ? (
                <Image
                  src={photos[0]}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <Scissors className="text-muted-foreground absolute inset-0 m-auto size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{panelTitle}</p>
              <p className="text-muted-foreground truncate text-xs">{summaryLine}</p>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                <Clock className="size-3" /> Livré en {weeks} semaine{weeks > 1 ? "s" : ""}
              </p>
            </div>
            {wearsGarment && fabric?.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fabric.image_url}
                alt={fabric.name}
                className="size-9 shrink-0 rounded-full object-cover"
              />
            )}
          </div>

          <div className="mb-5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Étape {stepIndex + 1} sur {steps.length}
            </p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">{STEP_LABELS[step]}</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-snug">{STEP_HELP[step]}</p>
          </div>
          {children}
        </section>

        {/* Col C — worn preview + floating price / CTA. Masquée sur téléphone :
            le rappel en une ligne au-dessus des choix suffit. */}
        <section className="bg-muted/30 relative hidden flex-col sm:col-start-1 sm:row-start-1 sm:flex sm:h-full lg:col-start-3">
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
              sizes="(max-width: 1024px) 40vw, 45vw"
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
            {requirement && (
              <p className="text-muted-foreground mt-2 text-center text-xs">{requirement}</p>
            )}

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

        {/* Barre du bas (téléphone / tablette) — le prix sur une ligne, puis un
            vrai bouton pleine largeur : « 72 000 FCFA » ne se coupe plus en deux
            et « Ajouter au panier » n'est plus tronqué. */}
        <div className="bg-card col-start-1 row-start-2 shrink-0 border-t px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:col-span-2 lg:hidden">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-muted-foreground min-w-0 truncate text-xs">
              {panelTitle} · {panelSubtitle}
            </p>
            <p className="text-primary shrink-0 text-xl font-bold leading-none whitespace-nowrap">
              {formatPrice(price.total)}
            </p>
          </div>

          {requirement && (
            <p className="text-muted-foreground mt-1.5 text-xs">{requirement}</p>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            {prevStep && (
              <Link
                href={stepUrl(prevStep)}
                aria-label={`Retour — ${STEP_LABELS[prevStep]}`}
                className="text-muted-foreground hover:bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg border"
              >
                <ArrowLeft className="size-4" />
              </Link>
            )}
            <div className="min-w-0 flex-1">{cta("mobile", "h-12 text-base")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
