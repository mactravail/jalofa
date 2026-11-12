"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  grantSelectionAccess,
  OFFER_PAGE,
  setProAutoRenew,
  startProCheckout,
} from "@/lib/pro-subscription";
import { createClient } from "@/lib/supabase/server";

/**
 * « Passer à l'offre Pro » depuis l'espace pro : ouvre une facture PayDunya et
 * envoie le pro sur la page de paiement mobile money.
 */
export async function payProSubscription(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?redirect=${encodeURIComponent(OFFER_PAGE)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "tailor" && profile?.role !== "vendor") {
    redirect("/compte");
  }

  let url: string | null = null;
  try {
    url = await startProCheckout({
      id: user.id,
      name: (profile.full_name as string | null) ?? null,
      email: user.email,
      phone: (profile.phone as string | null) ?? null,
    });
  } catch (err) {
    console.error("[paydunya checkout]", err);
    redirect(`${OFFER_PAGE}?erreur=1`);
  }
  if (!url) redirect(`${OFFER_PAGE}?erreur=indisponible`);
  redirect(url);
}

/**
 * « Sans engagement » : le pro arrête (ou reprend) le renouvellement de son
 * offre Pro. Arrêtée, elle reste active jusqu'à son échéance, puis le compte
 * repasse sur Gratuit — plus rien n'est retenu sur ses ventes.
 */
export async function toggleProRenewal(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?redirect=${encodeURIComponent(OFFER_PAGE)}`);

  const on = String(formData.get("on") ?? "") === "true";
  try {
    await setProAutoRenew(user.id, on);
  } catch (err) {
    console.error("[pro auto renew]", err);
    redirect(`${OFFER_PAGE}?erreur=renouvellement`);
  }
  revalidatePath(OFFER_PAGE);
  redirect(`${OFFER_PAGE}?${on ? "reprise" : "arret"}=1`);
}

/**
 * Sélection JALOFA (cf. `selection.ts`) : un pro inscrit avant la sélection
 * (offre Gratuit à commission, ou Pro avec échéance) passe sur l'accès PRO
 * offert, sans échéance — plus de commission, plus rien de retenu.
 */
export async function claimSelectionAccess(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?redirect=${encodeURIComponent(OFFER_PAGE)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "tailor" && profile?.role !== "vendor") {
    redirect("/compte");
  }

  let ok = false;
  try {
    ok = await grantSelectionAccess(user.id);
  } catch (err) {
    console.error("[selection access]", err);
  }
  revalidatePath(OFFER_PAGE);
  redirect(`${OFFER_PAGE}?${ok ? "selection=1" : "erreur=selection"}`);
}
