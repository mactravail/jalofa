import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { buttonVariants } from "@/components/ui/button";
import { DASHBOARD_ROOT, type ProRole } from "@/lib/dashboard-nav";
import { getCurrentTailor, getCurrentVendor } from "@/lib/data";
import { getCurrentProfile } from "@/lib/queries";
import { getRevenueSeries } from "@/lib/revenue-data";
import { cn } from "@/lib/utils";

const CHART_TITLE: Record<ProRole, string> = {
  tailor: "Revenus de la confection",
  vendor: "Revenus des tissus",
};

/** Vert émeraude : la couleur de l'argent, sur tout l'espace pro. */
const MONEY = "#10b981";

/** La page d'accueil de l'espace pro : bonjour, les chiffres, puis ce qui presse. */
export async function OverviewView({ role }: { role: ProRole }) {
  const [series, profile, pro] = await Promise.all([
    getRevenueSeries(role),
    getCurrentProfile(),
    role === "tailor" ? getCurrentTailor() : getCurrentVendor(),
  ]);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;

  // Rappel prioritaire : sans moyen de paiement renseigné, le pro ne peut pas
  // être réglé de ses ventes.
  const needsPayout = pro != null && !pro.payout_method;

  return (
    <div className="mx-auto max-w-5xl">
      <DemoBanner />
      <OverviewPanel role={role} firstName={firstName} />

      {needsPayout && (
        <div className="border-primary/30 bg-primary/5 mt-6 flex flex-col items-start gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Ajoutez votre moyen de paiement</p>
              <p className="text-muted-foreground text-sm">
                Indiquez où vous voulez être payé pour recevoir l&apos;argent de
                vos ventes. C&apos;est gratuit et sans commission.
              </p>
            </div>
          </div>
          <Link
            href={`${DASHBOARD_ROOT[role]}/paiement`}
            className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1.5")}
          >
            Renseigner <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      <div className="mt-8">
        <RevenueChart
          series={series}
          title={CHART_TITLE[role]}
          subtitle="Vos ventes payées, par jour, par semaine ou par mois."
          accent={MONEY}
        />
      </div>
    </div>
  );
}
