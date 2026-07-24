import type { Metadata } from "next";

import { CheckoutView } from "@/components/cart/checkout-view";
import { getCurrentProfile, isSupabaseConfigured } from "@/lib/queries";

export const metadata: Metadata = { title: "Caisse" };

export default async function CaissePage() {
  // La commande n'est enregistrée que pour un client connecté (le serveur
  // l'exige dès que la base est en place). On invite donc à se connecter en
  // amont plutôt que de laisser l'erreur surgir après le paiement.
  const requiresLogin = isSupabaseConfigured() && !(await getCurrentProfile());

  return <CheckoutView requiresLogin={requiresLogin} />;
}
