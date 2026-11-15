import type { Metadata } from "next";

import { CheckoutView, type CheckoutAccount } from "@/components/cart/checkout-view";
import { isSupabaseConfigured } from "@/lib/queries";
import type { SavedProfile } from "@/lib/saved-profile";
import { readSavedProfile } from "@/lib/saved-profile-db";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Caisse") };
}

/** Le client connecté, pour pré-remplir ses coordonnées (et ne pas redemander
 *  de mot de passe), avec ce qu'il a enregistré (téléphone, adresse). `null` :
 *  nouveau client, son compte naît à la commande. */
async function currentAccount(): Promise<{ account: CheckoutAccount; saved: SavedProfile } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user || user.is_anonymous) return null;
  const saved = await readSavedProfile(supabase, user.id);
  const [firstName = "", ...rest] = (saved.full_name ?? "").trim().split(/\s+/);
  return {
    account: {
      first_name: firstName,
      last_name: rest.join(" "),
      email: user.email ?? "",
      phone: saved.phone ?? "",
    },
    saved,
  };
}

// Pas d'inscription séparée : le client donne ses coordonnées de livraison et
// choisit un mot de passe ; son compte est créé avec la commande.
export default async function CaissePage() {
  const current = await currentAccount();
  return (
    <CheckoutView
      account={current?.account ?? null}
      saved={current?.saved ?? null}
      accountsEnabled={isSupabaseConfigured()}
    />
  );
}
