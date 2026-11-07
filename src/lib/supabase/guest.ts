import type { User } from "@supabase/supabase-js";

import { passwordIssue } from "@/lib/password";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type NewClientAccount = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export type EnsureAccountResult =
  | { ok: true; user: User; created: boolean }
  | { ok: false; error: string };

/**
 * Pas d'inscription séparée : le client crée son compte EN COMMANDANT. Il donne
 * déjà nom, téléphone et e-mail pour la livraison ; on lui demande en plus un
 * mot de passe, et son compte client naît avec la commande. Il peut ensuite
 * suivre ses commandes et se reconnecter avec cet e-mail et ce mot de passe.
 *
 * - Déjà connecté → on garde sa session.
 * - E-mail déjà connu → on tente la connexion avec le mot de passe saisi (un
 *   client qui revient n'a pas à passer par « Se connecter »).
 *
 * La confirmation par e-mail est désactivée côté Supabase (autoconfirm) : la
 * session est ouverte immédiatement.
 */
export async function ensureClientAccount(
  supabase: ServerClient,
  account: NewClientAccount | null,
): Promise<EnsureAccountResult> {
  const {
    data: { user: current },
  } = await supabase.auth.getUser();
  if (current && !current.is_anonymous) return { ok: true, user: current, created: false };

  if (!account) {
    return { ok: false, error: "Créez votre mot de passe pour suivre votre commande." };
  }
  const email = account.email.trim();
  const fullName = account.fullName.trim();
  const phone = account.phone.trim();
  if (!email || !fullName || !phone) {
    return { ok: false, error: "Complétez vos coordonnées." };
  }
  if (!account.password) {
    return { ok: false, error: "Créez votre mot de passe pour suivre votre commande." };
  }

  // Mot de passe hors politique : ce ne peut être qu'un client qui revient
  // (ancien mot de passe). On tente la connexion ; sinon, on explique les règles.
  const weak = passwordIssue(account.password);
  if (weak) {
    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: account.password,
    });
    if (signInError || !signedIn.user) return { ok: false, error: weak };
    return { ok: true, user: signedIn.user, created: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: account.password,
    // Le trigger `handle_new_user` crée le profil client à partir de ces champs.
    options: { data: { full_name: fullName, phone, role: "client" } },
  });

  if (error) {
    const exists =
      error.code === "user_already_exists" || /already registered/i.test(error.message);
    if (!exists) {
      if (error.code === "weak_password") {
        return {
          ok: false,
          error:
            "Mot de passe trop faible : 8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial.",
        };
      }
      return { ok: false, error: error.message };
    }
    // Client qui revient : on le connecte avec le mot de passe saisi.
    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: account.password,
    });
    if (signInError || !signedIn.user) {
      return {
        ok: false,
        error:
          "Un compte existe déjà avec cet e-mail, mais le mot de passe ne correspond pas. Entrez votre mot de passe habituel.",
      };
    }
    return { ok: true, user: signedIn.user, created: false };
  }

  if (!data.user) {
    return { ok: false, error: "Impossible de créer votre compte. Réessayez." };
  }
  if (!data.session) {
    return {
      ok: false,
      error: "Compte créé : confirmez votre e-mail puis validez à nouveau votre commande.",
    };
  }
  return { ok: true, user: data.user, created: true };
}
