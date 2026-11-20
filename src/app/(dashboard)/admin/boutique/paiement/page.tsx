import type { Metadata } from "next";

import { VendorAddressForm } from "@/components/dashboard/atelier-form";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { PayoutMethodForm } from "@/components/dashboard/payout-method-form";
import { ShippingFeesForm } from "@/components/dashboard/shipping-fees-form";
import { getCurrentVendor, getMyVendorAddress } from "@/lib/data";

export const metadata: Metadata = { title: "Paiement et livraison" };

/**
 * Le moyen de paiement que JALOFA envoie aux clients pour le tissu, et ses
 * frais d'envoi (ville du client ou atelier du tailleur), et l'adresse privée
 * où un client renvoie un tissu.
 */
export default async function AdminShopPayoutPage() {
  const [shop, address] = await Promise.all([getCurrentVendor(), getMyVendorAddress()]);

  return (
    <DashboardPage
      title="Paiement et livraison"
      subtitle="Le numéro où les clients paient leur tissu à JALOFA, vos frais d'envoi et l'adresse des retours."
    >
      <div className="max-w-xl space-y-6">
        <PayoutMethodForm
          method={shop?.payout_method ?? null}
          number={shop?.payout_number ?? null}
          name={shop?.payout_name ?? null}
        />
        <ShippingFeesForm
          role="vendor"
          economy={shop?.ship_fee_economy ?? null}
          express={shop?.ship_fee_express ?? null}
        />
        <VendorAddressForm address={address} />
      </div>
    </DashboardPage>
  );
}
