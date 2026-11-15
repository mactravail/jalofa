"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "@/components/i18n/link";
import { useRouter } from "@/lib/i18n/navigation";
import { toast } from "sonner";

import { PasswordField } from "@/components/auth/password-field";
import { TermsCheckbox } from "@/components/auth/signup-verification";
import { checkPassword } from "@/lib/password";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShoppingBag,
  Store,
  Truck,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { Field, OptionCard } from "@/components/order/configurator-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/cart/price";
import {
  placeOrders,
  quoteBasketDelivery,
  type BasketDeliveryQuote,
  type PlaceOrdersState,
} from "@/lib/actions/checkout";
import type { DeliveryOption } from "@/lib/order-workflow";
import {
  DELIVERY_METHOD_LABELS,
  formatPrice,
  type DeliveryMethod,
  type OrderType,
} from "@/lib/constants";
import { RETURN_WINDOW_DAYS } from "@/lib/after-sale";
import { deliveryPolicy } from "@/lib/delivery";
import { basketHasFreeDelivery } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { SavedInfoPrompt, type SavedChoice } from "@/components/account/saved-info-prompt";
import { hasSavedContact, type SavedProfile } from "@/lib/saved-profile";

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
  country: "Sénégal",
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export type CheckoutAccount = typeof EMPTY_CONTACT;

