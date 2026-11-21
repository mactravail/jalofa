"use client";

import { Check, Lock, Scissors, ShoppingBag, Trash2, Truck, X } from "lucide-react";

import Link from "@/components/i18n/link";
import { useCart, type CartItem } from "@/components/cart/cart-context";
import { QtyStepper } from "@/components/cart/panier-view";
import { Price } from "@/components/cart/price";
import { PaymentLogos } from "@/components/payment-logos";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/components/i18n/locale-provider";
import { FABRIC_FREE_DELIVERY_MIN, fabricSubtotal } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Tiroir « Mon panier » : s'ouvre à droite dès qu'un article est ajouté (ou
 * depuis l'icône panier). Le client voit ce qu'il vient d'ajouter, puis choisit
 * « Valider mon panier » (caisse) ou « Continuer mes achats » (ferme le tiroir).
 */
export function CartDrawer() {
  const { items, count, subtotal, drawerOpen, setDrawerOpen, setQty, removeItem, lastAddedId } =
    useCart();
  const t = useT();
  const close = () => setDrawerOpen(false);
  const justAdded = Boolean(lastAddedId && items.some((i) => i.lineId === lastAddedId));

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ShoppingBag className="size-4" />
            {t("Mon panier")}
            {count > 0 && (
              <span className="bg-foreground text-background flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums">
                {count}
              </span>
            )}
          </SheetTitle>
          <SheetClose
            aria-label={t("Fermer")}
            className="bg-muted hover:bg-muted/70 flex size-8 items-center justify-center rounded-full transition-colors"
          >
            <X className="size-4" />
          </SheetClose>
        </div>

        {justAdded && (
          <p className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-black">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {t("Ajouté au panier")}
          </p>
        )}

        <FabricDeliveryProgress items={items} />

        {/* Articles */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
              <ShoppingBag className="size-7" />
            </div>
            <p className="mt-4 text-lg font-medium">{t("Votre panier est vide")}</p>
            <button
              type="button"
              onClick={close}
              className="bg-foreground text-background hover:bg-foreground/90 mt-6 h-12 rounded-full px-8 text-sm font-semibold transition-colors"
            >
              {t("Continuer mes achats")}
            </button>
          </div>
        ) : (
          <ul className="flex-1 space-y-2.5 overflow-y-auto border-t px-4 py-3">
            {/* Le dernier ajouté en premier : c'est lui que le client veut voir. */}
            {[...items].reverse().map((item) => (
              <li key={item.lineId}>
                <DrawerLine
                  item={item}
                  highlighted={item.lineId === lastAddedId}
                  onQty={setQty}
                  onRemove={removeItem}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Pied : total + deux choix + moyens de paiement */}
        {items.length > 0 && (
          <div className="bg-muted/30 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground text-sm">{t("Total")}</span>
              <Price amount={subtotal} className="text-lg font-bold" />
            </div>
            <Link
              href="/caisse"
              onClick={close}
              className="bg-foreground text-background hover:bg-foreground/90 mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold tracking-wide uppercase transition-colors"
            >
              <Lock className="size-3.5 shrink-0" />
              <span className="truncate">{t("Valider mon panier")}</span>
            </Link>
            <button
              type="button"
              onClick={close}
              className="hover:bg-muted mt-2 flex h-10 w-full items-center justify-center rounded-full border text-xs font-medium transition-colors"
            >
              {t("Continuer mes achats")}
            </button>
            <PaymentLogos className="mt-3 gap-1.5" />
            <p className="text-muted-foreground mt-1.5 flex items-center justify-center gap-1.5 text-[11px]">
              <Lock className="size-3" /> {t("Paiement sécurisé")}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Tissus JALOFA : livraison offerte dès 100 000 FCFA de tissus. Barre visible
 * seulement quand le panier contient du tissu acheté seul.
 */
function FabricDeliveryProgress({ items }: { items: CartItem[] }) {
  const t = useT();
  const total = fabricSubtotal(items);
  if (total <= 0) return null;
  const missing = Math.max(0, FABRIC_FREE_DELIVERY_MIN - total);
  const pct = Math.min(100, (total / FABRIC_FREE_DELIVERY_MIN) * 100);
  const done = missing === 0;

  return (
    <div className="px-4 pb-3">
      <p className="text-center text-xs">
        {done ? (
          <span className="font-semibold text-emerald-400">
            {t("Bravo ! La livraison de vos tissus est offerte")}
          </span>
        ) : (
          <>
            {t("Plus que")} <Price amount={missing} className="font-semibold" />{" "}
            {t("de tissus pour la livraison offerte")}
          </>
        )}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              done ? "bg-emerald-500" : "bg-foreground",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full",
            done ? "bg-emerald-500 text-black" : "bg-muted text-muted-foreground",
          )}
        >
          <Truck className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

function DrawerLine({
  item,
  highlighted,
  onQty,
  onRemove,
}: {
  item: CartItem;
  highlighted: boolean;
  onQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
}) {
  const t = useT();
  const details = [
    item.subtitle ? t(item.subtitle) : null,
    item.measurementLabel ? t(item.measurementLabel) : null,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        "bg-card flex gap-3 rounded-xl border p-2.5",
        highlighted && "border-foreground/40",
      )}
    >
      <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="size-full object-cover" />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Scissors className="size-5 opacity-40" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <p className="line-clamp-2 flex-1 text-sm leading-snug font-semibold">{item.title}</p>
          <button
            type="button"
            onClick={() => onRemove(item.lineId)}
            aria-label={t("Retirer du panier")}
            className="text-muted-foreground hover:text-destructive hover:bg-muted -mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        {details.length > 0 && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">{details.join(" · ")}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <QtyStepper qty={item.qty} onChange={(q) => onQty(item.lineId, q)} />
          <Price amount={item.unitPrice * item.qty} className="text-sm font-semibold" />
        </div>
      </div>
    </div>
  );
}
