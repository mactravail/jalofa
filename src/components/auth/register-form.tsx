"use client";

import { useActionState, useState } from "react";
import Link from "@/components/i18n/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  Scissors,
  Shirt,
  Star,
  Store,
  X,
} from "lucide-react";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { Stitching, TapeMeasure } from "@/components/auth/couture-decor";
import { PasswordField } from "@/components/auth/password-field";
import { CountrySelect } from "@/components/europe/country-select";
import { RobotTrap, TermsCheckbox } from "@/components/auth/signup-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkPassword } from "@/lib/password";
import {
  SELECTION_CRITERIA,
  SELECTION_CTA,
  SELECTION_SUBTITLE,
  SELECTION_TITLE,
} from "@/lib/selection";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

/** Champs hauts et texte à 16 px : confortables au doigt, sans zoom auto sur iOS. */
const FIELD_CLASS = "h-12 rounded-xl px-4 md:text-base";

/**
 * Formulaire d'inscription, dans le style de l'écran de choix (mètre ruban,
 * surpiqûre, grand picto) et dans la couleur de la carte choisie. Deux comptes :
 *  - **client** : carte blanche, gratuit, rien à choisir ;
 *  - **pro** : carte noire, un seul compte pour vendre du tissu et publier comme
 *    tailleur. Une seule formule : la **Sélection JALOFA** (accès PRO offert,
 *    cf. `selection.ts`) — le pro candidate, JALOFA garde les meilleurs.
 *
 * Toute inscription exige l'acceptation des conditions. La case « Je ne suis
 * pas un robot » est un piège invisible (`RobotTrap`) : un humain ne la voit
 * pas, un robot qui la coche se voit refuser l'accès.
 */
export function RegisterForm({
  kind,
  redirectTo,
}: {
  kind: "client" | "pro";
  redirectTo?: string;
}) {
  const isPro = kind === "pro";
  const t = useT();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signUp,
    null,
  );

  const passwordOk = checkPassword(password).valid;
  const passwordsMatch = passwordConfirm.length > 0 && passwordConfirm === password;
  const canSubmit = passwordOk && passwordsMatch && acceptedTerms;

  const submitLabel = t(isPro ? SELECTION_CTA : "Créer mon compte");

  const Icon = isPro ? Scissors : Shirt;

  return (
    <div data-wide={isPro ? "" : undefined} className="space-y-7">
      <header className="motion-safe:animate-in motion-safe:fade-in space-y-4 text-center motion-safe:duration-500">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.25em] uppercase">
          {t("Créer un compte")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          {isPro ? t("Compte pro") : t("Compte client")}
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
              {isPro ? t("Professionnel") : t("Gratuit")}
            </p>
            <p className="text-muted-foreground text-base">
              {isPro
                ? t("Je couds et je vends du tissu.")
                : t("Je commande des tenues sur mesure.")}
            </p>
          </div>
          <Icon aria-hidden strokeWidth={0.6} className="size-20 shrink-0" />
        </div>

        <form action={formAction} className="relative mt-6 space-y-5">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
              {t(state.error)}
            </p>
          )}

          {isPro && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <Scissors aria-hidden className="size-4" /> {t("Tailleur")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <Store aria-hidden className="size-4" /> {t("Vendeur de tissu")}
                </span>
              </div>

              {/* Sélection JALOFA : une seule formule, l'accès PRO offert
                  (cf. `selection.ts`). Ni prix habituel, ni durée affichés. */}
              <div className="relative mt-3 rounded-2xl border-2 border-orange-500 bg-orange-500/10 p-5">
                <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold tracking-wide text-black uppercase">
                  <Star aria-hidden className="size-3.5 fill-current" />
                  {t("Sélection JALOFA")}
                </span>
                <div className="flex items-start justify-between gap-3 pt-1">
                  <p className="min-w-0 text-lg font-bold">{t("Accès PRO offert")}</p>
                  <p className="shrink-0 text-2xl leading-none font-black text-orange-400">
                    0 FCFA
                  </p>
                </div>
                <p className="mt-3 text-xl leading-snug font-bold">{t(SELECTION_TITLE)}</p>
                <p className="mt-2 text-sm text-white/75">{t(SELECTION_SUBTITLE)}</p>
                <p className="mt-4 text-sm font-bold">{t("Ce que nous recherchons :")}</p>
                <ul className="mt-2 space-y-1.5">
                  {SELECTION_CRITERIA.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-400" />
                      <span className="min-w-0">{t(line)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <input type="hidden" name="role" value={isPro ? "pro" : "client"} />
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
              {isPro ? t("Nom ou nom de l'atelier") : t("Nom complet")}
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
            <Label htmlFor="email">{t("E-mail")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("vous@exemple.com")}
              required
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("Téléphone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+221 ..."
              className={FIELD_CLASS}
            />
          </div>
          {/* Où se trouve l'atelier : un pays d'Europe range ses créations et
              ses tissus dans JALOFA EUROPE. Modifiable ensuite dans le profil. */}
          {isPro && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">{t("Pays de l'atelier")}</Label>
                <CountrySelect className="h-12 rounded-xl pl-4 md:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("Ville")}</Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  placeholder={t("Ex. Dakar, Milan, Paris")}
                  required
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          )}
          <PasswordField
            value={password}
            onChange={setPassword}
            inputClassName={FIELD_CLASS}
          />
          <div className="space-y-2">
            <PasswordField
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              name="password_confirm"
              label={t("Répétez le mot de passe")}
              requirements={false}
              inputClassName={FIELD_CLASS}
            />
            {passwordConfirm.length > 0 && (
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  passwordsMatch ? "text-emerald-400" : "text-destructive",
                )}
              >
                {passwordsMatch ? (
                  <Check aria-hidden className="size-4 shrink-0" />
                ) : (
                  <X aria-hidden className="size-4 shrink-0" />
                )}
                {passwordsMatch
                  ? t("Les deux mots de passe sont identiques.")
                  : t("Les deux mots de passe ne sont pas identiques.")}
              </p>
            )}
          </div>

          <div className="space-y-3 border-t border-dashed pt-5">
            <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms}>
              {t("J'accepte les")}{" "}
              <Link
                href="/conditions"
                className="text-foreground font-medium underline underline-offset-4"
              >
                {t("conditions générales d'utilisation")}
              </Link>{" "}
              {t("et la politique de confidentialité de JALOFA.")}
            </TermsCheckbox>
            <RobotTrap />
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
              {t(
                !passwordOk
                  ? "Choisissez un mot de passe qui remplit toutes les exigences."
                  : !passwordsMatch
                    ? "Répétez le même mot de passe."
                    : "Acceptez les conditions générales pour continuer.",
              )}
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
          {t("Changer de compte")}
        </Link>
        <p>
          {t("Déjà inscrit ?")}{" "}
          <Link
            href={
              redirectTo
                ? `/connexion?redirect=${encodeURIComponent(redirectTo)}`
                : "/connexion"
            }
            className="text-foreground inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
          >
            {t("Se connecter")}
          </Link>
        </p>
      </div>
    </div>
  );
}
