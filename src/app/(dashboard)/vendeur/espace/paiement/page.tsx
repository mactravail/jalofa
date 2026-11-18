import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { PayoutMethodForm } from "@/components/dashboard/payout-method-form";
import { getCurrentVendor } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Recevoir mon argent") };
}

export default async function VendorPayoutPage() {
  const vendor = await getCurrentVendor();

  return (
    <DashboardPage
      title="Recevoir mon argent"
      subtitle="Le moyen de paiement que vous envoyez à vos clients : ils vous paient directement."
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
