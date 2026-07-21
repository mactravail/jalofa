import type { Metadata } from "next";

import { ShippingByCityView } from "@/components/dashboard/shipping-by-city-view";

export const metadata: Metadata = { title: "Livraisons" };

export default function VendorShippingPage() {
  return <ShippingByCityView role="vendor" />;
}