// Pas d'inscription séparée : un nouveau client choisit son mot de passe ici,
// avec ses coordonnées de livraison. `placeOrders` crée son compte avec la
// commande, puis on ouvre directement sa page « Mes commandes ».
export function CheckoutView({
  account = null,
  saved = null,
  accountsEnabled = false,
}: {
  /** Client déjà connecté : coordonnées pré-remplies, pas de mot de passe. */
  account?: CheckoutAccount | null;
  /** Téléphone et adresse enregistrés du client connecté. */
  saved?: SavedProfile | null;
  /** Base branchée : un nouveau client doit choisir un mot de passe. */
  accountsEnabled?: boolean;
}) {
  const router = useRouter();
  const { items, subtotal, count, hydrated, clear } = useCart();
  const t = useT();

  const [chosenDelivery, setDeliveryMethod] = useState<DeliveryMethod>("home");
  // Une tenue est livrée par le tailleur à l'adresse du client : pas de retrait.
  const hasGarment = items.some((it) => it.type !== "fabric_only");
  const deliveryMethod: DeliveryMethod = hasGarment ? "home" : chosenDelivery;

  // Client connecté avec des informations enregistrées : on lui demande s'il
  // les reprend. Il a pu changer d'adresse ou de numéro, ou commander pour
  // quelqu'un d'autre — l'e-mail du compte, lui, reste le sien.
  const offerSaved = Boolean(account && hasSavedContact(saved));
  const [savedChoice, setSavedChoice] = useState<SavedChoice>(null);
  const [contact, setContact] = useState(
    account ? (offerSaved ? { ...EMPTY_CONTACT, email: account.email } : account) : EMPTY_CONTACT,
  );
  const needsPassword = accountsEnabled && !account;
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  // « Enregistrer pour mes prochaines commandes » : coché d'office la première
  // fois, décoché quand le client a refusé ses informations enregistrées.
  const [saveForNext, setSaveForNext] = useState(accountsEnabled && !offerSaved);
  const chooseSaved = (choice: "saved" | "other") => {
    setSavedChoice(choice);
    if (choice === "saved" && account) {
      setContact({ ...account, phone: saved?.phone ?? account.phone });
      if (saved?.address) {
        setAddress({
          address_line: saved.address.address_line,
          city: saved.address.city,
          region: saved.address.region ?? "",
          country: saved.address.country,
        });
      }
    } else {
      setContact({ ...EMPTY_CONTACT, email: account?.email ?? "" });
      setAddress(EMPTY_ADDRESS);
      setSaveForNext(false);
    }
  };

  const [result, formAction, isPending] = useActionState<PlaceOrdersState, FormData>(
    placeOrders,
    null,
  );

  // A (économique) ou B (express) — cahier des charges §3. Les frais sont ceux
  // que chaque pro a fixés sur son profil, recalculés par le serveur.
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("economy");
  const [deliveryQuote, setDeliveryQuote] = useState<BasketDeliveryQuote | null>(null);
  // Une clé par passage en caisse : un double envoi ne paie pas deux fois.
  const [checkoutKey] = useState(() => crypto.randomUUID());
  const quoteLinesKey = JSON.stringify(
    items.map((it) => [it.type, it.fabricId, it.tailorId, it.qty]),
  );
  useEffect(() => {
    let alive = true;
    const lines = (JSON.parse(quoteLinesKey) as [string, string | null, string | null, number][]).map(
      ([type, fabric_id, tailor_id, qty]) => ({ type: type as OrderType, fabric_id, tailor_id, qty }),
    );
    quoteBasketDelivery(lines)
      .then((q) => {
        if (!alive) return;
        setDeliveryQuote(q);
        if (!q.express) setDeliveryOption("economy");
      })
      .catch(() => alive && setDeliveryQuote(null));
    return () => {
      alive = false;
    };
  }, [quoteLinesKey]);
  const chosenFees = deliveryQuote?.[deliveryOption] ?? null;
  const deliveryTotal = chosenFees?.total ?? 0;

  // Commande enregistrée : on vide le panier et on ouvre directement la page
  // du client (son compte vient peut-être d'être créé). En démo, pas de
  // compte : on reste sur la confirmation.
  useEffect(() => {
    if (!result?.ok) return;
    // Bictorys : le client paie sur sa page. Le panier ne se vide qu'une fois le
    // paiement confirmé (page « /paiement/retour »).
    if (result.redirectUrl) {
      window.location.assign(result.redirectUrl);
      return;
    }
    clear();
    if (!result.demo) {
      toast.success(t("Commande confirmée"), {
        description: needsPassword
          ? t("Votre compte est prêt. La prochaine fois, connectez-vous avec votre e-mail et ce mot de passe.")
          : t("Suivez sa confection ici."),
      });
      router.replace("/compte/commandes");
      router.refresh();
    }
  }, [result, clear, router, needsPassword, t]);

  // JALOFA n'ajoute aucun frais : chaque pro a dit, sur son produit, si la livraison
  // est gratuite. Hors de sa zone, le client règle directement le GP ou le livreur.
  const freeHomeDelivery = basketHasFreeDelivery(items, address);
  const total = subtotal + deliveryTotal;

  const payload = useMemo(
    () =>
      JSON.stringify({
        items: items.map((it) => ({
          type: it.type,
          model_id: it.modelId,
          style_slug: it.styleSlug,
          fabric_id: it.fabricId,
          fabric_meters: it.fabricMeters,
          fabric_color: it.fabricColor ?? null,
          ready_color: it.readyColor ?? null,
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
        delivery_option: deliveryOption,
        save_profile: saveForNext && savedChoice !== "saved",
      }),
    [items, deliveryMethod, contact, address, deliveryOption, saveForNext, savedChoice],
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
  const passwordComplete = !needsPassword || checkPassword(password).valid;
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const canSubmit =
    contactComplete &&
    passwordComplete &&
    cityComplete &&
    addressComplete &&
    acceptedTerms;

  // --- Confirmation --------------------------------------------------------
  if (result?.ok && result.redirectUrl) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <Loader2 className="text-primary size-8 animate-spin" />
        <p className="mt-4 font-semibold">{t("Ouverture de la page de paiement…")}</p>
      </div>
    );
  }
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
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("Votre panier est vide")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("Ajoutez une tenue avant de passer à la caisse.")}
        </p>
        <Link href="/modeles" className={cn(buttonVariants({}), "mt-6")}>
          {t("Voir les modèles")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("Caisse")}</h1>

      <form action={formAction} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <input type="hidden" name="payload" value={payload} />
        <input type="hidden" name="checkout_key" value={checkoutKey} />
        <input type="hidden" name="accept_terms" value={acceptedTerms ? "1" : ""} />

        <div className="space-y-8">
          {offerSaved && saved && (
            <SavedInfoPrompt
              title="Utiliser vos informations enregistrées ?"
              summary={[
                [saved.full_name, saved.phone].filter(Boolean).join(" · "),
                saved.address
                  ? [saved.address.address_line, saved.address.city, saved.address.country]
                      .filter(Boolean)
                      .join(", ")
                  : "",
              ].filter(Boolean)}
              choice={savedChoice}
              onChoose={chooseSaved}
              otherLabel="Autre adresse / personne"
            />
          )}

          {/* Contact */}
          <section>
            <h2 className="mb-1 text-lg font-semibold">{t("Vos coordonnées")}</h2>
            <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
              <User className="size-3.5" />
              {t("Nécessaires pour vous joindre au sujet de votre commande.")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("Prénom")}
                value={contact.first_name}
                onChange={(v) => setContact((c) => ({ ...c, first_name: v }))}
              />
              <Field
                label={t("Nom")}
                value={contact.last_name}
                onChange={(v) => setContact((c) => ({ ...c, last_name: v }))}
              />
              <Field
                label={t("Email")}
                type="email"
                placeholder={t("vous@exemple.com")}
                value={contact.email}
                onChange={(v) => setContact((c) => ({ ...c, email: v }))}
              />
              <Field
                label={t("Téléphone")}
                type="tel"
                placeholder="77 000 00 00"
                value={contact.phone}
                onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
              />
            </div>

            {/* Nouveau client : son compte naît avec la commande. Il pourra
                suivre ses commandes et se reconnecter avec cet e-mail. */}
            {needsPassword && (
              <div className="bg-muted/40 mt-4 rounded-xl border p-4">
                <p className="mb-3 text-sm font-medium">
                  {t("Créez votre mot de passe pour suivre votre commande")}
                </p>
                <PasswordField value={password} onChange={setPassword} />
                <p className="text-muted-foreground mt-2 text-xs">
                  {t("Déjà client ? Entrez votre mot de passe habituel, ou")}{" "}
                  <Link
                    href="/connexion?redirect=/caisse"
                    className="text-foreground underline underline-offset-2"
                  >
                    {t("connectez-vous")}
                  </Link>
                  .
                </p>
              </div>
            )}
          </section>

          {/* Option de livraison : A économique / B express */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("Rapidité")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                active={deliveryOption === "economy"}
                onClick={() => setDeliveryOption("economy")}
                icon={Clock}
                title={t("Économique")}
                desc={
                  deliveryQuote?.economy && !deliveryQuote.economy.unknown
                    ? t("24 h pour changer d'avis · Livraison {fee}", { fee: formatPrice(deliveryQuote.economy.total) })
                    : t("24 h pour changer d'avis · Livraison à régler au livreur")
                }
              />
              <OptionCard
                active={deliveryOption === "express"}
                onClick={() => deliveryQuote?.express && setDeliveryOption("express")}
                icon={Zap}
                title={t("Express")}
                desc={
                  deliveryQuote?.express
                    ? t("Envoi le jour même · Livraison {fee} payée maintenant", { fee: formatPrice(deliveryQuote.express.total) })
                    : t("Pas proposé par ces pros")
                }
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {deliveryOption === "economy"
                ? t("Le vendeur attend 24 h avant d'envoyer le tissu, puis le tailleur attend 24 h avant de le couper : vous pouvez demander l'annulation sans perte.")
                : t("Tout part tout de suite. Le tailleur coupe 24 h après votre paiement : après la découpe, une annulation coûte 35 % du prix de la couture.")}
            </p>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("Livraison")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                active={deliveryMethod === "home"}
                onClick={() => setDeliveryMethod("home")}
                icon={MapPin}
                title={t("Livraison à domicile")}
                desc={freeHomeDelivery ? t("Gratuite") : t("Selon le pro")}
              />
              {!hasGarment && (
                <OptionCard
                  active={deliveryMethod === "pickup"}
                  onClick={() => setDeliveryMethod("pickup")}
                  icon={Store}
                  title={t("Retrait en boutique")}
                  desc={t("Gratuit")}
                />
              )}
            </div>

            {deliveryMethod === "home" && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {items.map((item) => (
                  <li key={item.lineId} className="flex items-start gap-1.5">
                    <Truck className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="font-medium">{item.title} : </span>
                      {t(deliveryPolicy(item.freeDeliveryZone))}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {deliveryMethod === "home" && (
                <div className="sm:col-span-2">
                  <Field
                    label={t("Adresse")}
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
                  label={t("Ville")}
                  placeholder={t("Ex : Mbour, Thiès, Dakar, Paris…")}
                  value={address.city}
                  onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                />
              </div>
              {deliveryMethod === "home" && (
                <Field
                  label={t("Région")}
                  value={address.region}
                  onChange={(v) => setAddress((a) => ({ ...a, region: v }))}
                />
              )}
              {deliveryMethod === "home" && (
                <Field
                  label={t("Pays")}
                  value={address.country}
                  onChange={(v) => setAddress((a) => ({ ...a, country: v }))}
                />
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {t("La ville nous aide à regrouper et accélérer les livraisons.")}
            </p>
            {accountsEnabled && savedChoice !== "saved" && (
              <label className="bg-muted/40 mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={saveForNext}
                  onChange={(e) => setSaveForNext(e.target.checked)}
                  className="accent-primary mt-0.5 size-4 shrink-0"
                />
                <span>
                  <span className="font-medium">
                    {t("Enregistrer mon téléphone et mon adresse pour mes prochaines commandes")}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {t("Vous pourrez les modifier dans « Mes coordonnées ».")}
                  </span>
                </span>
              </label>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {t("Annulation possible jusqu'au départ de votre tenue : JALOFA examine et vous rembourse selon l'avancement. Un tissu peut être rendu pendant {d} jours, envoi à votre charge. Une tenue cousue ne se rend pas, mais votre tailleur peut la retoucher.", { d: RETURN_WINDOW_DAYS })}
            </p>
          </section>

          {/* Paiement : la page Bictorys propose Wave, Orange Money, carte… */}
          <section className="bg-muted/40 rounded-xl border p-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="size-5 text-emerald-500" /> {t("Paiement sécurisé")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("Vous payez sur une page de paiement sécurisée : Wave, Orange Money ou carte bancaire.")}
            </p>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card rounded-2xl border p-6">
            <h2 className="text-lg font-semibold">{t("Votre commande")}</h2>

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
                    <p className="text-muted-foreground truncate text-xs">{it.subtitle ? t(it.subtitle) : null}</p>
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
                  {t("Sous-total")} ({count > 1 ? t("{n} articles", { n: count }) : t("{n} article", { n: count })})
                </dt>
                <dd>
                  <Price amount={subtotal} className="font-medium" />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">
                  {t(DELIVERY_METHOD_LABELS[deliveryMethod])}
                </dt>
                <dd className="font-medium whitespace-nowrap">
                  {deliveryTotal > 0 ? (
                    <Price amount={deliveryTotal} />
                  ) : deliveryMethod === "pickup" || freeHomeDelivery || (chosenFees && !chosenFees.unknown) ? (
                    t("Gratuite")
                  ) : (
                    t("Selon le pro")
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-4">
              <span className="font-semibold">{t("Total")}</span>
              <Price amount={total} className="text-primary ml-auto text-xl font-bold" />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{t("TVA incluse")}</p>

            {result && !result.ok && (
              <div className="bg-destructive/10 mt-3 rounded-md px-3 py-2">
                <p className="text-destructive text-sm">{t(result.error)}</p>
              </div>
            )}

            {/* Avant de payer, le client accepte les conditions. */}
            <div className="mt-5">
              <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms}>
                <span className="text-xs">
                  {t("J'accepte les")}{" "}
                  <Link
                    href="/conditions"
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    {t("conditions d'utilisation")}
                  </Link>{" "}
                  {t("et la")}{" "}
                  <Link
                    href="/confidentialite"
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    {t("politique de confidentialité")}
                  </Link>
                  .
                </span>
              </TermsCheckbox>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-4 w-full"
              disabled={!canSubmit || isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t("Confirmer et payer")}
            </Button>
            {!canSubmit && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                {t(
                  !contactComplete
                    ? "Complétez vos coordonnées."
                    : !cityComplete
                      ? "Indiquez la ville de livraison."
                      : !addressComplete
                        ? "Complétez l'adresse de livraison."
                        : !passwordComplete
                          ? "Choisissez votre mot de passe."
                          : "Acceptez les conditions pour payer",
                )}
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
  const t = useT();
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("Commande confirmée")}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {count > 1
          ? t("Merci ! {n} pièces ont bien été commandées. Vous recevrez le suivi de production dans votre espace.", { n: count })
          : t("Merci ! Votre pièce a bien été commandée. Vous recevrez le suivi de production dans votre espace.")}
      </p>

      {orderNumbers.length > 0 && (
        <div className="bg-card mt-6 rounded-xl border p-4 text-left">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {count > 1 ? t("Références") : t("Référence")}
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
          {t("Mode démonstration — aucune commande n'a été réellement enregistrée.")}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/compte/commandes" className={buttonVariants({})}>
          {t("Voir mes commandes")}
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("Retour à l'accueil")}
        </Link>
      </div>
    </div>
  );
}
