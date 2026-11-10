import type { Metadata } from "next";

import { RevenueView } from "@/components/dashboard/revenue-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ce que j'ai gagné") };
}

export default function TailorRevenuePage() {
  return <RevenueView role="tailor" />;
}
