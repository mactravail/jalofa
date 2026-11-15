"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * « Je suis » : un seul compte pro porte une boutique tailleur ET une
 * boutique de tissus. Le pro choisit dans quel annuaire public il se montre —
 * /tailleurs, /vendeurs, les deux, ou aucun le temps de compléter sa fiche.
 * C'est le seul endroit qui règle `is_active` sur les deux lignes.
 *
 * Une boutique choisie doit aussi être *ouverte* (`is_activated`) pour figurer
 * dans l'annuaire. Or une boutique créée après l'inscription depuis l'appli
 * (ex. la ligne `vendors` d'un tailleur qui ajoute un tissu) naît fermée : le
 * garde des colonnes privilégiées force `is_activated = false` sur tout INSERT
 * d'un utilisateur. L'accès pro étant le même pour tout le compte, on ouvre (ou
 * crée) ici la boutique choisie avec la clé de service — uniquement pour un
 * compte pro déjà ouvert dans l'autre métier, et jamais pour un compte suspendu.
 */
export type ProVisibility = "tailor" | "vendor" | "both" | "none";

type Shop = "tailors" | "vendors";
type ShopRow = {
  is_activated: boolean;
  is_suspended: boolean;
  /** Ventes validées par JALOFA (colonne absente avant 20260904000001). */
  sales_approved?: boolean;
} | null;

export async function setProVisibility(choice: ProVisibility): Promise<ActionResult> {
  if (!["tailor", "vendor", "both", "none"].includes(choice)) {
    return { ok: false, error: "Choix inconnu." };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Mode démonstration — votre choix sera enregistré une fois la base de données connectée.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const [profileRes, tailorRes, vendorRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("tailors").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("vendors").select("*").eq("id", user.id).maybeSingle(),
  ]);
  const rows: Record<Shop, ShopRow> = {
    tailors: (tailorRes.data as ShopRow) ?? null,
    vendors: (vendorRes.data as ShopRow) ?? null,
  };
  const fullName = (profileRes.data as { full_name: string | null } | null)?.full_name ?? null;

  // Un compte pro ouvert : au moins une de ses boutiques l'est, aucune n'est suspendue.
  const isPro = Boolean(rows.tailors?.is_activated || rows.vendors?.is_activated);
  if (!isPro) return { ok: false, error: "Votre espace pro n'est pas encore ouvert." };
  if (rows.tailors?.is_suspended || rows.vendors?.is_suspended) {
    return { ok: false, error: "Votre boutique est suspendue. Contactez JALOFA." };
  }

  const wanted: Record<Shop, boolean> = {
    tailors: choice === "tailor" || choice === "both",
    vendors: choice === "vendor" || choice === "both",
  };

  // Une validation des ventes vaut pour le compte entier : la boutique qu'on
  // ouvre maintenant hérite de celle de l'autre métier.
  const salesApproved =
    rows.tailors?.sales_approved === true || rows.vendors?.sales_approved === true;

  let admin: ReturnType<typeof createAdminClient> | null = null;
  for (const shop of ["tailors", "vendors"] as const) {
    const row = rows[shop];
    if (!wanted[shop]) {
      if (row) {
        const { error } = await supabase.from(shop).update({ is_active: false }).eq("id", user.id);
        if (error) return { ok: false, error: error.message };
      }
      continue;
    }
    if (row?.is_activated) {
      const { error } = await supabase.from(shop).update({ is_active: true }).eq("id", user.id);
      if (error) return { ok: false, error: error.message };
      continue;
    }
    // Boutique absente ou restée fermée : on l'ouvre avec la clé de service.
    admin ??= createAdminClient();
    const { error } = row
      ? await admin.from(shop).update({ is_active: true, is_activated: true }).eq("id", user.id)
      : await admin.from(shop).insert({
          id: user.id,
          shop_name: fullName,
          plan: "free",
          is_activated: true,
          is_active: true,
          ...(salesApproved ? { sales_approved: true } : {}),
        });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleurs");
  revalidatePath("/vendeurs");
  return { ok: true };
}
