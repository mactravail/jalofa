import type { Metadata } from "next";

import { PanierView } from "@/components/cart/panier-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Panier") };
}

export default function PanierPage() {
  return <PanierView />;
}
