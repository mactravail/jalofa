"use client";

import Link from "@/components/i18n/link";
import { useState } from "react";
import {
  Check,
  CircleCheck,
  Lock,
  Minus,
  Plus,
  Scissors,
  Store,
  Truck,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { fabricColorHex, parseFabricColors } from "@/lib/fabric-colors";
import { ReviewStars } from "@/components/catalog/review-stars";
import { buttonVariants } from "@/components/ui/button";
import { EuropeBadge } from "@/components/europe/europe-badge";
import { ProductPrice } from "@/components/europe/europe-price";
import { PaymentLogos } from "@/components/payment-logos";
import { formatMeters, isFabricAvailable, MAX_METERS } from "@/lib/fabric-metrage";
import {
  colorImage,
  fabricDiscount,
  fabricFullLinePrice,
  fabricFullUnitPrice,
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
import { clearPendingOutfit, readPendingOutfit } from "@/lib/pending-outfit";

/** Quantités d'appel par unité — les trois intentions d'achat. */
const QUICK_QTY: Record<string, number[]> = {
  METER: [3, 6],
  YARD: [2, 4],
  PAGNE_2_YARDS: [1, 2],
  COMPLET_6_YARDS: [1, 2],
};

export type BuyPanelUse = { label: string; meters: number };

/** Ligne de la liste « points forts » (pastille cochée + texte). */
function Perk({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) {
  return (
    <li className={cn("flex items-center gap-2", alert && "text-red-400")}>
      <CircleCheck className="size-3.5 shrink-0" strokeWidth={1.6} />
      <span>{children}</span>
    </li>
  );
}

/** Titre centré entre deux traits — « ——— QUANTITÉ ——— ». */
function RuleHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-foreground h-0.5 flex-1" />
      <span className="text-sm font-bold tracking-wide uppercase">{children}</span>
      <span className="bg-foreground h-0.5 flex-1" />
    </div>
  );
}

export function FabricBuyPanel({
  fabric,
  variants,
  uses,
  deliveryZone,
  rating,
  reviewCount,
  reviewPhotos = [],
  facts = [],
  salesPending = false,
  demo = false,
}: {
  fabric: Fabric;
  /** Le même tissu dans ses autres coloris (fiches voisines). */
  variants: { id: string; color: string | null; image_url: string | null }[];
  uses: BuyPanelUse[];
  /** Où JALOFA offre la livraison de ce tissu. */
  deliveryZone: FreeDeliveryZone;
  /** Note moyenne des avis vérifiés — rien n'est affiché sans avis réel. */
  rating: number;
  reviewCount: number;
  /** Photos jointes aux avis vérifiés (vraies clientes, vrais habits). */
  reviewPhotos?: string[];
  /** Points forts réels du tissu (matière, laize, entretien…), déjà traduits. */
  facts?: string[];
  /** Vendeur pas encore validé par JALOFA : visible, pas encore en vente. */
  salesPending?: boolean;
  /** Tissu de démonstration : on peut l'essayer sur une tenue, pas l'acheter. */
  demo?: boolean;
}) {
  const { addItem } = useCart();
  const t = useT();
  const locale = intlLocale(useLocale());

  // Quantité dans l'unité du tissu (mètre, yard, pagne, complet) ; le métrage
  // réel (ce que l'atelier coupe) en découle.
  const unit = fabricUnit(fabric);
  const minQty = fabricMinQty(fabric);
  // Le stock plafonne la quantité : on ne vend pas ce qu'on n'a pas.
  const stock = fabricStock(fabric);
  const stockMax = stock == null ? Infinity : Math.floor(stock / unit.step) * unit.step;
  const maxQty = Math.max(
    minQty,
    Math.min(stockMax, Math.floor(MAX_METERS / unit.meters / unit.step) * unit.step),
  );
  const quick = (QUICK_QTY[unit.key] ?? []).filter((q) => q >= minQty && q <= maxQty);
  const [qty, setQty] = useState(() => Math.min(maxQty, Math.max(minQty, quick[0] ?? minQty)));
  // « Autre quantité » : la carte avec le compteur +/−.
  const [custom, setCustom] = useState(quick.length === 0);
  // « Faire coudre » activé : le bouton mène au choix de la tenue.
  const [sew, setSew] = useState(false);
  const meters = unitsToMeters(fabric, qty);
  const colors = parseFabricColors(fabric.color);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const unitPrice = fabricUnitPrice(fabric, color);
  const showUnits = (q: number) => t(formatUnits(fabric, q, locale));
  const europe = fabric.origin?.europe;
  const discount = fabricDiscount(fabric);

  // Il en reste moins que le minimum de vente : épuisé aussi.
  const available = isFabricAvailable(fabric) && stockMax >= minQty;
  const setSafe = (v: number) =>
    setQty(Math.min(maxQty, Math.max(minQty, Math.round(v / unit.step) * unit.step)));
  const total = fabricLinePrice(fabric, meters, color);

  // Ce qu'un métrage permet de tailler — la pièce la plus ambitieuse qui tient
  // dedans. C'est la traduction concrète d'un nombre de mètres.
  const coveredBy = (m: number) =>
    [...uses].sort((a, b) => b.meters - a.meters).find((u) => u.meters <= m);
  const covered = coveredBy(meters);
  const smallest = uses.length ? Math.min(...uses.map((u) => u.meters)) : 2;
  const coverText = (m: number) => {
    const c = coveredBy(m);
    return c
      ? t("De quoi tailler : {use}", { use: c.label.toLowerCase() })
      : t("Petite pièce (foulard, ceinture)");
  };

  const lowStock = stock != null && available && stock <= 10;
  const freeDelivery = deliveryZone !== "none";
  const image = colorImage(fabric, color) ?? fabric.image_url;

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
      image,
      styleName: null,
      tailorName: null,
      freeDelivery,
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
    // Tissu acheté : le rappel « votre tenue vous attend » sur ce tissu s'arrête.
    if (readPendingOutfit()?.fabricId === fabric.id) clearPendingOutfit();
  };

  const ctaClass =
    "bg-foreground text-background hover:bg-foreground/90 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-[0.2em] uppercase transition-colors";

  return (
    <div>
      {/* Titre — capitales, large, comme une étiquette de rouleau */}
      <h1 className="text-3xl leading-tight font-semibold tracking-wide uppercase sm:text-4xl">
        {fabric.name}
      </h1>

      {europe && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <EuropeBadge country={fabric.origin?.country} />
          {fabric.origin?.city && (
            <span className="text-muted-foreground">
              {t("Boutique à {place}", {
                place: [fabric.origin.city, fabric.origin.country].filter(Boolean).join(", "),
              })}
            </span>
          )}
        </p>
      )}

      {/* Prix réduit, prix plein barré et pastille « −20 % » s'il y a une promo */}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xl font-semibold whitespace-nowrap">
          <ProductPrice amount={unitPrice} europe={europe} />
          <span className="text-muted-foreground text-sm font-normal"> / {t(unit.per)}</span>
        </span>
        {discount > 0 && (
          <>
            <s className="text-muted-foreground text-sm whitespace-nowrap">
              <ProductPrice amount={fabricFullUnitPrice(fabric, color)} europe={europe} />
            </s>
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white uppercase">
              −{discount} %
            </span>
          </>
        )}
      </p>

      <div className="mt-5 border-t" />

      {/* Avis vérifiés — seulement s'il en existe */}
      {reviewCount > 0 && (
        <a href="#avis" className="mt-5 flex items-center gap-2 text-base hover:underline">
          <ReviewStars value={rating} size="size-5" />
          <span>{t("{n} avis", { n: reviewCount })}</span>
        </a>
      )}

      {/* Points forts — de vrais faits sur le tissu, rien d'inventé */}
      <ul className="mt-4 space-y-1.5 text-xs leading-snug">
        {facts.map((f) => (
          <Perk key={f}>{f}</Perk>
        ))}
        <Perk>{t("Vendu et expédié par JALOFA")}</Perk>
        <Perk>{t("Pour un habit, envoyé directement à l'atelier de votre tailleur")}</Perk>
        {lowStock && <Perk alert>{t("Plus que {q} en stock", { q: showUnits(stock!) })}</Perk>}
      </ul>

      {fabric.description && (
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{fabric.description}</p>
      )}

      {/* Couleur : pastilles rondes, le nom de la couleur choisie à côté du titre */}
      {/* Une seule couleur + des coloris voisins : la ligne « Coloris » suffit. */}
      {colors.length > 0 && (colors.length > 1 || variants.length <= 1) && (
        <section className="mt-6">
          <p className="text-sm">
            {t("Couleur")} : <span className="font-medium">{color ? t(color) : "—"}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => {
              const hex = fabricColorHex(c);
              const img = colorImage(fabric, c);
              const active = color === c;
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-pressed={active}
                  aria-label={t(c)}
                  title={t(c)}
                  className={cn(
                    "rounded-full p-0.5 transition-shadow",
                    active ? "ring-foreground ring-2" : "hover:ring-muted-foreground/50 hover:ring-1",
                  )}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    <span
                      className="block size-8 rounded-full border border-white/15"
                      style={{ backgroundColor: hex ?? undefined }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Coloris — fiches voisines de la même matière, seulement s'il y en a */}
      {variants.length > 1 && (
        <section className="mt-6">
          <p className="text-sm">
            {t("Coloris")} : <span className="font-medium">{fabric.color ?? t("unique")}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
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
                    "rounded-full p-0.5 transition-shadow",
                    active ? "ring-foreground ring-2" : "hover:ring-muted-foreground/50 hover:ring-1",
                  )}
                >
                  <span className="bg-muted block size-8 overflow-hidden rounded-full">
                    {v.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.image_url} alt="" className="size-full object-cover" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {demo ? (
        <div className="mt-8 grid gap-3">
          <SalesPendingNotice demo />
          <Link href={`/tissus/${fabric.id}/tenue`} className={ctaClass}>
            <Scissors className="size-4" /> {t("Essayer sur une tenue")}
          </Link>
        </div>
      ) : salesPending ? (
        <SalesPendingNotice className="mt-8" />
      ) : !available ? (
        <p className="bg-muted mt-8 rounded-xl p-4 text-center font-semibold">
          {t("Ce tissu est épuisé")}
        </p>
      ) : (
        <>
          {/* Quantité — cartes à choisir, comme des offres */}
          <div className="mt-8">
            <RuleHeading>{t("Quantité")}</RuleHeading>
            <p className="text-muted-foreground mt-3 text-center text-sm">
              {minQty > unit.step
                ? t("Minimum {q}", { q: showUnits(minQty) })
                : unit.key === "METER"
                  ? t("Coupe au demi-mètre")
                  : unit.step < 1
                    ? t("Coupe au demi-yard")
                    : t("Vendu à la pièce")}
            </p>
          </div>

          <div role="radiogroup" aria-label={t("Quantité")} className="mt-4 grid gap-3">
            {quick.map((q) => {
              const active = !custom && qty === q;
              const m = unitsToMeters(fabric, q);
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  key={q}
                  onClick={() => {
                    setCustom(false);
                    setSafe(q);
                  }}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors",
                    active ? "border-foreground" : "bg-muted/40 hover:bg-muted border-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                      active ? "border-foreground bg-foreground text-background" : "border-foreground/60",
                    )}
                  >
                    {active && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold">{showUnits(q)}</span>
                    <span className="text-muted-foreground block text-sm italic">
                      {coverText(m)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right whitespace-nowrap">
                    <span className="block text-lg font-bold">
                      <ProductPrice amount={fabricLinePrice(fabric, m, color)} europe={europe} />
                    </span>
                    {discount > 0 && (
                      <s className="text-muted-foreground block text-xs">
                        <ProductPrice amount={fabricFullLinePrice(fabric, m, color)} europe={europe} />
                      </s>
                    )}
                  </span>
                </button>
              );
            })}

            {/* Autre quantité : compteur libre */}
            <div
              className={cn(
                "rounded-xl border-2 p-4 transition-colors",
                custom ? "border-foreground" : "bg-muted/40 hover:bg-muted border-transparent",
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={custom}
                onClick={() => setCustom(true)}
                className="flex w-full items-center gap-4 text-left"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                    custom ? "border-foreground bg-foreground text-background" : "border-foreground/60",
                  )}
                >
                  {custom && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="flex-1 text-lg font-bold">{t("Autre quantité")}</span>
                {custom && (
                  <span className="shrink-0 text-right whitespace-nowrap">
                    <span className="block text-lg font-bold">
                      <ProductPrice amount={total} europe={europe} />
                    </span>
                    {discount > 0 && (
                      <s className="text-muted-foreground block text-xs">
                        <ProductPrice amount={fabricFullLinePrice(fabric, meters, color)} europe={europe} />
                      </s>
                    )}
                  </span>
                )}
              </button>
              {custom && (
                <div className="mt-3 flex flex-wrap items-center gap-3 pl-10">
                  <div className="bg-background flex items-center gap-1 rounded-lg border p-1">
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
                  <span className="text-muted-foreground text-sm italic">
                    {covered ? coverText(meters) : t("Sous {m}, prévoyez une petite pièce (foulard, ceinture).", { m: formatMeters(smallest) })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {unit.key !== "METER" && (
            <p className="text-muted-foreground mt-2 text-center text-xs">
              {t("Soit {m}.", { m: formatMeters(meters) })}
            </p>
          )}

          {/* Guide de métrage */}
          <details className="group mt-4 rounded-xl border px-4 py-3 text-sm">
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

          {/* Ajout : faire coudre — l'interrupteur change la suite de l'achat */}
          <p className="mt-8 text-sm font-bold tracking-wide uppercase">{t("Et pour la tenue :")}</p>
          <div className="bg-muted/60 mt-3 flex items-center gap-3 rounded-xl p-3 sm:gap-4 sm:p-4">
            <div className="bg-background size-11 shrink-0 overflow-hidden rounded-lg sm:size-16">
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold whitespace-nowrap uppercase sm:text-base">{t("Faire coudre")}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug sm:text-sm">
                {t("Choisissez un modèle et un tailleur : le tissu part à son atelier.")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sew}
              aria-label={t("Faire coudre")}
              onClick={() => setSew((s) => !s)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                sew ? "bg-emerald-600" : "bg-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
                  sew && "translate-x-5",
                )}
              />
            </button>
          </div>
          {sew && (
            <p className="text-muted-foreground mt-3 text-center text-sm">
              {t("Le métrage sera calculé pour la tenue que vous choisirez.")}
            </p>
          )}

          {/* Inclus avec la commande — des services réels, pas des cadeaux inventés */}
          <div className="mt-8 text-center">
            <span className="bg-muted inline-block rounded-lg px-4 py-1.5 text-sm font-bold">
              {t("INCLUS avec votre commande")}
            </span>
            <ul className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
              {[
                {
                  icon: Truck,
                  label:
                    deliveryZone === "dakar"
                      ? t("Livraison offerte à Dakar")
                      : deliveryZone === "senegal"
                        ? t("Livraison offerte au Sénégal")
                        : freeDelivery
                          ? t("Livraison offerte")
                          : t("Livraison à domicile"),
                },
                { icon: Store, label: t("Envoi à l'atelier du tailleur") },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2">
                  <span className="bg-muted flex size-16 items-center justify-center rounded-xl">
                    <Icon className="size-6" strokeWidth={1.5} />
                  </span>
                  <span className="text-xs leading-snug sm:text-sm">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* L'achat */}
          <div className="mt-6">
            {sew ? (
              <Link href={`/tissus/${fabric.id}/tenue`} className={ctaClass}>
                {t("Choisir ma tenue")}
              </Link>
            ) : (
              <button type="button" onClick={addToCart} className={ctaClass}>
                {t("Ajouter au panier")}
              </button>
            )}
            <PaymentLogos className="mt-4" extra={["Mastercard", "PayPal"]} />
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1 text-[11px]">
              <Lock className="size-3" /> {t("Paiement sécurisé")}
            </p>
            <p className="text-muted-foreground mt-3 text-center text-xs">
              {t(deliveryPolicy(deliveryZone))}
            </p>
          </div>
        </>
      )}

      {/* Preuve sociale : les vraies photos jointes aux avis, s'il y en a */}
      {reviewPhotos.length > 0 && (
        <section className="mt-10 text-center">
          <h2 className="text-lg font-semibold tracking-[0.15em] uppercase">
            {t("Ils l'ont porté")}
          </h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-3">
            {reviewPhotos.slice(0, 3).map((url) => (
              <li key={url}>
                <a href="#avis" className="block size-24 overflow-hidden rounded-full border sm:size-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={t("Photo de l'avis")} className="size-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lien secondaire vers les tenues, même en mode simple achat */}
      {!demo && !salesPending && available && !sew && (
        <Link
          href={`/tissus/${fabric.id}/tenue`}
          className={cn(buttonVariants({ variant: "link" }), "mt-4 w-full")}
        >
          <Scissors className="size-4" /> {t("Voir les tenues possibles avec ce tissu")}
        </Link>
      )}
    </div>
  );
}
