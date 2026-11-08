import { Check, CircleAlert, CircleCheck, Crown } from "lucide-react";

import { Price } from "@/components/cart/price";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { payProSubscription } from "@/lib/actions/pro-subscription";
import { isPaydunyaConfigured } from "@/lib/paydunya";
import {
  readProSubscription,
  settleProPayment,
  type ProSubscription,
} from "@/lib/pro-subscription";
import { isSupabaseConfigured } from "@/lib/queries";
import {
  FREE_COMMISSION_RATE,
  getPlan,
  PAID_PLAN_ID,
} from "@/lib/subscriptions";
import { createClient } from "@/lib/supabase/server";

const PAID_PLAN = getPlan(PAID_PLAN_ID)!;

export type OfferSearchParams = {
  token?: string;
  annule?: string;
  erreur?: string;
};

/**
 * « Mon offre » — commune aux espaces tailleur et vendeur (un compte pro couvre
 * les deux). C'est aussi la page où PayDunya renvoie le pro après paiement
 * (`?token=…`) : on y règle la facture avant d'afficher l'offre.
 */
export async function ProOfferView({ params }: { params: OfferSearchParams }) {
  let sub: ProSubscription = { plan: "free", expiresAt: null };
  let notice: { ok: boolean; text: string } | null = null;

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
              ? { ok: true, text: `Paiement reçu : l'offre ${PAID_PLAN.name} est active.` }
              : status === "pending"
                ? { ok: false, text: "Paiement en attente de confirmation. Rechargez la page dans un instant." }
                : { ok: false, text: "Le paiement n'a pas abouti. Vous pouvez réessayer." };
        } catch (err) {
          console.error("[paydunya settle]", err);
          notice = { ok: false, text: "Impossible de vérifier le paiement pour l'instant." };
        }
      }
      try {
        sub = await readProSubscription(user.id);
      } catch (err) {
        console.error("[pro subscription]", err);
      }
    }
  }

  if (!notice && params.annule) {
    notice = { ok: false, text: "Paiement annulé. Vous restez sur l'offre Gratuit." };
  }
  if (!notice && params.erreur) {
    notice = {
      ok: false,
      text:
        params.erreur === "indisponible"
          ? "Le paiement en ligne n'est pas encore disponible. Réessayez plus tard."
          : "Le paiement n'a pas pu démarrer. Réessayez.",
    };
  }

  const isPaid = sub.plan !== "free";
  const until = sub.expiresAt
    ? new Date(sub.expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const canPay = isSupabaseConfigured() && isPaydunyaConfigured();

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
              Offre actuelle
            </p>
            <p className="font-heading flex items-center gap-2 text-xl font-bold">
              {isPaid && <Crown className="size-5 text-amber-500" />}
              {isPaid ? PAID_PLAN.name : "Gratuit"}
            </p>
            <p className="text-muted-foreground text-sm">
              {isPaid
                ? `0% de commission${until ? ` — actif jusqu'au ${until}` : ""}.`
                : `Aucun abonnement — ${Math.round(FREE_COMMISSION_RATE * 100)}% de commission sur chaque vente.`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/40">
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-heading text-lg font-semibold">
                Offre {PAID_PLAN.name}
              </p>
              <p>
                <Price amount={PAID_PLAN.monthlyPrice} className="text-xl font-bold" />
                <span className="text-muted-foreground text-xs"> / mois</span>
              </p>
            </div>
            <ul className="space-y-1.5">
              {[
                "0% de commission : vous gardez 100% de vos ventes",
                "Tailleur + vendeur de tissu",
                "Mise en avant dans le catalogue",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <Check className="text-primary mt-0.5 size-4 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <form action={payProSubscription}>
              <Button type="submit" size="lg" className="w-full" disabled={!canPay}>
                {isPaid ? "Prolonger d'un mois" : `Passer à l'offre ${PAID_PLAN.name}`}
              </Button>
            </form>
            <p className="text-muted-foreground text-center text-xs">
              Orange Money, Wave, Free Money ou carte — paiement sécurisé par PayDunya.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  );
}
