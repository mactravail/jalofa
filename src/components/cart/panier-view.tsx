"use client";

import Link from "next/link";
import { Minus, Plus, Scissors, ShoppingBag, Trash2 } from "lucide-react";

import { useCart, type CartItem } from "@/components/cart/cart-context";
import { buttonVariants } from "@/components/ui/button";
import { DELIVERY_FEE, basketHasFreeDelivery } from "@/lib/pricing";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PanierView() {
  const { items, subtotal, count, hydrated, setQty, removeItem } = useCart();

  // Avoid a hydration flash: render nothing decisive until localStorage is read.
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="bg-muted/40 h-64 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="bg-muted text-muted-foreground mx-auto flex size-16 items-center justify-center rounded-full">
          <ShoppingBag className="size-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Votre panier est vide</h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          Parcourez les modèles et les tissus, personnalisez votre tenue, puis
          ajoutez-la au panier.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/modeles" className={buttonVariants({})}>
            Voir les modèles
          </Link>
          <Link href="/tissus" className={buttonVariants({ variant: "outline" })}>
            Voir les tissus
          </Link>
        </div>
      </div>
    );
  }

  const freeDelivery = basketHasFreeDelivery(items);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Panier
        <span className="text-muted-foreground ml-2 text-lg font-normal">
          ({count} article{count > 1 ? "s" : ""})
        </span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.lineId}>
              <CartLine item={item} onQty={setQty} onRemove={removeItem} />
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card rounded-2xl border p-6">
            <h2 className="text-lg font-semibold">Récapitulatif</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Sous-total</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Livraison</dt>
                <dd className={freeDelivery ? "text-primary font-medium" : "text-muted-foreground"}>
                  {freeDelivery ? "Offerte" : `dès ${formatPrice(DELIVERY_FEE)}`}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-semibold">Total estimé</span>
              <span className="text-primary text-xl font-bold">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Frais de livraison calculés à la caisse.
            </p>

            <Link
              href="/caisse"
              className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}
            >
              Passer à la caisse
            </Link>
            <Link
              href="/modeles"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mt-2 w-full",
              )}
            >
              Continuer mes achats
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CartLine({
  item,
  onQty,
  onRemove,
}: {
  item: CartItem;
  onQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
}) {
  const details: string[] = [];
  if (item.styleName) details.push(item.styleName);
  if (item.tailorName) details.push(item.tailorName);
  if (item.type !== "fabric_only" && item.fabricMeters) {
    details.push(`${item.fabricMeters} m de tissu`);
  }
  if (item.measurementLabel) details.push(item.measurementLabel);
  if (item.styleRefs.length > 0) {
    details.push(
      `${item.styleRefs.length} photo${item.styleRefs.length > 1 ? "s" : ""} d'inspiration`,
    );
  }

  return (
    <div className="bg-card flex gap-4 rounded-2xl border p-4">
      <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-xl">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="size-full object-cover" />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Scissors className="size-6 opacity-40" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.title}</p>
            <p className="text-muted-foreground text-sm">{item.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.lineId)}
            aria-label="Retirer du panier"
            className="text-muted-foreground hover:text-destructive hover:bg-muted -mr-1 -mt-1 flex size-8 items-center justify-center rounded-full transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {details.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {details.map((d, i) => (
              <span
                key={i}
                className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {item.personalisation.length > 0 && (
          <p className="text-muted-foreground mt-1.5 line-clamp-1 text-xs">
            {item.personalisation.map((p) => p.option).join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <QtyStepper
            qty={item.qty}
            onChange={(q) => onQty(item.lineId, q)}
          />
          <div className="text-right">
            <p className="font-semibold">{formatPrice(item.unitPrice * item.qty)}</p>
            {item.qty > 1 && (
              <p className="text-muted-foreground text-xs">
                {formatPrice(item.unitPrice)} / pièce
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center rounded-lg border">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        aria-label="Diminuer la quantité"
        className="hover:bg-muted flex size-9 items-center justify-center rounded-l-lg transition-colors disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-9 text-center text-sm font-medium tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label="Augmenter la quantité"
        className="hover:bg-muted flex size-9 items-center justify-center rounded-r-lg transition-colors"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
