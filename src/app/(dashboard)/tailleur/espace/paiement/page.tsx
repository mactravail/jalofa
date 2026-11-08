import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { PayoutMethodForm } from "@/components/dashboard/payout-method-form";
import { getCurrentTailor } from "@/lib/data";

export const metadata: Metadata = { title: "Recevoir mon argent" };

export default async function TailorPayoutPage() {
  const tailor = await getCurrentTailor();

  return (
    <DashboardPage
      title="Recevoir mon argent"
      subtitle="Où JALOFA vous envoie l'argent de vos ventes."
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
