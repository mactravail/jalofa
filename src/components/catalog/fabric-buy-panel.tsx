"use client";

import Link from "next/link";
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
import { ReviewStars } from "@/components/catalog/review-stars";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { clampMeters, formatMeters, METERS_STEP, MIN_CUT_METERS } from "@/lib/fabric-metrage";
import { DELIVERY_FEE } from "@/lib/pricing";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Métrages d'appel — les trois intentions d'achat d'un tissu au mètre. */
const QUICK_METERS = [3, 6, 12];

export type BuyPanelUse = { label: string; meters: number };

export function FabricBuyPanel({
  fabric,
  variants,
  uses,
  vendorName,
  vendorHref,
  vendorFreeDelivery,
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
  vendorFreeDelivery: boolean;
  rating: number;
  reviewCount: number;
  orders: number;
}) {
  const { addItem } = useCart();
  const [meters, setMeters] = useState(3);

  const max = Math.max(MIN_CUT_METERS, Math.min(fabric.stock_meters || 30, 30));
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
      subtitle: "Tissu au mètre",
      image: fabric.image_url,
      styleName: null,
      tailorName: null,
      // Livraison offerte si le vendeur du tissu la prend à sa charge
      // (cf. basketHasFreeDelivery).
      freeDelivery: vendorFreeDelivery,
      personalisation: [{ group: "Métrage", option: formatMeters(meters) }],
      measurementLabel: null,
      unitFabricPrice: total,
      unitTailoringPrice: 0,
      unitPrice: total,
    });
    toast.success(`${formatMeters(meters)} de ${fabric.name} ajoutés au panier`);
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
      toast.success("Lien copié");
    } catch {
      // Partage annulé ou presse-papiers refusé — rien à signaler au client.
    }
  };

  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
        {fabric.material ?? "Tissu"}
      </p>
      <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight">{fabric.name}</h1>

      {/* Preuve sociale, tout de suite sous le titre */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5">
          <ReviewStars value={rating} size="size-3.5" />
          <span className="font-medium">{rating.toLocaleString("fr-FR")}</span>
        </span>
        <a href="#avis" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
          {reviewCount} avis
        </a>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {orders.toLocaleString("fr-FR")} commandes
        </span>
      </div>

      <p className="mt-5 text-3xl font-semibold">
        {formatPrice(fabric.price_per_meter)}
        <span className="text-muted-foreground text-base font-normal"> / mètre</span>
      </p>

      {fabric.description && (
        <p className="text-muted-foreground mt-4 leading-relaxed">{fabric.description}</p>
      )}

      {/* Coloris — la couleur de CE rouleau, et les fiches voisines de la même
          matière quand le catalogue la décline. */}
      {variants.length > 0 && (
        <section className="mt-6">
          <p className="text-sm font-medium">
            Coloris{" "}
            <span className="text-muted-foreground font-normal">
              · {fabric.color ?? "unique"}
              {variants.length > 1 && ` — ${variants.length} coloris disponibles`}
            </span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.id === fabric.id;
              return (
                <Link
                  key={v.id}
                  href={`/tissus/${v.id}`}
                  aria-label={v.color ?? "Coloris"}
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
          <p className="text-sm font-medium">Métrage</p>
          <p className="text-muted-foreground text-xs">
            Coupe au demi-mètre · {formatMeters(fabric.stock_meters)} en stock
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
              aria-label="Retirer un demi-mètre"
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
              aria-label="Ajouter un demi-mètre"
              className="hover:bg-muted flex size-9 items-center justify-center rounded-md transition-colors disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <p className="text-xl font-semibold">{formatPrice(total)}</p>
        </div>

        <p className="text-muted-foreground mt-2 text-xs">
          {covered
            ? `De quoi tailler : ${covered.label.toLowerCase()} (${formatMeters(covered.meters)}).`
            : `Sous ${formatMeters(uses.length ? Math.min(...uses.map((u) => u.meters)) : 2)}, prévoyez une petite pièce (foulard, ceinture).`}
        </p>
      </section>

      {/* Achat */}
      <div className="mt-6 grid gap-2.5">
        <Button type="button" size="lg" className="h-12 w-full text-base" onClick={addToCart}>
          <Package className="size-4" /> Ajouter au panier
        </Button>
        <Link
          href={`/modeles?fabric=${fabric.id}`}
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "h-12 w-full text-base",
          )}
        >
          <Scissors className="size-4" /> Faire coudre une tenue
        </Link>
      </div>

      {/* Livraison — dite clairement, sans promesse que la caisse ne tiendrait pas */}
      <dl className="mt-6 grid gap-2.5 rounded-xl border p-4 text-sm">
        <div className="flex items-start gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0" />
          <div>
            <dt className="font-medium">
              {vendorFreeDelivery ? (
                <>
                  Livraison à domicile — <span className="text-primary">offerte</span>
                </>
              ) : (
                <>Livraison à domicile — {formatPrice(DELIVERY_FEE)}</>
              )}
            </dt>
            <dd className="text-muted-foreground text-xs">
              {vendorFreeDelivery
                ? `${vendorName ? `${vendorName} prend ` : "Le vendeur prend "}la livraison à sa charge. Dakar sous 48 h, régions sous 3 à 5 jours.`
                : "Dakar sous 48 h, régions sous 3 à 5 jours. Payable à la caisse."}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Store className="mt-0.5 size-4 shrink-0" />
          <div>
            <dt className="font-medium">Retrait en boutique — gratuit</dt>
            <dd className="text-muted-foreground text-xs">
              {vendorName ? `Chez ${vendorName}, ` : ""}aux horaires du vendeur.
            </dd>
          </div>
        </div>
      </dl>

      {/* Fiche technique — la ligne « SKU / catégorie / partage » du commerce */}
      <dl className="text-muted-foreground mt-5 space-y-1.5 border-t pt-5 text-sm">
        <div className="flex gap-3">
          <dt className="w-24 shrink-0">Référence</dt>
          <dd className="text-foreground font-mono text-xs uppercase">
            {fabric.id.slice(-8)}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0">Matière</dt>
          <dd className="text-foreground">{fabric.material ?? "—"}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0">Boutique</dt>
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
          <dt className="w-24 shrink-0">Partager</dt>
          <dd className="flex items-center gap-2">
            <button
              type="button"
              onClick={share}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors"
              aria-label="Partager ce tissu"
            >
              <Share2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Lien copié");
                } catch {
                  toast.error("Copie impossible");
                }
              }}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors"
              aria-label="Copier le lien"
            >
              <Copy className="size-4" />
            </button>
          </dd>
        </div>
      </dl>
    </div>
  );
}
