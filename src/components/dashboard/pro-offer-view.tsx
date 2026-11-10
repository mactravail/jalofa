import { Check, ChevronDown, CircleAlert, CircleCheck, Crown, Star } from "lucide-react";

import { Price } from "@/components/cart/price";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { payProSubscription, toggleProRenewal } from "@/lib/actions/pro-subscription";
import { formatPrice } from "@/lib/constants";
import { isPaydunyaConfigured } from "@/lib/paydunya";
import {
  readDeferredFee,
  readProSubscription,
  settleProPayment,
  type ProSubscription,
} from "@/lib/pro-subscription";
import { isSupabaseConfigured } from "@/lib/queries";
import {
  dailyPrice,
  FREE_COMMISSION_RATE,
  getPlan,
  OFFER_PITCH,
  PAID_PLAN_ID,
  type OfferPoint,
} from "@/lib/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { T } from "@/components/i18n/t";
import { getLocale } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/config";

const PAID_PLAN = getPlan(PAID_PLAN_ID)!;

/** Arguments visibles avant « Voir tout ». */
const POINTS_SHOWN = 4;

function PitchRow({ point }: { point: OfferPoint }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-orange-400" />
      <span>
        <span className="block text-sm font-semibold"><T>{point.title}</T></span>
        <span className="text-muted-foreground block text-sm"><T>{point.text}</T></span>
      </span>
    </li>
  );
}

export type OfferSearchParams = {
  token?: string;
  annule?: string;
  erreur?: string;
  /** Ancien retour d'inscription « payée à la première vente » (comptes existants). */
  differe?: string;
  /** Le pro vient d'arrêter / de reprendre le renouvellement. */
  arret?: string;
  reprise?: string;
};

/**
 * « Mon offre » — commune aux espaces tailleur et vendeur (un compte pro couvre
 * les deux). C'est aussi la page où PayDunya renvoie le pro après paiement
 * (`?token=…`) : on y règle la facture avant d'afficher l'offre.
 *
 * Offre Pro : 1er mois payé à l'inscription, les suivants retenus sur les
 * ventes ; un mois sans vente ne coûte rien ; arrêt en un clic.
 */
