import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { PayoutMethodForm } from "@/components/dashboard/payout-method-form";
import { getCurrentVendor } from "@/lib/data";

export const metadata: Metadata = { title: "Paiement" };

export default async function VendorPayoutPage() {
  const vendor = await getCurrentVendor();

  return (
    <DashboardPage
      title="Paiement"
      subtitle="Comment vous êtes réglé de vos ventes. JALOFA est gratuit : aucune commission, vous encaissez 100% — versés sur ce compte."
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
