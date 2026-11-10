import type { Metadata } from "next";

import { ShippingByCityView } from "@/components/dashboard/shipping-by-city-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("À livrer") };
}

export default function VendorShippingPage() {
  return <ShippingByCityView role="vendor" />;
}
