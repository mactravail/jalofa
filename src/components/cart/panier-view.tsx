"use client";

import Link from "next/link";
import { Minus, Plus, Scissors, ShoppingBag, Trash2 } from "lucide-react";

import { useCart, type CartItem } from "@/components/cart/cart-context";
import { Price } from "@/components/cart/price";
import { buttonVariants } from "@/components/ui/button";
import { DELIVERY_FEE, basketHasFreeDelivery } from "@/lib/pricing";
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

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
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
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Sous-total</dt>
                <dd>
                  <Price amount={subtotal} className="font-medium" />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Livraison</dt>
                <dd
                  className={cn(
                    "whitespace-nowrap",
                    freeDelivery ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  {freeDelivery ? (
                    "Offerte"
                  ) : (
                    <>
                      dès <Price amount={DELIVERY_FEE} />
                    </>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-4">
              <span className="font-semibold">Total estimé</span>
              <Price amount={subtotal} className="text-primary ml-auto text-xl font-bold" />
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
    <div className="bg-card rounded-2xl border p-4">
      {/* Photo et corbeille sont *flottantes*, pas des colonnes de grille : le
          texte les longe puis reprend toute la largeur de la carte dès qu'il
          passe sous elles. Une vignette en colonne enfermait le titre dans un
          couloir de ~100 px sur un petit écran — « Grand Boubou » se cassait en
          deux et le sous-titre en trois lignes hachées. */}
      <button
        type="button"
        onClick={() => onRemove(item.lineId)}
        aria-label="Retirer du panier"
        className="text-muted-foreground hover:text-destructive hover:bg-muted float-right -mt-1 -mr-1 ml-2 flex size-8 items-center justify-center rounded-full transition-colors"
      >
        <Trash2 className="size-4" />
      </button>

      <div className="bg-muted float-left mr-3 size-14 overflow-hidden rounded-xl sm:mr-4 sm:size-20">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="size-full object-cover" />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Scissors className="size-6 opacity-40" />
          </span>
        )}
      </div>

      <p className="font-medium text-pretty">{item.title}</p>
      <p className="text-muted-foreground mt-0.5 text-xs text-pretty sm:text-sm">
        {item.subtitle}
      </p>

      {/* `clear-both` : les pastilles repartent toujours du bord gauche de la
          carte, sous la photo — jamais coincées dans ce qui reste à côté. */}
      {details.length > 0 && (
        <div className="clear-both flex flex-wrap gap-1.5 pt-3">
          {details.map((d, i) => (
            <span
              key={i}
              className="bg-muted text-muted-foreground max-w-full truncate rounded-full px-2 py-0.5 text-[11px] sm:text-xs"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {item.personalisation.length > 0 && (
        <p className="text-muted-foreground clear-both pt-1.5 text-xs">
          {item.personalisation.map((p) => p.option).join(" · ")}
        </p>
      )}

      {/* Espace garanti sous les flottants : une marge, elle, serait absorbée
          par le « clearance » quand la photo descend plus bas que le texte. */}
      <div aria-hidden className="clear-both h-3" />

      {/* Sélecteur et prix tiennent sur une seule ligne, à toutes les largeurs.
          Le budget est calculé sur le pire cas — « 10 000 000 FCFA » : à 320 px
          d'écran il reste 146 px à droite du sélecteur compact (98 px), le prix
          en 14 px en demande ~100. D'où les tailles réduites ici plutôt qu'un
          repli à la ligne. */}
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <QtyStepper qty={item.qty} onChange={(q) => onQty(item.lineId, q)} />
        <div className="text-right">
          <p>
            <Price
              amount={item.unitPrice * item.qty}
              className="text-sm font-semibold sm:text-base"
            />
          </p>
          {item.qty > 1 && (
            <p className="text-muted-foreground text-[11px]">
              <Price amount={item.unitPrice} /> / pièce
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compact sur mobile (98 px) : c'est ce qui libère la place du prix à côté. */
function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <div className="flex shrink-0 items-center rounded-lg border">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        aria-label="Diminuer la quantité"
        className="hover:bg-muted flex size-8 items-center justify-center rounded-l-lg transition-colors disabled:opacity-40 sm:size-9"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums sm:w-9">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label="Augmenter la quantité"
        className="hover:bg-muted flex size-8 items-center justify-center rounded-r-lg transition-colors sm:size-9"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
