import type { Metadata } from "next";

import { CheckoutView } from "@/components/cart/checkout-view";

export const metadata: Metadata = { title: "Caisse" };

export default function CaissePage() {
  return <CheckoutView />;
}
