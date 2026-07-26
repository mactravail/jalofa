import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { PayoutMethodForm } from "@/components/dashboard/payout-method-form";
import { getCurrentTailor } from "@/lib/data";

export const metadata: Metadata = { title: "Paiement" };

export default async function TailorPayoutPage() {
  const tailor = await getCurrentTailor();

  return (
    <DashboardPage
      title="Paiement"
      subtitle="Comment vous êtes réglé de vos ventes. JALOFA est gratuit : aucune commission, vous encaissez 100% — versés sur ce compte."
    >
      <div className="max-w-xl">
        <PayoutMethodForm
          method={tailor?.payout_method ?? null}
          number={tailor?.payout_number ?? null}
          name={tailor?.payout_name ?? null}
        />
      </div>
    </DashboardPage>
  );
}
