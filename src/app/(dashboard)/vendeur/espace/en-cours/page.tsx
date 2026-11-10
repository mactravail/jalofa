import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("En cours") };
}

export default function VendorOngoingPage() {
  return <OrdersPageView role="vendor" bucket="ongoing" />;
}
