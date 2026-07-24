"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
  User,
} from "lucide-react";

import {
  CardPaymentForm,
  EMPTY_CARD,
  isCardComplete,
  type CardDetails,
} from "@/components/cart/card-payment-form";
import { WaveMark, WaveQrPayment } from "@/components/cart/wave-payment";
import { useCart } from "@/components/cart/cart-context";
import { Field, OptionCard } from "@/components/order/configurator-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/cart/price";
import { placeOrders, type PlaceOrdersState } from "@/lib/actions/checkout";
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  formatPrice,
  type DeliveryMethod,
  type PaymentMethod,
} from "@/lib/constants";
import { DELIVERY_FEE, basketHasFreeDelivery } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// Always collected — a pickup order still needs someone to hand the piece to.
const EMPTY_CONTACT = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

const EMPTY_ADDRESS = {
  address_line: "",
  city: "",
  region: "",
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Moyens de paiement proposés à la caisse (Orange Money / Free Money restent
// dans le type et la DB, mais ne sont pas encore ouverts au public).
const VISIBLE_PAYMENT_METHODS: PaymentMethod[] = ["wave", "card"];

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> =
  {
    orange_money: Smartphone,
    wave: WaveMark,
    free_money: Smartphone,
    card: CreditCard,
  };

const PAYMENT_METHOD_DESCS: Partial<Record<PaymentMethod, string>> = {
  wave: "Paiement par QR code",
  card: "Visa, Mastercard, Amex",
};

export function CheckoutView({ requiresLogin = false }: { requiresLogin?: boolean }) {
  const { items, subtotal, count, hydrated, clear } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home");
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  // Card details stay client-side: the gateway is stubbed for the MVP and a PAN
  // has no business reaching our server action or the orders table.
  const [card, setCard] = useState<CardDetails>(EMPTY_CARD);

  const [result, formAction, isPending] = useActionState<PlaceOrdersState, FormData>(
    placeOrders,
    null,
  );

  // Empty the basket once the order is placed.
  useEffect(() => {
    if (result?.ok) clear();
  }, [result, clear]);

  // Livraison offerte quand tous les articles viennent de tailleurs qui la
  // prennent à leur charge (cf. `basketHasFreeDelivery`).
  const freeHomeDelivery = basketHasFreeDelivery(items);
  const deliveryFee = deliveryMethod === "home" && !freeHomeDelivery ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const payload = useMemo(
    () =>
      JSON.stringify({
        items: items.map((it) => ({
          type: it.type,
          model_id: it.modelId,
          style_slug: it.styleSlug,
          fabric_id: it.fabricId,
          fabric_meters: it.fabricMeters,
          tailor_id: it.tailorId,
          measurement: it.measurement,
          notes: it.notes,
          qty: it.qty,
        })),
        delivery_method: deliveryMethod,
        delivery_city: address.city.trim() || null,
        contact,
        address:
          deliveryMethod === "home"
            ? { ...address, region: address.region || null }
            : null,
        payment_method: paymentMethod,
      }),
    [items, deliveryMethod, contact, address, paymentMethod],
  );

  const contactComplete = Boolean(
    contact.first_name.trim() &&
      contact.last_name.trim() &&
      isEmail(contact.email) &&
      contact.phone.trim(),
  );
  // La ville est demandée quel que soit le mode de livraison ; l'adresse
  // complète (rue) ne l'est que pour une livraison à domicile.
  const cityComplete = Boolean(address.city.trim());
  const addressComplete =
    deliveryMethod === "pickup" || Boolean(address.address_line.trim());
  const paymentComplete =
    paymentMethod === "card" ? isCardComplete(card) : Boolean(paymentMethod);
  const canSubmit =
    paymentComplete && contactComplete && cityComplete && addressComplete;

  // --- Confirmation --------------------------------------------------------
  if (result?.ok) {
    return <Confirmation orderNumbers={result.orderNumbers} demo={result.demo} />;
  }

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
        <p className="text-muted-foreground mt-2 text-sm">
          Ajoutez une tenue avant de passer à la caisse.
        </p>
        <Link href="/modeles" className={cn(buttonVariants({}), "mt-6")}>
          Voir les modèles
        </Link>
      </div>
    );
  }

  // Connexion requise avant d'enregistrer la commande : on la demande ici,
  // clairement, plutôt que de laisser l'erreur surgir après le paiement. Le
  // panier est conservé (localStorage), la connexion ramène à la caisse.
  if (requiresLogin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
          <User className="size-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Connectez-vous pour finaliser
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Votre panier est enregistré. Connectez-vous ou créez un compte pour
          confirmer votre commande et suivre sa production.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/connexion?redirect=/caisse"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full",
            )}
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Caisse</h1>

      <form action={formAction} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <input type="hidden" name="payload" value={payload} />

        <div className="space-y-8">
          {/* Contact */}
          <section>
            <h2 className="mb-1 text-lg font-semibold">Vos coordonnées</h2>
            <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
              <User className="size-3.5" />
              Nécessaires pour vous joindre au sujet de votre commande.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Prénom"
                value={contact.first_name}
                onChange={(v) => setContact((c) => ({ ...c, first_name: v }))}
              />
              <Field
                label="Nom"
                value={contact.last_name}
                onChange={(v) => setContact((c) => ({ ...c, last_name: v }))}
              />
              <Field
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                value={contact.email}
                onChange={(v) => setContact((c) => ({ ...c, email: v }))}
              />
              <Field
                label="Téléphone"
                type="tel"
                placeholder="77 000 00 00"
                value={contact.phone}
                onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
              />
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Livraison</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                active={deliveryMethod === "home"}
                onClick={() => setDeliveryMethod("home")}
                icon={MapPin}
                title="Livraison à domicile"
                desc={freeHomeDelivery ? "Offerte par l'atelier" : `+ ${formatPrice(DELIVERY_FEE)}`}
              />
              <OptionCard
                active={deliveryMethod === "pickup"}
                onClick={() => setDeliveryMethod("pickup")}
                icon={Store}
                title="Retrait en boutique"
                desc="Gratuit"
              />
            </div>

            {freeHomeDelivery && (
              <p className="text-primary mt-3 flex items-center gap-1.5 text-sm font-medium">
                <Truck className="size-4" />
                Votre atelier offre la livraison à domicile.
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {deliveryMethod === "home" && (
                <div className="sm:col-span-2">
                  <Field
                    label="Adresse"
                    value={address.address_line}
                    onChange={(v) => setAddress((a) => ({ ...a, address_line: v }))}
                  />
                </div>
              )}
              {/* Toujours demandée : c'est la ville qui permet au tailleur de
                  regrouper les colis d'une même destination et de les expédier
                  ensemble, même pour un retrait en boutique. */}
              <div className={deliveryMethod === "home" ? undefined : "sm:col-span-2"}>
                <Field
                  label="Ville"
                  placeholder="Ex : Mbour, Thiès, Dakar, Paris…"
                  value={address.city}
                  onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                />
              </div>
              {deliveryMethod === "home" && (
                <Field
                  label="Région"
                  value={address.region}
                  onChange={(v) => setAddress((a) => ({ ...a, region: v }))}
                />
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              La ville nous aide à regrouper et accélérer les livraisons.
            </p>
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Paiement</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {VISIBLE_PAYMENT_METHODS.map((pm) => (
                <OptionCard
                  key={pm}
                  active={paymentMethod === pm}
                  onClick={() => setPaymentMethod(pm)}
                  icon={PAYMENT_METHOD_ICONS[pm]}
                  title={PAYMENT_METHOD_LABELS[pm]}
                  desc={PAYMENT_METHOD_DESCS[pm]}
                />
              ))}
            </div>

            {paymentMethod === "wave" && <WaveQrPayment total={total} />}

            {paymentMethod === "card" && (
              <CardPaymentForm card={card} onChange={setCard} />
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card rounded-2xl border p-6">
            <h2 className="text-lg font-semibold">Votre commande</h2>

            <ul className="mt-4 space-y-3 border-b pb-4">
              {items.map((it) => (
                <li key={it.lineId} className="flex items-center gap-3">
                  <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-lg">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt="" className="size-full object-cover" />
                    )}
                    <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                      {it.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{it.subtitle}</p>
                  </div>
                  <Price
                    amount={it.unitPrice * it.qty}
                    className="shrink-0 text-sm font-medium"
                  />
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">
                  Sous-total ({count} article{count > 1 ? "s" : ""})
                </dt>
                <dd>
                  <Price amount={subtotal} className="font-medium" />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">
                  {DELIVERY_METHOD_LABELS[deliveryMethod]}
                </dt>
                <dd className="font-medium whitespace-nowrap">
                  {deliveryFee > 0 ? (
                    <Price amount={deliveryFee} />
                  ) : deliveryMethod === "home" ? (
                    "Offerte"
                  ) : (
                    "Gratuit"
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-4">
              <span className="font-semibold">Total</span>
              <Price amount={total} className="text-primary ml-auto text-xl font-bold" />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">TVA incluse</p>

            {result && !result.ok && (
              <div className="bg-destructive/10 mt-3 rounded-md px-3 py-2">
                <p className="text-destructive text-sm">{result.error}</p>
                {result.error.includes("connecté") && (
                  <Link
                    href="/connexion?redirect=/caisse"
                    className={cn(buttonVariants({ size: "sm" }), "mt-2 w-full")}
                  >
                    Se connecter
                  </Link>
                )}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              disabled={!canSubmit || isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmer et payer
            </Button>
            {!canSubmit && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                {!contactComplete
                  ? "Complétez vos coordonnées."
                  : !cityComplete
                    ? "Indiquez la ville de livraison."
                    : !addressComplete
                      ? "Complétez l'adresse de livraison."
                      : !paymentMethod
                        ? "Choisissez un moyen de paiement."
                        : "Complétez les détails de votre carte."}
              </p>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}

function Confirmation({
  orderNumbers,
  demo,
}: {
  orderNumbers: string[];
  demo: boolean;
}) {
  const count = orderNumbers.length;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Commande confirmée</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Merci ! {count > 1 ? `${count} pièces ont` : "Votre pièce a"} bien été
        {count > 1 ? " " : " "}commandée{count > 1 ? "s" : ""}. Vous recevrez le suivi de
        production dans votre espace.
      </p>

      {orderNumbers.length > 0 && (
        <div className="bg-card mt-6 rounded-xl border p-4 text-left">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Référence{count > 1 ? "s" : ""}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {orderNumbers.map((n) => (
              <li key={n} className="bg-muted rounded-md px-2 py-1 font-mono text-xs">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {demo && (
        <p className="text-muted-foreground mt-4 text-xs">
          Mode démonstration — aucune commande n&apos;a été réellement enregistrée.
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/compte/commandes" className={buttonVariants({})}>
          Voir mes commandes
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
