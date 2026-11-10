import type { Metadata } from "next";

import {
  ProOfferView,
  type OfferSearchParams,
} from "@/components/dashboard/pro-offer-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mon offre") };
}

export default async function OfferPage({
  searchParams,
}: {
  searchParams: Promise<OfferSearchParams>;
}) {
  return <ProOfferView params={await searchParams} />;
}
