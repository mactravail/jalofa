import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";

export const metadata: Metadata = { title: "En cours" };

export default function VendorOngoingPage() {
  return <OrdersPageView role="vendor" bucket="ongoing" />;
}
