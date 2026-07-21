import type { Metadata } from "next";

import { PanierView } from "@/components/cart/panier-view";

export const metadata: Metadata = { title: "Panier" };

export default function PanierPage() {
  return <PanierView />;
}
