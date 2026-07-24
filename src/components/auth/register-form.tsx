"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Scissors, ShoppingBag } from "lucide-react";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { NotARobot, TermsCheckbox } from "@/components/auth/signup-verification";
import {
  SubscriptionPayment,
  type SubPaymentMethod,
} from "@/components/auth/subscription-payment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/constants";
import {
  getPlan,
  periodTotal,
  type BillingPeriod,
  type SubscriptionPlanId,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

/** Les deux métiers proposés au plan Standard (un seul au choix). */
const METIERS = [
  {
    value: "tailor",
    label: "Tailleur",
    desc: "Confectionner des tenues",
    icon: Scissors,
  },
  {
    value: "vendor",
    label: "Vendeur",
    desc: "Vendre du tissu",
    icon: ShoppingBag,
  },
] as const;

/**
 * L'inscription suit l'abonnement choisi sur `/abonnements`. Sans plan, on crée
 * un compte client. Le plan **Standard** demande de choisir un métier (tailleur
 * ou vendeur) ; **Gratuit** et **Premium** ouvrent les deux — aucun choix à
 * faire (le Gratuit prélève une commission par vente).
 *
 * Toute inscription exige l'acceptation des conditions et la case « Je ne suis
 * pas un robot ». Les plans **payants** (Standard, Premium) ajoutent une étape de
 * paiement — Wave ou virement bancaire — avant la création du compte ; le plan
 * **Gratuit** n'a rien à régler.
 */
export function RegisterForm({
  initialPlan,
  initialPeriod,
  initialMetier,
  redirectTo,
}: {
  initialPlan?: string;
  initialPeriod?: string;
  initialMetier?: string;
  redirectTo?: string;
}) {
  const plan = initialPlan
    ? getPlan(initialPlan as SubscriptionPlanId)
    : undefined;
  const isPaid = plan ? plan.monthlyPrice > 0 : false;

  // Périodicité choisie sur /abonnements : le paiement annuel encaisse toute
  // l'année d'un coup (remise incluse), le mensuel une seule mensualité.
  const period: BillingPeriod = initialPeriod === "yearly" ? "yearly" : "monthly";
  const amountDue = plan ? periodTotal(plan, period) : 0;

  // Métier pré-sélectionné quand on arrive depuis « Je suis tailleur/vendeur ».
  const [metier, setMetier] = useState<"tailor" | "vendor">(
    initialMetier === "vendor" ? "vendor" : "tailor",
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [payMethod, setPayMethod] = useState<SubPaymentMethod | null>(null);
  const [bankConfirmed, setBankConfirmed] = useState(false);

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signUp,
    null,
  );

  // Le rôle transmis au serveur (qui le revalide de toute façon).
  const role = !plan ? "client" : plan.scope === "both" ? "tailor" : metier;

  // Paiement réglé : Wave (QR scanné) ou virement confirmé. Les plans gratuits
  // n'ont rien à payer.
  const paymentDone =
    !isPaid ||
    payMethod === "wave" ||
    (payMethod === "bank" && bankConfirmed);
  const canSubmit = acceptedTerms && notRobot && paymentDone;

  const submitLabel = isPaid
    ? `Payer ${formatPrice(amountDue)} et créer mon compte`
    : plan
      ? "Créer mon compte pro"
      : "Créer mon compte";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {plan ? `Abonnement ${plan.name}` : "Créer un compte"}
        </CardTitle>
        <CardDescription>
          {plan
            ? "Créez votre compte pro pour activer votre abonnement."
            : "Rejoignez JALOFA en quelques secondes."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-5">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {state.error}
            </p>
          )}

          {plan?.scope === "single" && (
            <div className="space-y-2">
              <Label>Votre métier</Label>
              <div className="grid grid-cols-2 gap-2">
                {METIERS.map((m) => (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setMetier(m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
                      metier === m.value
                        ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                        : "hover:bg-muted",
                    )}
                  >
                    <m.icon
                      className={cn(
                        "size-5",
                        metier === m.value
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-muted-foreground text-[11px] leading-tight">
                      {m.desc}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Le plan Standard couvre un seul métier. Besoin des deux ?{" "}
                <Link href="/abonnements" className="text-primary hover:underline">
                  Passez au Premium
                </Link>
                .
              </p>
            </div>
          )}

          {plan?.scope === "both" && (
            <div className="border-primary/30 bg-primary/5 space-y-1.5 rounded-lg border p-3">
              <p className="text-sm font-medium">Les deux métiers inclus</p>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Check className="text-primary size-3.5 shrink-0" /> Tailleur —
                confectionner des tenues
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Check className="text-primary size-3.5 shrink-0" /> Vendeur —
                vendre du tissu
              </p>
              {plan.commission > 0 && (
                <p className="text-muted-foreground border-primary/20 mt-1 border-t pt-1.5 text-xs">
                  Sans abonnement : commission de{" "}
                  {Math.round(plan.commission * 100)}% par vente de tissu et{" "}
                  {Math.round(plan.commission * 100)}% par prestation de couture.
                </p>
              )}
            </div>
          )}

          {!plan && (
            <p className="text-muted-foreground rounded-lg border p-3 text-xs">
              Vous créez un compte client, gratuit. Vous êtes tailleur ou vendeur
              de tissus ?{" "}
              <Link
                href="/abonnements"
                className="text-primary font-medium hover:underline"
              >
                Découvrez nos abonnements pros
              </Link>
              .
            </p>
          )}

          <input type="hidden" name="role" value={role} />
          {redirectTo && (
            <input type="hidden" name="redirect" value={redirectTo} />
          )}
          {plan && <input type="hidden" name="plan" value={plan.id} />}
          {isPaid && (
            <input type="hidden" name="billing_period" value={period} />
          )}
          <input
            type="hidden"
            name="accept_terms"
            value={acceptedTerms ? "true" : "false"}
          />
          {isPaid && payMethod && (
            <input type="hidden" name="payment_method" value={payMethod} />
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required />
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {/* Paiement — uniquement pour les plans payants (Standard, Premium). */}
          {isPaid && plan && (
            <div className="border-t pt-5">
              <SubscriptionPayment
                plan={plan}
                period={period}
                method={payMethod}
                onMethodChange={setPayMethod}
                bankConfirmed={bankConfirmed}
                onBankConfirmedChange={setBankConfirmed}
              />
            </div>
          )}

          {/* Conditions + anti-robot — obligatoires pour toute inscription. */}
          <div className="space-y-3 border-t pt-5">
            <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms}>
              J&apos;accepte les{" "}
              <Link
                href="/conditions"
                className="text-primary font-medium hover:underline"
              >
                conditions générales d&apos;utilisation
              </Link>{" "}
              et la politique de confidentialité de JALOFA.
            </TermsCheckbox>
            <NotARobot checked={notRobot} onChange={setNotRobot} />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
          {!canSubmit && (
            <p className="text-muted-foreground text-center text-xs">
              {!acceptedTerms
                ? "Acceptez les conditions générales pour continuer."
                : !notRobot
                  ? "Confirmez que vous n'êtes pas un robot."
                  : !payMethod
                    ? "Choisissez un moyen de paiement."
                    : "Confirmez votre virement bancaire."}
            </p>
          )}
          <p className="text-muted-foreground text-center text-sm">
            Déjà inscrit ?{" "}
            <Link
              href={
                redirectTo
                  ? `/connexion?redirect=${encodeURIComponent(redirectTo)}`
                  : "/connexion"
              }
              className="text-primary font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
