import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";

export const metadata: Metadata = { title: "Travail terminé" };

export default function TailorDonePage() {
  return <OrdersPageView role="tailor" bucket="done" />;
}
