import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { PayoutMethodForm } from "@/components/dashboard/payout-method-form";
import { getCurrentVendor } from "@/lib/data";

export const metadata: Metadata = { title: "Recevoir mon argent" };

export default async function VendorPayoutPage() {
  const vendor = await getCurrentVendor();

  return (
    <DashboardPage
      title="Recevoir mon argent"
      subtitle="Où JALOFA vous envoie l'argent de vos ventes."
    >
      <div className="max-w-xl">
        <PayoutMethodForm
          method={vendor?.payout_method ?? null}
          number={vendor?.payout_number ?? null}
          name={vendor?.payout_name ?? null}
        />
      </div>
    </DashboardPage>
  );
}
