import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Annulées") };
}

export default function VendorCancelledPage() {
  return <OrdersPageView role="vendor" bucket="cancelled" />;
}
