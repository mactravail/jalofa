import type { Metadata } from "next";

import { CheckoutView, type CheckoutAccount } from "@/components/cart/checkout-view";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Caisse") };
}

/** Le client connecté, pour pré-remplir ses coordonnées (et ne pas redemander
 *  de mot de passe). `null` : nouveau client, son compte naît à la commande. */
async function currentAccount(): Promise<CheckoutAccount | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user || user.is_anonymous) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();
  const profile = data as { full_name: string | null; phone: string | null } | null;
  const [firstName = "", ...rest] = (profile?.full_name ?? "").trim().split(/\s+/);
  return {
    first_name: firstName,
    last_name: rest.join(" "),
    email: user.email ?? "",
    phone: profile?.phone ?? "",
  };
}

// Pas d'inscription séparée : le client donne ses coordonnées de livraison et
// choisit un mot de passe ; son compte est créé avec la commande.
export default async function CaissePage() {
  const account = await currentAccount();
  return <CheckoutView account={account} accountsEnabled={isSupabaseConfigured()} />;
}