export async function ProOfferView({ params }: { params: OfferSearchParams }) {
  let sub: ProSubscription = {
    plan: "free",
    expiresAt: null,
    autoRenew: true,
    waitingForSale: false,
  };
  let notice: { ok: boolean; text: string } | null = null;
  let feeDue = 0;
  const t = await getT();
  const locale = intlLocale(await getLocale());
  const plan = PAID_PLAN.name;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      if (params.token) {
        try {
          const status = await settleProPayment(params.token);
          notice =
            status === "completed"
              ? { ok: true, text: t("Paiement reçu : l'offre {plan} est active.", { plan }) }
              : status === "pending"
                ? { ok: false, text: t("Paiement en attente de confirmation. Rechargez la page dans un instant.") }
                : { ok: false, text: t("Le paiement n'a pas abouti. Vous pouvez réessayer.") };
        } catch (err) {
          console.error("[paydunya settle]", err);
          notice = { ok: false, text: t("Impossible de vérifier le paiement pour l'instant.") };
        }
      }
      try {
        sub = await readProSubscription(user.id);
      } catch (err) {
        console.error("[pro subscription]", err);
      }
      try {
        feeDue = await readDeferredFee(user.id);
      } catch {
        feeDue = 0;
      }
    }
  }

  if (!notice && params.annule) {
    notice = { ok: false, text: t("Paiement annulé. Vous restez sur l'offre Gratuit.") };
  }
  if (!notice && params.differe) {
    notice = { ok: true, text: t("L'offre {plan} est active.", { plan }) };
  }
  if (!notice && params.arret) {
    notice = {
      ok: true,
      text: t("C'est noté : l'offre {plan} s'arrête à son échéance. Plus rien ne sera retenu sur vos ventes.", { plan }),
    };
  }
  if (!notice && params.reprise) {
    notice = { ok: true, text: t("L'offre {plan} continue.", { plan }) };
  }
  if (!notice && params.erreur) {
    notice = {
      ok: false,
      text:
        params.erreur === "indisponible"
          ? t("Le paiement en ligne n'est pas encore disponible. Réessayez plus tard.")
          : params.erreur === "renouvellement"
            ? t("Le changement n'a pas pu être enregistré. Réessayez.")
            : t("Le paiement n'a pas pu démarrer. Réessayez."),
    };
  }

  const isPaid = sub.plan !== "free";
  const until = sub.expiresAt
    ? new Date(sub.expiresAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const canPay = isSupabaseConfigured() && isPaydunyaConfigured();

  const statusLine = !isPaid
    ? t("Aucun abonnement — {pct}% de commission sur chaque vente, hors livraison.", { pct: Math.round(FREE_COMMISSION_RATE * 100) })
    : sub.waitingForSale
      ? t("Votre mois {plan} est terminé. Payez le mois suivant en mobile money, ou il sera retenu ({price}) sur votre prochaine vente.", { plan, price: formatPrice(PAID_PLAN.monthlyPrice) })
      : !sub.autoRenew
        ? t("0% de commission jusqu'au {date}. Ensuite : offre Gratuit.", { date: until ?? "" })
        : t("0% de commission jusqu'au {date}. Ensuite, payez le mois suivant en mobile money, ou il sera retenu sur votre prochaine vente.", { date: until ?? "" });

  return (
    <DashboardPage
      title="Mon offre"
      subtitle="Votre compte pro couvre l'atelier (tailleur) et la boutique de tissus."
    >
      <div className="max-w-xl space-y-4">
        {notice && (
          <p
            className={
              notice.ok
                ? "flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300"
                : "flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-300"
            }
          >
            {notice.ok ? (
              <CircleCheck className="size-4 shrink-0" />
            ) : (
              <CircleAlert className="size-4 shrink-0" />
            )}
            {notice.text}
          </p>
        )}

        <Card>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("Offre actuelle")}
            </p>
            <p className="font-heading flex items-center gap-2 text-xl font-bold">
              {isPaid && <Crown className="size-5 text-orange-400" />}
              {isPaid ? PAID_PLAN.name : t("Gratuit")}
            </p>
            <p className="text-muted-foreground text-sm">{statusLine}</p>
            {feeDue > 0 && (
              <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-300">
                <Price amount={feeDue} className="font-semibold" />{" "}
                {t("seront retenus sur l'argent de vos prochaines ventes.")}
              </p>
            )}
            {isPaid && (
              <form action={toggleProRenewal} className="pt-1">
                <input type="hidden" name="on" value={sub.autoRenew ? "false" : "true"} />
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-foreground min-h-11 text-sm underline underline-offset-4"
                >
                  {sub.autoRenew
                    ? t("Arrêter l'offre {plan}", { plan })
                    : t("Continuer l'offre {plan}", { plan })}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        {!isPaid && (
          <Card className="relative overflow-visible border-2 border-orange-500 bg-orange-500/10">
            <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold tracking-wide text-black uppercase">
              <Star aria-hidden className="size-3.5 fill-current" />
              {t("Recommandé")}
            </span>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-semibold">
                    {t("Offre {plan}", { plan })}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t(OFFER_PITCH.premium.lead)}
                  </p>
                </div>
                <p className="shrink-0 text-right">
                  <Price amount={PAID_PLAN.monthlyPrice} className="text-xl font-bold" />
                  <span className="text-muted-foreground block text-xs">
                    {t("{price} par jour", { price: formatPrice(dailyPrice(PAID_PLAN.monthlyPrice)) })}
                  </span>
                </p>
              </div>
              <ul className="space-y-2">
                {OFFER_PITCH.premium.points.slice(0, POINTS_SHOWN).map((p) => (
                  <PitchRow key={p.title} point={p} />
                ))}
              </ul>
              {OFFER_PITCH.premium.points.length > POINTS_SHOWN && (
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-semibold underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">
                      {t("Voir tout (+{n})", { n: OFFER_PITCH.premium.points.length - POINTS_SHOWN })}
                    </span>
                    <span className="hidden group-open:inline">{t("Voir moins")}</span>
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="space-y-2 pt-1">
                    {OFFER_PITCH.premium.points.slice(POINTS_SHOWN).map((p) => (
                      <PitchRow key={p.title} point={p} />
                    ))}
                  </ul>
                </details>
              )}
              <form action={payProSubscription}>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full bg-orange-500 text-base font-semibold text-black hover:bg-orange-400"
                  disabled={!canPay}
                >
                  {t("Passer à l'offre {plan}", { plan })}
                </Button>
              </form>
              <p className="text-muted-foreground text-center text-xs">
                {t("1er mois maintenant : Orange Money, Wave, Free Money ou carte (PayDunya). Ensuite, au choix : retenu sur vos ventes ou payé en mobile money.")}
              </p>
            </CardContent>
          </Card>
        )}

        {isPaid && sub.autoRenew && (
          <form action={payProSubscription} className="space-y-2">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full bg-orange-500 text-base font-semibold text-black hover:bg-orange-400"
              disabled={!canPay}
            >
              {feeDue > 0 ? t("Régler maintenant") : t("Payer le mois suivant")} —{" "}
              <Price amount={PAID_PLAN.monthlyPrice} />
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              {t("Orange Money, Wave, Free Money ou carte (PayDunya). Sans paiement, le mois est retenu sur votre prochaine vente.")}
            </p>
          </form>
        )}
      </div>
    </DashboardPage>
  );
}
