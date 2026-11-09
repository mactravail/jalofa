"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  HandCoins,
  Loader2,
  Scissors,
  Shirt,
  Smartphone,
  Store,
} from "lucide-react";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { Stitching, TapeMeasure } from "@/components/auth/couture-decor";
import { PasswordField } from "@/components/auth/password-field";
import { NotARobot, TermsCheckbox } from "@/components/auth/signup-verification";
import { Price } from "@/components/cart/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkPassword } from "@/lib/password";
import {
  FREE_COMMISSION_RATE,
  getPlan,
  PAID_PLAN_ID,
  type ProOfferId,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

const PAID_PLAN = getPlan(PAID_PLAN_ID)!;
const COMMISSION_PCT = Math.round(FREE_COMMISSION_RATE * 100);

/** Champs hauts et texte à 16 px : confortables au doigt, sans zoom auto sur iOS. */
const FIELD_CLASS = "h-12 rounded-xl px-4 md:text-base";

/** Les deux offres d'un compte pro — tailleur ET vendeur de tissu dans les deux cas. */
const OFFERS: {
  id: ProOfferId;
  name: string;
  price: number;
  priceNote: string;
  points: string[];
}[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    priceNote: "par mois",
    points: [
      `${COMMISSION_PCT}% de commission par vente`,
      "Boutique, commandes, messagerie",
    ],
  },
  {
    id: "premium",
    name: PAID_PLAN.name,
    price: PAID_PLAN.monthlyPrice,
    priceNote: "par mois",
    points: [
      "0% de commission : vous gardez 100%",
      "Mise en avant dans le catalogue",
    ],
  },
];

/** Offre Pro : payer tout de suite, ou laisser JALOFA prendre le prix sur la première vente. */
type PayWhen = "now" | "first_sale";
const PAY_WHEN: { id: PayWhen; label: string; icon: typeof Smartphone }[] = [
  { id: "now", label: "Payer maintenant", icon: Smartphone },
  { id: "first_sale", label: "Payer à ma première vente", icon: HandCoins },
];

/**
 * Formulaire d'inscription, dans le style de l'écran de choix (mètre ruban,
 * surpiqûre, grand picto) et dans la couleur de la carte choisie. Deux comptes :
 *  - **client** : carte blanche, gratuit, rien à choisir ;
 *  - **pro** : carte noire, un seul compte pour vendre du tissu et publier comme
 *    tailleur, avec deux offres. L'offre **Pro** se paie au choix tout de suite
 *    (mobile money via PayDunya) ou à la première vente : son prix est alors
 *    retenu sur le reversement de cette vente.
 *
 * Toute inscription exige l'acceptation des conditions et la case « Je ne suis
 * pas un robot ».
 */
