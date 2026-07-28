"use server";

import { revalidatePath } from "next/cache";

import { passwordIssue } from "@/lib/password";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Le compte personnel — commun aux quatre espaces (client, tailleur, vendeur,
 * admin). À ne pas confondre avec le **profil public** d'un pro
 * (`saveTailorProfile` / `saveVendorProfile`) : ici on touche à l'identité du
 * compte (nom, téléphone, ville) et au mot de passe.
 */

export type AccountState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La modification du compte sera possible une fois Supabase configuré.";

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/**
 * Met à jour l'identité du compte connecté.
 *
 * Le nom est recopié dans les métadonnées d'authentification (c'est de là que
 * part le trigger `handle_new_user`, on garde les deux d'accord) et sur les
 * publications d'inspiration, où l'auteur est dénormalisé — sans quoi la galerie
 * publique continuerait d'afficher l'ancien nom.
 */
export async function saveAccountProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const full_name = text(formData.get("full_name"));
  if (!full_name) return { ok: false, error: "Le nom est requis." };
  if (full_name.length > 120) {
    return { ok: false, error: "Le nom est trop long (120 caractères maximum)." };
  }

  const phone = text(formData.get("phone"));
  const city = text(formData.get("city"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, city })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  await supabase.auth.updateUser({ data: { full_name, phone } });

  // Nom d'auteur dénormalisé sur la galerie communautaire. Les retours
  // (`feedback`) gardent volontairement le nom du moment : c'est un journal.
  await supabase
    .from("inspiration_posts")
    .update({ author_name: full_name })
    .eq("author_id", user.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Change le mot de passe du compte connecté.
 *
 * L'ancien mot de passe est exigé et vérifié en le rejouant contre Supabase :
 * sans ça, une session laissée ouverte sur un poste partagé suffirait à voler le
 * compte. On ne s'appuie pas sur l'option `current_password` de Supabase, qui
 * n'est honorée que si le réglage « require current password » est activé côté
 * projet — la vérification explicite fonctionne dans les deux cas.
 */
export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current) return { ok: false, error: "Saisissez votre mot de passe actuel." };
  if (next !== confirm) {
    return { ok: false, error: "Les deux nouveaux mots de passe ne sont pas identiques." };
  }
  if (next === current) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit être différent de l'ancien.",
    };
  }

  // Mêmes exigences qu'à l'inscription (cf. `src/lib/password.ts`).
  const weak = passwordIssue(next);
  if (weak) return { ok: false, error: weak };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Vous devez être connecté." };

  const { error: wrongCurrent } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (wrongCurrent) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    // Supabase applique aussi sa propre politique, et répond en anglais.
    if (error.code === "weak_password") {
      return {
        ok: false,
        error:
          "Mot de passe trop faible : 8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial.",
      };
    }
    if (error.code === "same_password") {
      return {
        ok: false,
        error: "Le nouveau mot de passe doit être différent de l'ancien.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
