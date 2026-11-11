"use client";

import Link from "@/components/i18n/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Minus,
  Package,
  Plus,
  Scissors,
  Share2,
  Store,
  Truck,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { fabricColorHex, parseFabricColors } from "@/lib/fabric-colors";
import { ReviewStars } from "@/components/catalog/review-stars";
import { Button, buttonVariants } from "@/components/ui/button";
import { EuropeBadge } from "@/components/europe/europe-badge";
import { ProductPrice } from "@/components/europe/europe-price";
import {
  clampMeters,
  formatMeters,
  isFabricAvailable,
  MAX_METERS,
  METERS_STEP,
  MIN_CUT_METERS,
} from "@/lib/fabric-metrage";
import { deliveryPolicy, type FreeDeliveryZone } from "@/lib/delivery";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { intlLocale } from "@/lib/i18n/config";

/** Métrages d'appel — les trois intentions d'achat d'un tissu au mètre. */
const QUICK_METERS = [3, 6, 12];

export type BuyPanelUse = { label: string; meters: number };

export function FabricBuyPanel({
  fabric,
  variants,
  uses,
  vendorName,
  vendorHref,
  deliveryZone,
  rating,
  reviewCount,
  orders,
}: {
  fabric: Fabric;
  /** Le même tissu dans ses autres coloris (fiches voisines). */
  variants: { id: string; color: string | null; image_url: string | null }[];
  uses: BuyPanelUse[];
  vendorName: string | null;
  vendorHref: string | null;
  /** Le vendeur prend la livraison à sa charge : elle n'est pas facturée. */
  /** Où le pro offre la livraison de ce tissu. */
  deliveryZone: FreeDeliveryZone;
  rating: number;
  reviewCount: number;
  orders: number;
}) {
  const { addItem } = useCart();
  const [meters, setMeters] = useState(3);
  const t = useT();
  const locale = intlLocale(useLocale());

  const max = MAX_METERS;
  const available = isFabricAvailable(fabric);
  const setSafe = (v: number) => setMeters(clampMeters(v, MIN_CUT_METERS, max));
  const total = fabric.price_per_meter * meters;

  // Ce que le métrage choisi permet de tailler — la pièce la plus ambitieuse
  // qui tient dedans. C'est la traduction concrète d'un nombre de mètres.
  const covered = [...uses].sort((a, b) => b.meters - a.meters).find((u) => u.meters <= meters);

  const addToCart = () => {
    addItem({
      type: "fabric_only",
      modelId: null,
      styleSlug: null,
      styleDetails: {},
      styleRefs: [],
      fabricId: fabric.id,
      fabricMeters: meters,
      tailorId: null,
      measurement: null,
      notes: null,
      title: fabric.name,
      subtitle: t("Tissu au mètre"),
      image: fabric.image_url,
      styleName: null,
      tailorName: null,
      // Le vendeur le décide pour chacun de ses tissus (cf. basketHasFreeDelivery).
      freeDelivery: deliveryZone !== "none",
      freeDeliveryZone: deliveryZone,
      personalisation: [{ group: t("Métrage"), option: formatMeters(meters) }],
      measurementLabel: null,
      unitFabricPrice: total,
      unitTailoringPrice: 0,
      unitPrice: total,
    });
    toast.success(t("{m} de {name} ajoutés au panier", { m: formatMeters(meters), name: fabric.name }));
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ title: fabric.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("Lien copié"));
    } catch {
      // Partage annulé ou presse-papiers refusé — rien à signaler au client.
    }
  };

  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
        {fabric.material ?? t("Tissu")}
      </p>
      <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight">{fabric.name}</h1>

      {/* Preuve sociale, tout de suite sous le titre */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5">
          <ReviewStars value={rating} size="size-3.5" />
          <span className="font-medium">{rating.toLocaleString(locale)}</span>
        </span>
        <a href="#avis" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
          {t("{n} avis", { n: reviewCount })}
        </a>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {t("{n} commandes", { n: orders.toLocaleString(locale) })}
        </span>
      </div>

      {fabric.origin?.europe && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <EuropeBadge country={fabric.origin.country} />
          {fabric.origin.city && (
            <span className="text-muted-foreground">
              {t("Boutique à {place}", { place: [fabric.origin.city, fabric.origin.country].filter(Boolean).join(", ") })}
            </span>
          )}
        </p>
      )}

      <p className="mt-5 text-3xl font-semibold">
        <ProductPrice amount={fabric.price_per_meter} europe={fabric.origin?.europe} />
        <span className="text-muted-foreground text-base font-normal"> / {t("mètre")}</span>
      </p>

      {fabric.description && (
        <p className="text-muted-foreground mt-4 leading-relaxed">{fabric.description}</p>
      )}

      {/* Les couleurs du tissu, cochées par le vendeur — en pastilles. */}
      {parseFabricColors(fabric.color).length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {parseFabricColors(fabric.color).map((c) => {
            const hex = fabricColorHex(c);
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
              >
                {hex && (
                  <span
                    className="size-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: hex }}
                  />
                )}
                {t(c)}
              </span>
            );
          })}
        </div>
      )}

      {/* Coloris — la couleur de CE rouleau, et les fiches voisines de la même
          matière quand le catalogue la décline. */}
      {variants.length > 0 && (
        <section className="mt-6">
          <p className="text-sm font-medium">
            {t("Coloris")}{" "}
            <span className="text-muted-foreground font-normal">
              · {fabric.color ?? t("unique")}
              {variants.length > 1 && ` — ${t("{n} coloris disponibles", { n: variants.length })}`}
            </span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.id === fabric.id;
              return (
                <Link
                  key={v.id}
                  href={`/tissus/${v.id}`}
                  aria-label={v.color ?? t("Coloris")}
                  title={v.color ?? undefined}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative size-11 overflow-hidden rounded-full border transition-colors",
                    active ? "border-primary ring-primary/30 ring-2" : "hover:border-border",
                  )}
                >
                  {v.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image_url} alt="" className="size-full object-cover" />
                  )}
                  {active && (
                    <span className="bg-background/80 absolute inset-0 flex items-center justify-center">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Métrage */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">{t("Métrage")}</p>
          <p className="text-muted-foreground text-xs">
            {t("Coupe au demi-mètre")}
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {QUICK_METERS.filter((q) => q <= max).map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => setSafe(q)}
              aria-pressed={meters === q}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                meters === q
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {formatMeters(q)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setSafe(meters - METERS_STEP)}
              disabled={meters <= MIN_CUT_METERS}
              aria-label={t("Retirer un demi-mètre")}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-md transition-colors disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-16 text-center font-semibold tabular-nums">
              {formatMeters(meters)}
            </span>
            <button
              type="button"
              onClick={() => setSafe(meters + METERS_STEP)}
              disabled={meters >= max}
              aria-label={t("Ajouter un demi-mètre")}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-md transition-colors disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <p className="text-xl font-semibold">
            <ProductPrice amount={total} europe={fabric.origin?.europe} stacked />
          </p>
        </div>

        <p className="text-muted-foreground mt-2 text-xs">
          {covered
            ? t("De quoi tailler : {use} ({m}).", { use: covered.label.toLowerCase(), m: formatMeters(covered.meters) })
            : t("Sous {m}, prévoyez une petite pièce (foulard, ceinture).", { m: formatMeters(uses.length ? Math.min(...uses.map((u) => u.meters)) : 2) })}
        </p>
      </section>

      {/* Achat */}
      {available ? (
        <div className="mt-6 grid gap-2.5">
          <Button type="button" size="lg" className="h-12 w-full text-base" onClick={addToCart}>
            <Package className="size-4" /> {t("Ajouter au panier")}
          </Button>
          <Link
            href={`/modeles?fabric=${fabric.id}`}
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-12 w-full text-base",
            )}
          >
            <Scissors className="size-4" /> {t("Faire coudre une tenue")}
          </Link>
        </div>
      ) : (
        <p className="bg-muted mt-6 rounded-xl p-4 text-center font-semibold">
          {t("Ce tissu est épuisé")}
        </p>
      )}

      {/* Livraison — dite clairement, sans promesse que la caisse ne tiendrait pas */}
      <dl className="mt-6 grid gap-2.5 rounded-xl border p-4 text-sm">
        <div className="flex items-start gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0" />
          <div>
            <dt className="font-medium">
              {t("Livraison")}
            </dt>
            <dd className="text-muted-foreground text-xs">
              {t(deliveryPolicy(deliveryZone))}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Store className="mt-0.5 size-4 shrink-0" />
          <div>
            <dt className="font-medium">{t("Retrait en boutique — gratuit")}</dt>
            <dd className="text-muted-foreground text-xs">
              {vendorName
                ? t("Chez {name}, aux horaires du vendeur.", { name: vendorName })
                : t("Aux horaires du vendeur.")}
            </dd>
          </div>
        </div>
      </dl>

      {/* Fiche technique — la ligne « SKU / catégorie / partage » du commerce */}
      <dl className="text-muted-foreground mt-5 space-y-1.5 border-t pt-5 text-sm">
        <div className="flex gap-3">
          <dt className="w-24 shrink-0">{t("Référence")}</dt>
          <dd className="text-foreground font-mono text-xs uppercase">
            {fabric.id.slice(-8)}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0">{t("Matière")}</dt>
          <dd className="text-foreground">{fabric.material ?? "—"}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0">{t("Boutique")}</dt>
          <dd>
            {vendorHref && vendorName ? (
              <Link href={vendorHref} className="text-foreground hover:underline">
                {vendorName}
              </Link>
            ) : (
              <span className="text-foreground">{vendorName ?? "—"}</span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="w-24 shrink-0">{t("Partager")}</dt>
          <dd className="flex items-center gap-2">
            <button
              type="button"
              onClick={share}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors"
              aria-label={t("Partager ce tissu")}
            >
              <Share2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success(t("Lien copié"));
                } catch {
                  toast.error(t("Copie impossible"));
                }
              }}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors"
              aria-label={t("Copier le lien")}
            >
              <Copy className="size-4" />
            </button>
          </dd>
        </div>
      </dl>
    </div>
  );
}
