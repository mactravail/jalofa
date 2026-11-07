import type { Metadata } from "next";

import {
  ProOfferView,
  type OfferSearchParams,
} from "@/components/dashboard/pro-offer-view";

export const metadata: Metadata = { title: "Mon offre" };

export default async function OfferPage({
  searchParams,
}: {
  searchParams: Promise<OfferSearchParams>;
}) {
  return <ProOfferView params={await searchParams} />;
}
