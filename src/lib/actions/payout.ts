"use server";

import { revalidatePath } from "next/cache";

import { PAYOUT_METHOD_LABELS, type PayoutMethod } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Enregistre le moyen de paiement du pro connecté : comment il est réglé de ses
 * ventes. JALOFA est gratuit — le pro encaisse 100%, versés sur ce compte.
 *
 * Un pro peut tenir les deux boutiques (l'offre gratuite ouvre les deux
 * métiers) : on écrit le même moyen de paiement sur `tailors` ET `vendors` pour
 * qu'il reste cohérent quel que soit l'espace d'où il l'a saisi. Une table sans
 * ligne pour ce pro n'échoue pas (0 ligne mise à jour).
 */
export type PayoutState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. L'enregistrement du moyen de paiement sera possible une fois Supabase configuré.";

const METHODS = Object.keys(PAYOUT_METHOD_LABELS) as PayoutMethod[];

export async function savePayoutMethod(
  _prev: PayoutState,
  formData: FormData,
): Promise<PayoutState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const method = String(formData.get("payout_method") ?? "").trim();
  const number = String(formData.get("payout_number") ?? "").trim();
  const name = String(formData.get("payout_name") ?? "").trim();

  if (!METHODS.includes(method as PayoutMethod)) {
    return { ok: false, error: "Choisissez un moyen de paiement." };
  }
  if (!number) {
    return {
      ok: false,
      error:
        method === "bank"
          ? "Indiquez le RIB / IBAN qui reçoit vos paiements."
          : "Indiquez le numéro qui reçoit vos paiements.",
    };
  }
  if (!name) {
    return { ok: false, error: "Indiquez le nom du titulaire du compte." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const patch = {
    payout_method: method,
    payout_number: number,
    payout_name: name,
  };

  const results = await Promise.all([
    supabase.from("tailors").update(patch).eq("id", user.id),
    supabase.from("vendors").update(patch).eq("id", user.id),
  ]);

  // Une seule des deux tables porte le pro dans la plupart des cas (0 ligne = pas
  // d'erreur). On n'échoue que si CHAQUE écriture a renvoyé une erreur.
  const errors = results.map((r) => r.error).filter(Boolean);
  if (errors.length === results.length && errors[0]) {
    return { ok: false, error: errors[0].message };
  }

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/vendeur/espace", "layout");
  return { ok: true };
}