export function RegisterForm({
  kind,
  initialOffer,
  redirectTo,
}: {
  kind: "client" | "pro";
  initialOffer?: ProOfferId;
  redirectTo?: string;
}) {
  const isPro = kind === "pro";
  const [offer, setOffer] = useState<ProOfferId>(initialOffer ?? "free");
  const [payWhen, setPayWhen] = useState<PayWhen>("now");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signUp,
    null,
  );

  const passwordOk = checkPassword(password).valid;
  const canSubmit = passwordOk && acceptedTerms && notRobot;
  const paid = isPro && offer === PAID_PLAN_ID;

  const submitLabel = !isPro
    ? "Créer mon compte"
    : paid && payWhen === "now"
      ? "Créer mon compte et payer"
      : "Créer mon compte pro";

  const Icon = isPro ? Scissors : Shirt;

  return (
    <div className="space-y-7">
      <header className="motion-safe:animate-in motion-safe:fade-in space-y-4 text-center motion-safe:duration-500">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.25em] uppercase">
          Créer un compte
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          {isPro ? "Compte pro" : "Compte client"}
        </h1>
        <TapeMeasure />
      </header>

      <div
        className={cn(
          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 relative rounded-3xl p-7 motion-safe:delay-100 motion-safe:duration-500 motion-safe:fill-mode-both",
          isPro
            ? "bg-gradient-to-b from-neutral-900 to-neutral-950 text-white ring-1 ring-white/20"
            : "surface-light text-foreground bg-white",
        )}
      >
        <Stitching
          className={isPro ? "border-white/25" : "border-neutral-950/25"}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              {isPro ? "Professionnel" : "Gratuit"}
            </p>
            <p className="text-muted-foreground text-base">
              {isPro
                ? "Je couds et je vends du tissu."
                : "Je commande des tenues sur mesure."}
            </p>
          </div>
          <Icon aria-hidden strokeWidth={0.6} className="size-20 shrink-0" />
        </div>

        <form action={formAction} className="relative mt-6 space-y-5">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
              {state.error}
            </p>
          )}

          {isPro && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <Scissors aria-hidden className="size-4" /> Tailleur
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <Store aria-hidden className="size-4" /> Vendeur de tissu
                </span>
              </div>

              <Label className="pt-2">Votre offre</Label>
              <div className="grid gap-2">
                {OFFERS.map((o) => {
                  const selected = offer === o.id;
                  return (
                    <button
                      type="button"
                      key={o.id}
                      onClick={() => setOffer(o.id)}
                      aria-pressed={selected}
                      className={cn(
                        "focus-visible:ring-ring/50 w-full rounded-2xl border p-4 text-left transition-colors outline-none focus-visible:ring-3",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/20 hover:border-white/50",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary-foreground bg-primary-foreground text-primary"
                              : "border-white/40",
                          )}
                        >
                          {selected && <Check aria-hidden className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1 text-lg font-bold">
                          {o.name}
                        </span>
                        <span className="shrink-0 text-right">
                          <Price
                            amount={o.price}
                            className="text-lg font-bold"
                          />
                          <span className="block text-xs opacity-70">
                            {o.priceNote}
                          </span>
                        </span>
                      </span>
                      <span className="mt-3 block space-y-1">
                        {o.points.map((p) => (
                          <span
                            key={p}
                            className="flex items-start gap-1.5 text-sm opacity-80"
                          >
                            <Check
                              aria-hidden
                              className="mt-0.5 size-4 shrink-0"
                            />
                            {p}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
              {paid && (
                <div className="space-y-2 pt-2">
                  <Label>Quand payer ?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAY_WHEN.map((p) => {
                      const selected = payWhen === p.id;
                      const PayIcon = p.icon;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setPayWhen(p.id)}
                          aria-pressed={selected}
                          className={cn(
                            "focus-visible:ring-ring/50 flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition-colors outline-none focus-visible:ring-3",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-white/20 hover:border-white/50",
                          )}
                        >
                          <PayIcon aria-hidden className="size-6" />
                          <span className="text-base leading-tight font-bold">
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {payWhen === "now" ? (
                      <>
                        Après la création du compte, vous payez{" "}
                        <Price
                          amount={PAID_PLAN.monthlyPrice}
                          className="text-foreground font-medium"
                        />{" "}
                        avec Orange Money, Wave, Free Money ou carte (paiement
                        sécurisé PayDunya).
                      </>
                    ) : (
                      <>
                        Rien à payer aujourd&apos;hui. L&apos;offre {PAID_PLAN.name}{" "}
                        est active tout de suite, et{" "}
                        <Price
                          amount={PAID_PLAN.monthlyPrice}
                          className="text-foreground font-medium"
                        />{" "}
                        sont retenus sur l&apos;argent de votre première vente.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <input type="hidden" name="role" value={isPro ? "pro" : "client"} />
          {isPro && <input type="hidden" name="offer" value={offer} />}
          {paid && <input type="hidden" name="pay_when" value={payWhen} />}
          {redirectTo && !isPro && (
            <input type="hidden" name="redirect" value={redirectTo} />
          )}
          <input
            type="hidden"
            name="accept_terms"
            value={acceptedTerms ? "true" : "false"}
          />

          <div className="space-y-2">
            <Label htmlFor="full_name">
              {isPro ? "Nom ou nom de l'atelier" : "Nom complet"}
            </Label>
            <Input
              id="full_name"
              name="full_name"
              autoComplete="name"
              required
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              required
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+221 ..."
              className={FIELD_CLASS}
            />
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            inputClassName={FIELD_CLASS}
          />

          <div className="space-y-3 border-t border-dashed pt-5">
            <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms}>
              J&apos;accepte les{" "}
              <Link
                href="/conditions"
                className="text-foreground font-medium underline underline-offset-4"
              >
                conditions générales d&apos;utilisation
              </Link>{" "}
              et la politique de confidentialité de JALOFA.
            </TermsCheckbox>
            <NotARobot checked={notRobot} onChange={setNotRobot} />
          </div>

          <Button
            type="submit"
            className="h-14 w-full rounded-xl text-base font-semibold"
            disabled={!canSubmit || isPending}
          >
            {isPending && <Loader2 className="size-5 animate-spin" />}
            {submitLabel}
          </Button>
          {!canSubmit && (
            <p className="text-muted-foreground text-center text-sm">
              {!passwordOk
                ? "Choisissez un mot de passe qui remplit toutes les exigences."
                : !acceptedTerms
                  ? "Acceptez les conditions générales pour continuer."
                  : "Confirmez que vous n'êtes pas un robot."}
            </p>
          )}
        </form>
      </div>

      <div className="text-muted-foreground flex flex-col items-center text-sm">
        <Link
          href={
            redirectTo
              ? `/inscription?redirect=${encodeURIComponent(redirectTo)}`
              : "/inscription"
          }
          className="text-foreground inline-flex min-h-11 items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Changer de compte
        </Link>
        <p>
          Déjà inscrit ?{" "}
          <Link
            href={
              redirectTo
                ? `/connexion?redirect=${encodeURIComponent(redirectTo)}`
                : "/connexion"
            }
            className="text-foreground inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
