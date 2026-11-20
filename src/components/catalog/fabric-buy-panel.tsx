"use client";

import Link from "@/components/i18n/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Minus,
  Package,
  Plus,
  Scissors,
  Store,
  Truck,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { fabricColorHex, parseFabricColors } from "@/lib/fabric-colors";
import { ReviewStars } from "@/components/catalog/review-stars";
import { Button, buttonVariants } from "@/components/ui/button";
import { EuropeBadge } from "@/components/europe/europe-badge";
import { ProductPrice } from "@/components/europe/europe-price";
import { formatMeters, isFabricAvailable, MAX_METERS } from "@/lib/fabric-metrage";
import { formatPrice } from "@/lib/constants";
import {
  colorImage,
  colorUnitPrice,
  fabricLinePrice,
  fabricMinQty,
  fabricStock,
  fabricUnit,
  fabricUnitPrice,
  formatUnits,
  METRAGE_GUIDE,
  unitsToMeters,
} from "@/lib/fabric-specs";
import { deliveryPolicy, type FreeDeliveryZone } from "@/lib/delivery";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { intlLocale } from "@/lib/i18n/config";
import { SalesPendingNotice } from "@/components/catalog/sales-pending-notice";

/** Quantités d'appel par unité — les trois intentions d'achat. */
const QUICK_QTY: Record<string, number[]> = {
  METER: [3, 6, 12],
  YARD: [2, 4, 6],
  PAGNE_2_YARDS: [1, 2, 3],
  COMPLET_6_YARDS: [1, 2, 3],
};

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
  salesPending = false,
  demo = false,
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
  /** Note moyenne des avis vérifiés — rien n'est affiché sans avis réel. */
  rating: number;
  reviewCount: number;
  /** Vendeur pas encore validé par JALOFA : visible, pas encore en vente. */
  salesPending?: boolean;
  /** Tissu de démonstration : on peut l'essayer sur une tenue, pas l'acheter. */
  demo?: boolean;
}) {
  const { addItem } = useCart();
  const t = useT();
  const locale = intlLocale(useLocale());

  // Quantité dans l'unité du vendeur (mètre, yard, pagne, complet) ; le métrage
  // réel (ce que l'atelier coupe) en découle.
  const unit = fabricUnit(fabric);
  const minQty = fabricMinQty(fabric);
  // Le stock du vendeur plafonne la quantité : on ne vend pas ce qu'il n'a pas.
  const stock = fabricStock(fabric);
  const stockMax = stock == null ? Infinity : Math.floor(stock / unit.step) * unit.step;
  const maxQty = Math.max(
    minQty,
    Math.min(stockMax, Math.floor(MAX_METERS / unit.meters / unit.step) * unit.step),
  );
  const quick = (QUICK_QTY[unit.key] ?? []).filter((q) => q >= minQty && q <= maxQty);
  const [qty, setQty] = useState(() => Math.min(maxQty, Math.max(minQty, quick[0] ?? minQty)));
  const meters = unitsToMeters(fabric, qty);
  // Le client choisit sa couleur parmi celles du vendeur ; une couleur peut
  // avoir son prix et sa photo, sinon elle reprend ceux du tissu.
  const colors = parseFabricColors(fabric.color);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const unitPrice = fabricUnitPrice(fabric, color);
  const showUnits = (q: number) => t(formatUnits(fabric, q, locale));

  // Il en reste moins que le minimum de vente : épuisé aussi.
  const available = isFabricAvailable(fabric) && stockMax >= minQty;
  const setSafe = (v: number) =>
    setQty(Math.min(maxQty, Math.max(minQty, Math.round(v / unit.step) * unit.step)));
  const total = fabricLinePrice(fabric, meters, color);

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
      fabricColor: color,
      tailorId: null,
      measurement: null,
      notes: null,
      title: fabric.name,
      subtitle: color ? `${t(color)} · ${t(unit.label)}` : t(unit.label),
      image: colorImage(fabric, color) ?? fabric.image_url,
      styleName: null,
      tailorName: null,
      // Le vendeur le décide pour chacun de ses tissus (cf. basketHasFreeDelivery).
      freeDelivery: deliveryZone !== "none",
      freeDeliveryZone: deliveryZone,
      personalisation: [
        ...(color ? [{ group: t("Couleur"), option: t(color) }] : []),
        {
          group: t("Quantité"),
          option: unit.key === "METER" ? formatMeters(meters) : `${showUnits(qty)} (${formatMeters(meters)})`,
        },
      ],
      measurementLabel: null,
      unitFabricPrice: total,
      unitTailoringPrice: 0,
      unitPrice: total,
    });
    toast.success(t("{m} de {name} ajoutés au panier", { m: showUnits(qty), name: fabric.name }));
  };

  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
        {fabric.material ?? t("Tissu")}
      </p>
      <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight">{fabric.name}</h1>

      {/* Avis vérifiés, tout de suite sous le titre — seulement s'il en existe */}
      {reviewCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="flex items-center gap-1.5">
            <ReviewStars value={rating} size="size-3.5" />
            <span className="font-medium">{rating.toLocaleString(locale)}</span>
          </span>
          <a href="#avis" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
            {t("{n} avis", { n: reviewCount })}
          </a>
        </div>
      )}

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
        <ProductPrice amount={unitPrice} europe={fabric.origin?.europe} />
        <span className="text-muted-foreground text-base font-normal"> / {t(unit.per)}</span>
      </p>

      {fabric.description && (
        <p className="text-muted-foreground mt-4 leading-relaxed">{fabric.description}</p>
      )}

      {/* Les couleurs du tissu : le client choisit la sienne. Une couleur sans
          photo propre montre sa pastille ; avec photo, sa vignette. */}
      {colors.length > 0 && (
        <section className="mt-5">
          <p className="text-sm font-medium">
            {t("Couleur")}
            {color && <span className="text-muted-foreground font-normal"> · {t(color)}</span>}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {colors.map((c) => {
              const hex = fabricColorHex(c);
              const img = colorImage(fabric, c);
              const own = colorUnitPrice(fabric, c);
              const active = color === c;
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors",
                    active ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted",
                  )}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="size-7 rounded-full object-cover" />
                  ) : (
                    <span
                      className="size-7 rounded-full border border-black/20"
                      style={{ backgroundColor: hex ?? undefined }}
                    />
                  )}
                  <span className="font-medium">{t(c)}</span>
                  {own != null && own !== fabricUnitPrice(fabric) && (
                    <span className="text-muted-foreground text-xs">{formatPrice(own)}</span>
                  )}
                </button>
              );
            })}
          </div>
          {colorImage(fabric, color) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={colorImage(fabric, color)!}
              alt={color ?? ""}
              className="mt-3 aspect-[4/3] w-full max-w-xs rounded-xl border object-cover"
            />
          )}
        </section>
      )}

      {/* Coloris — fiches voisines de la même matière, seulement s'il y en a. */}
      {variants.length > 1 && (
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
          <p className="text-sm font-medium">{t("Quantité")}</p>
          <p className="text-muted-foreground text-xs">
            {minQty > unit.step
              ? t("Minimum {q}", { q: showUnits(minQty) })
              : unit.key === "METER"
                ? t("Coupe au demi-mètre")
                : unit.step < 1
                  ? t("Coupe au demi-yard")
                  : t("Vendu à la pièce")}
          </p>
        </div>
        {stock != null && available && stock <= 10 && (
          <p className="mt-1 text-xs font-medium text-amber-500">
            {t("Plus que {q} en stock", { q: showUnits(stock) })}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => setSafe(q)}
              aria-pressed={qty === q}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                qty === q
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {showUnits(q)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setSafe(qty - unit.step)}
              disabled={qty <= minQty}
              aria-label={t("Retirer")}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-md transition-colors disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-16 px-1 text-center font-semibold tabular-nums">
              {showUnits(qty)}
            </span>
            <button
              type="button"
              onClick={() => setSafe(qty + unit.step)}
              disabled={qty >= maxQty}
              aria-label={t("Ajouter")}
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
          {unit.key !== "METER" && `${t("Soit {m}.", { m: formatMeters(meters) })} `}
          {covered
            ? t("De quoi tailler : {use} ({m}).", { use: covered.label.toLowerCase(), m: formatMeters(covered.meters) })
            : t("Sous {m}, prévoyez une petite pièce (foulard, ceinture).", { m: formatMeters(uses.length ? Math.min(...uses.map((u) => u.meters)) : 2) })}
        </p>
      </section>

      {/* Guide de métrage — juste au-dessus du bouton d'achat */}
      <details className="group mt-5 rounded-xl border px-4 py-3 text-sm">
        <summary className="cursor-pointer list-none font-medium marker:hidden">
          <span className="flex items-center justify-between gap-2">
            {t("Combien de mètres commander ?")}
            <Plus className="size-4 transition-transform group-open:rotate-45" />
          </span>
        </summary>
        <ul className="mt-3 space-y-1.5">
          {METRAGE_GUIDE.map((g) => (
            <li key={g.label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t(g.label)}</span>
              <span className="shrink-0 text-right font-medium">{t(g.meters)}</span>
            </li>
          ))}
        </ul>
        {fabric.width_cm ? (
          <p className="text-muted-foreground mt-3 text-xs">
            {t("Pour une laize de {w} cm. Une laize plus étroite demande un peu plus de tissu.", { w: fabric.width_cm })}
          </p>
        ) : null}
      </details>

      {/* Achat */}
      {demo ? (
        <div className="mt-6 grid gap-2.5">
          <SalesPendingNotice demo />
          <Link
            href={`/modeles?fabric=${fabric.id}`}
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-12 w-full text-base",
            )}
          >
            <Scissors className="size-4" /> {t("Essayer sur une tenue")}
          </Link>
        </div>
      ) : salesPending ? (
        <SalesPendingNotice className="mt-6" />
      ) : available ? (
        <div className="mt-6 grid gap-2.5">
          <Button type="button" size="lg" className="h-12 w-full bg-orange-500 text-base text-white hover:bg-orange-600"
            onClick={addToCart}
          >
            <Package className="size-4" /> {t("Ajouter au panier")}
          </Button>
          <Link
            href={`/modeles?fabric=${fabric.id}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full bg-emerald-600 text-base text-white hover:bg-emerald-700",
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
            <dt className="font-medium">{t("Vendu et expédié par JALOFA")}</dt>
            <dd className="text-muted-foreground text-xs">
              {t("Pour un habit, JALOFA envoie le tissu directement à l'atelier de votre tailleur.")}
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
          <dt className="w-24 shrink-0">{t("Vendu par")}</dt>
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
      </dl>
    </div>
  );
}
