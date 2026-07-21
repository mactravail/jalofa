import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";

export const metadata: Metadata = { title: "Livrées" };

export default function VendorDonePage() {
  return <OrdersPageView role="vendor" bucket="done" />;
}
