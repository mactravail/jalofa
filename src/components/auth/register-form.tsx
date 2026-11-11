"use client";

import { useActionState, useState } from "react";
import Link from "@/components/i18n/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Scissors,
  Shirt,
  Smartphone,
  Star,
  Store,
  X,
} from "lucide-react";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { Stitching, TapeMeasure } from "@/components/auth/couture-decor";
import { PasswordField } from "@/components/auth/password-field";
import { CountrySelect } from "@/components/europe/country-select";
import { RobotTrap, TermsCheckbox } from "@/components/auth/signup-verification";
import { Price } from "@/components/cart/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/constants";
import { checkPassword } from "@/lib/password";
import {
  dailyPrice,
  getPlan,
  OFFER_PITCH,
  PAID_PLAN_ID,
  type ProOfferId,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

const PAID_PLAN = getPlan(PAID_PLAN_ID)!;

/** Arguments visibles par offre avant « Voir tout » (carte courte sur mobile). */
const POINTS_SHOWN = 2;

/** Offre de lancement : ce que le pro (tailleur ou vendeur) obtient avec l'offre Pro. */
const PROMO_PERKS = [
  "Une boutique professionnelle sur JALOFA.",
  "La possibilité d'exposer leurs créations.",
  "La possibilité de proposer du sur-mesure et du prêt-à-porter.",
  "Une visibilité auprès de nouveaux clients.",
  "L'accès aux fonctionnalités de l'offre Pro.",
];

/** Champs hauts et texte à 16 px : confortables au doigt, sans zoom auto sur iOS. */
const FIELD_CLASS = "h-12 rounded-xl px-4 md:text-base";

/** Les deux offres d'un compte pro — tailleur ET vendeur de tissu dans les deux cas. */
const OFFERS: {
  id: ProOfferId;
  name: string;
  price: number;
  recommended: boolean;
}[] = [
  { id: "premium", name: PAID_PLAN.name, price: PAID_PLAN.monthlyPrice, recommended: true },
  { id: "free", name: "Gratuit", price: 0, recommended: false },
];

/**
 * Formulaire d'inscription, dans le style de l'écran de choix (mètre ruban,
 * surpiqûre, grand picto) et dans la couleur de la carte choisie. Deux comptes :
 *  - **client** : carte blanche, gratuit, rien à choisir ;
 *  - **pro** : carte noire, un seul compte pour vendre du tissu et publier comme
 *    tailleur, avec deux offres. L'offre **Pro** (recommandée, en orange) se
 *    paie dès l'inscription (mobile money via PayDunya) : un compte peut être
 *    supprimé à tout moment, le 1er mois ne peut donc pas être une dette. Les
 *    mois suivants sont retenus sur les ventes (cf. `renewProFromSale`).
 *
 * Toute inscription exige l'acceptation des conditions. La case « Je ne suis
 * pas un robot » est un piège invisible (`RobotTrap`) : un humain ne la voit
 * pas, un robot qui la coche se voit refuser l'accès.
 */
export function RegisterForm({
  kind,
  initialOffer,
  redirectTo,
  promoSlotsLeft = 0,
}: {
  kind: "client" | "pro";
  initialOffer?: ProOfferId;
  redirectTo?: string;
  /** Places restantes de l'offre de lancement (0 = pas de promo). */
  promoSlotsLeft?: number;
}) {
  const isPro = kind === "pro";
  const t = useT();
  const [offer, setOffer] = useState<ProOfferId>(initialOffer ?? "premium");
  const [showAllPoints, setShowAllPoints] = useState(false);
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
  const paid = isPro && offer === PAID_PLAN_ID;
  // Offre de lancement : l'offre Pro ne se paie pas à l'inscription.
  const promo = isPro && promoSlotsLeft > 0;

  const submitLabel = t(
    !isPro
      ? "Créer mon compte"
      : paid && !promo
        ? "Créer mon compte et payer"
        : "Créer mon compte pro",
  );

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
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <Scissors aria-hidden className="size-4" /> {t("Tailleur")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <Store aria-hidden className="size-4" /> {t("Vendeur de tissu")}
                </span>
              </div>

              <Label className="pt-2">{t("Votre offre")}</Label>
              {/* Ordinateur : les deux offres côte à côte (le badge « Recommandé »
                  dépasse en haut, d'où le pt-3 de la grille). */}
              <div className="grid gap-3 md:grid-cols-2 md:items-start md:pt-3">
                {OFFERS.map((o) => {
                  const selected = offer === o.id;
                  const pitch = OFFER_PITCH[o.id];
                  const hot = o.recommended;
                  const perks = hot && promo ? PROMO_PERKS : [];
                  const hidden =
                    Math.max(0, pitch.points.length - POINTS_SHOWN) + perks.length;
                  const points =
                    showAllPoints || hidden <= 0
                      ? pitch.points
                      : pitch.points.slice(0, POINTS_SHOWN);
                  return (
                    <div
                      key={o.id}
                      className={cn(
                        "relative w-full rounded-2xl border-2 transition-colors",
                        hot && "max-md:mt-3",
                        hot
                          ? selected
                            ? "border-orange-500 bg-orange-500 text-black"
                            : "border-orange-500 bg-orange-500/10 hover:bg-orange-500/20"
                          : selected
                            ? "border-white bg-white text-black"
                            : "border-white/20 hover:border-white/50",
                      )}
                    >
                    <button
                      type="button"
                      onClick={() => setOffer(o.id)}
                      aria-pressed={selected}
                      className="focus-visible:ring-ring/50 block w-full rounded-2xl p-4 text-left outline-none focus-visible:ring-3"
                    >
                      {hot && (
                        <span
                          className={cn(
                            "absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase",
                            selected ? "bg-black text-orange-400" : "bg-orange-500 text-black",
                          )}
                        >
                          <Star aria-hidden className="size-3.5 fill-current" />
                          {t("Recommandé")}
                        </span>
                      )}
                      <span className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border",
                            selected ? "border-black bg-black text-white" : "border-white/40",
                          )}
                        >
                          {selected && <Check aria-hidden className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1 text-lg font-bold">
                          {t(o.name)}
                        </span>
                        {hot && promo ? (
                          // Offre de lancement : la carte Pro s'affiche à 0 FCFA,
                          // le vrai prix barré à côté.
                          <span className="shrink-0 text-right">
                            <span className="block text-2xl leading-none font-black">0 FCFA</span>
                            <span className="mt-1 block text-xs font-semibold line-through opacity-60">
                              <Price amount={o.price} /> {t("/ mois")}
                            </span>
                          </span>
                        ) : (
                          <span className="shrink-0 text-right">
                            <Price amount={o.price} className="text-lg font-bold" />
                            <span className="block text-xs opacity-75">{t("par mois")}</span>
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block pl-9 text-sm opacity-75">
                        {t(pitch.lead)}
                      </span>
                      {hot && promo && (
                        <span
                          className={cn(
                            "mt-3 block rounded-xl px-3 py-2.5 text-center",
                            selected ? "bg-black text-orange-400" : "bg-orange-500/20 text-orange-200",
                          )}
                        >
                          <span className="block text-sm font-bold">
                            {t("Ton abonnement professionnel offert !")}
                          </span>
                          <span className="mt-0.5 block text-xs opacity-80">
                            {t("Offre valable jusqu'au 30 novembre 2026, dans la limite des 100 premiers tailleurs éligibles.")}
                          </span>
                          {promoSlotsLeft <= 20 && (
                            <span className="mt-1 block text-xs font-bold">
                              {t("Vite, plus que {n} places ! Les premiers inscrits sont servis en premier.", { n: promoSlotsLeft })}
                            </span>
                          )}
                        </span>
                      )}
                      {hot && !promo && (
                        <span
                          className={cn(
                            "mt-3 block rounded-xl px-3 py-2 text-center text-sm font-semibold",
                            selected ? "bg-black/10" : "bg-orange-500/15 text-orange-300",
                          )}
                        >
                          {t("{price} par jour", { price: formatPrice(dailyPrice(o.price)) })}
                        </span>
                      )}
                      <span className="mt-3 block space-y-2">
                        {points.map((p) => (
                          <span key={p.title} className="flex items-start gap-2">
                            <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">{t(p.title)}</span>
                              <span className="block text-sm opacity-75">{t(p.text)}</span>
                            </span>
                          </span>
                        ))}
                      </span>
                      {/* Offre de lancement : ce que le pro obtient, replié dans
                          « Voir tout » pour garder la carte courte. */}
                      {perks.length > 0 && showAllPoints && (
                        <span className="mt-4 block">
                          <span className="block text-sm font-bold">
                            {t("Ce que les tailleurs et vendeurs obtiennent :")}
                          </span>
                          <span className="mt-2 block space-y-1.5 text-sm">
                            {perks.map((line) => (
                              <span key={line} className="flex items-start gap-2">
                                <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                                <span className="min-w-0">{t(line)}</span>
                              </span>
                            ))}
                          </span>
                        </span>
                      )}
                    </button>
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllPoints((v) => !v)}
                        aria-expanded={showAllPoints}
                        className="focus-visible:ring-ring/50 -mt-2 flex min-h-11 w-full items-center justify-center gap-1 rounded-b-2xl px-4 pb-2 text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3"
                      >
                        {showAllPoints ? t("Voir moins") : t("Voir tout (+{n})", { n: hidden })}
                        <ChevronDown
                          aria-hidden
                          className={cn("size-4 transition-transform", showAllPoints && "rotate-180")}
                        />
                      </button>
                    )}
                    </div>
                  );
                })}
              </div>
              {paid && promo && (
                <p className="flex items-start gap-2 rounded-xl bg-orange-500/15 px-3 py-2.5 text-sm text-orange-200">
                  <Star aria-hidden className="mt-0.5 size-4 shrink-0 fill-current text-orange-400" />
                  <span>
                    {t("Offre de lancement : rien à payer aujourd'hui. L'offre Pro est offerte jusqu'au 1er décembre, ensuite vous payez seulement après votre première vente.")}
                  </span>
                </p>
              )}
              {paid && !promo && (
                <p className="text-muted-foreground flex items-start gap-2 pt-1 text-sm">
                  <Smartphone aria-hidden className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {t("Le 1er mois")} (
                    <Price
                      amount={PAID_PLAN.monthlyPrice}
                      className="text-foreground font-medium"
                    />
                    ) {t("se paie maintenant : Orange Money, Wave, Free Money ou carte, paiement sécurisé PayDunya. Les mois suivants : retenus sur vos ventes, ou payés en mobile money, au choix.")}
                  </span>
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
