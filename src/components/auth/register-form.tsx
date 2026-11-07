"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Scissors, Shirt } from "lucide-react";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { NotARobot, TermsCheckbox } from "@/components/auth/signup-verification";
import { Price } from "@/components/cart/price";
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
      "Tailleur + vendeur de tissu",
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
      "Tailleur + vendeur de tissu",
      "Mise en avant dans le catalogue",
    ],
  },
];

/**
 * Formulaire d'inscription. Deux comptes :
 *  - **client** : gratuit, rien à choisir ;
 *  - **pro** : un seul compte pour vendre du tissu et publier comme tailleur,
 *    avec deux offres. L'offre **Pro** se paie en mobile money via PayDunya
 *    juste après la création du compte.
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
    : paid
      ? "Créer mon compte et payer"
      : "Créer mon compte pro";

  return (
    <Card>
      <CardHeader>
        <span
          className={cn(
            "mb-1 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            isPro
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200",
          )}
        >
          {isPro ? (
            <>
              <Scissors className="size-3.5" /> Tailleur + vendeur de tissu
            </>
          ) : (
            <>
              <Shirt className="size-3.5" /> Client · gratuit
            </>
          )}
        </span>
        <CardTitle className="text-2xl">
          {isPro ? "Compte pro" : "Compte client"}
        </CardTitle>
        <CardDescription>
          {isPro
            ? "Tailleur et vendeur de tissu dans le même compte. Choisissez votre offre."
            : "Gratuit. Rejoignez JALOFA en quelques secondes."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-5">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {state.error}
            </p>
          )}

          {isPro && (
            <div className="space-y-2">
              <Label>Votre offre</Label>
              <div className="grid grid-cols-2 gap-2">
                {OFFERS.map((o) => {
                  const selected = offer === o.id;
                  return (
                    <button
                      type="button"
                      key={o.id}
                      onClick={() => setOffer(o.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-w-0 flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-heading font-semibold">{o.name}</span>
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {selected && <Check className="size-3" />}
                        </span>
                      </span>
                      <span>
                        <Price amount={o.price} className="text-lg font-bold" />
                        <span className="text-muted-foreground block text-[11px]">
                          {o.priceNote}
                        </span>
                      </span>
                      <span className="space-y-1">
                        {o.points.map((p) => (
                          <span
                            key={p}
                            className="text-muted-foreground flex items-start gap-1 text-[11px] leading-tight"
                          >
                            <Check className="text-primary mt-px size-3 shrink-0" />
                            {p}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
              {paid && (
                <p className="text-muted-foreground text-xs">
                  Après la création du compte, vous payez{" "}
                  <Price amount={PAID_PLAN.monthlyPrice} className="font-medium" />{" "}
                  avec Orange Money, Wave, Free Money ou carte (paiement sécurisé
                  PayDunya).
                </p>
              )}
            </div>
          )}

          <input type="hidden" name="role" value={isPro ? "pro" : "client"} />
          {isPro && <input type="hidden" name="offer" value={offer} />}
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
          <PasswordField value={password} onChange={setPassword} />

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
              {!passwordOk
                ? "Choisissez un mot de passe qui remplit toutes les exigences."
                : !acceptedTerms
                  ? "Acceptez les conditions générales pour continuer."
                  : "Confirmez que vous n'êtes pas un robot."}
            </p>
          )}
          <p className="text-muted-foreground text-center text-sm">
            {isPro ? (
              <>
                Vous voulez juste commander ?{" "}
                <Link
                  href="/inscription?role=client"
                  className="text-primary font-medium hover:underline"
                >
                  Compte client
                </Link>
                {" · "}
              </>
            ) : null}
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
