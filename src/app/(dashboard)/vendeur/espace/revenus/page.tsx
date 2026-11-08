import type { Metadata } from "next";

import { RevenueView } from "@/components/dashboard/revenue-view";

export const metadata: Metadata = { title: "Ce que j'ai gagné" };

export default function VendorRevenuePage() {
  return <RevenueView role="vendor" />;
}
