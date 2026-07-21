import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";

export const metadata: Metadata = { title: "Travail en cours" };

export default function TailorOngoingPage() {
  return <OrdersPageView role="tailor" bucket="ongoing" />;
}
