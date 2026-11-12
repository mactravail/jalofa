import { Check, CircleAlert, CircleCheck, Crown, Star } from "lucide-react";

import { Price } from "@/components/cart/price";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { claimSelectionAccess } from "@/lib/actions/pro-subscription";
import {
  readDeferredFee,
  readProSubscription,
  settleProPayment,
  type ProSubscription,
} from "@/lib/pro-subscription";
import { isSupabaseConfigured } from "@/lib/queries";
import { SELECTION_CRITERIA, SELECTION_SUBTITLE } from "@/lib/selection";
import { getPlan, PAID_PLAN_ID } from "@/lib/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

const PAID_PLAN = getPlan(PAID_PLAN_ID)!;

export type OfferSearchParams = {
  token?: string;
  annule?: string;
  erreur?: string;
  /** Inscription pendant l'offre de lancement : Pro offert jusqu'au 1er décembre. */
  lancement?: string;
  /** Ancien retour d'inscription « payée à la première vente » (comptes existants). */
  differe?: string;
  /** Le pro vient de rejoindre la Sélection JALOFA (accès PRO offert). */
  selection?: string;
  /** Le pro vient d'arrêter / de reprendre le renouvellement. */
  arret?: string;
  reprise?: string;
};

/**
 * « Mon offre » — commune aux espaces tailleur et vendeur (un compte pro couvre
 * les deux). C'est aussi la page où PayDunya renvoie le pro après paiement
 * (`?token=…`) : on y règle la facture avant d'afficher l'offre.
 *
 * Sélection JALOFA : l'accès PRO est offert (offre Pro sans échéance). Le
 * retour PayDunya reste géré pour les comptes payants existants.
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

  if (!notice && (params.selection || params.lancement)) {
    notice = {
      ok: true,
      text: t("Bienvenue dans la Sélection JALOFA ! Votre accès PRO est offert : publiez vos créations dès maintenant."),
    };
  }
  if (!notice && params.annule) {
    notice = { ok: false, text: t("Paiement annulé.") };
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
          : params.erreur === "selection"
            ? t("L'accès PRO n'a pas pu être activé. Réessayez.")
          : params.erreur === "renouvellement"
            ? t("Le changement n'a pas pu être enregistré. Réessayez.")
            : t("Le paiement n'a pas pu démarrer. Réessayez."),
    };
  }

  // Sélection JALOFA (cf. `selection.ts`) : l'accès PRO offert = offre Pro
  // sans échéance. Rien d'autre n'est proposé : ni offre Gratuit à commission,
  // ni prix de l'offre Pro (le parcours PayDunya reste dans le code).
  const selected = sub.plan === PAID_PLAN_ID && !sub.expiresAt;

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

        <Card className="relative overflow-visible border-2 border-orange-500 bg-orange-500/10">
          <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold tracking-wide text-black uppercase">
            <Star aria-hidden className="size-3.5 fill-current" />
            {t("Sélection JALOFA")}
          </span>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-start justify-between gap-3">
              <p className="font-heading flex items-center gap-2 text-xl font-bold">
                <Crown className="size-5 text-orange-400" />
                {t("Accès PRO offert")}
              </p>
              <p className="shrink-0 text-2xl leading-none font-black whitespace-nowrap text-orange-400">
                0 FCFA
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              {selected
                ? t("Vous faites partie des professionnels sélectionnés par JALOFA : aucun abonnement à payer, aucune commission sur vos ventes.")
                : t(SELECTION_SUBTITLE)}
            </p>
            {feeDue > 0 && (
              <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-300">
                <Price amount={feeDue} className="font-semibold" />{" "}
                {t("seront retenus sur l'argent de vos prochaines ventes.")}
              </p>
            )}
            <div>
              <p className="text-sm font-semibold">{t("Ce que nous attendons de vous :")}</p>
              <ul className="mt-2 space-y-1.5">
                {SELECTION_CRITERIA.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-400" />
                    <span>{t(line)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {!selected && (
              <form action={claimSelectionAccess}>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full bg-orange-500 text-base font-semibold text-black hover:bg-orange-400"
                  disabled={!isSupabaseConfigured()}
                >
                  {t("Activer mon accès PRO offert")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  );
}
