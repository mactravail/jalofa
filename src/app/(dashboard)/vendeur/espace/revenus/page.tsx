import type { Metadata } from "next";

import { RevenueView } from "@/components/dashboard/revenue-view";

export const metadata: Metadata = { title: "Mes revenus" };

export default function VendorRevenuePage() {
  return <RevenueView role="vendor" />;
}
