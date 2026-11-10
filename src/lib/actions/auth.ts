"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { passwordIssue } from "@/lib/password";
import { isSupabaseConfigured } from "@/lib/queries";
import { safeRedirect } from "@/lib/safe-redirect";
import { grantLaunchPromo, OFFER_PAGE, startProCheckout } from "@/lib/pro-subscription";
import { PAID_PLAN_ID } from "@/lib/subscriptions";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;

const DB_NOT_READY =
  "La base de données n'est pas encore connectée. Réessayez une fois Supabase configuré.";

const ROLE_LANDING: Record<string, string> = {
  client: "/compte",
  tailor: "/tailleur/espace",
  vendor: "/vendeur/espace",
  admin: "/admin",
};

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  if (!email || !password) {
    return { error: "Veuillez renseigner votre e-mail et votre mot de passe." };
  }
  if (!isSupabaseConfigured()) return { error: DB_NOT_READY };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  // `redirect` vient de l'URL, donc de n'importe qui : on n'en garde qu'un
  // chemin interne (cf. `safeRedirect`). Une valeur externe est ignorée, et
  // l'utilisateur atterrit sur l'espace de son rôle.
  let destination = safeRedirect(redirectTo, "");
  if (!destination) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    destination = ROLE_LANDING[(profile?.role as string) ?? "client"] ?? "/compte";
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "").trim();

  if (!fullName || !email || !password) {
    return { error: "Nom, e-mail et mot de passe sont obligatoires." };
  }
  // Exigences de robustesse (majuscule, minuscule, chiffre, caractère spécial,
  // 8 caractères mini). Vérifiées ici quoi qu'il arrive : le formulaire donne le
  // même retour en direct, mais c'est ce contrôle qui fait foi.
  const weak = passwordIssue(password);
  if (weak) {
    return { error: weak };
  }

  // Mot de passe répété à l'inscription : on revérifie ici (le bouton est
  // aussi bloqué côté navigateur tant que les deux diffèrent).
  if (String(formData.get("password_confirm") ?? "") !== password) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }

  // Case « J'accepte les conditions » cochée côté client — revalidée ici.
  if (String(formData.get("accept_terms") ?? "") !== "true") {
    return { error: "Vous devez accepter les conditions générales pour continuer." };
  }

  // Deux comptes : Client ou Pro. Un compte Pro ouvre les DEUX métiers (atelier
  // + boutique de tissus — cf. `handle_new_user`) ; il est enregistré en base
  // avec le rôle `tailor`, l'espace vendeur s'ouvre via le sélecteur d'espace.
  // Tout pro naît sur l'offre Gratuit ; l'offre Pro (payante) ne s'active
  // qu'après le paiement PayDunya confirmé (cf. `settleProPayment`).
  const rawRole = String(formData.get("role") ?? "client");
  const isPro = rawRole === "pro" || rawRole === "tailor" || rawRole === "vendor";
  const role = isPro ? "tailor" : "client";
  // Offre Pro : le 1er mois se paie à l'inscription (PayDunya) — un compte peut
  // être supprimé à tout moment, il ne doit donc pas naître avec une dette. Les
  // mois suivants sont retenus sur les ventes (cf. `renewProFromSale`).
  const wantsPaidOffer = isPro && String(formData.get("offer") ?? "") === PAID_PLAN_ID;

  if (!isSupabaseConfigured()) return { error: DB_NOT_READY };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  });

  if (error) {
    // Supabase applique sa propre politique de mot de passe et répond en
    // anglais. Notre contrôle est au moins aussi strict, donc ce cas ne devrait
    // pas se produire — filet de sécurité si les deux réglages divergent.
    if (error.code === "weak_password") {
      return {
        error:
          "Mot de passe trop faible : 8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial.",
      };
    }
    return { error: error.message };
  }

  // Un client qui s'inscrivait pour finaliser un achat (personnalisation,
  // caisse…) doit revenir là où il était ; les pros vont vers leur espace.
  const fallbackLanding = ROLE_LANDING[role] ?? "/compte";
  const landing =
    role === "client" ? safeRedirect(redirectTo, fallbackLanding) : fallbackLanding;

  // If email confirmation is disabled the user is signed in immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    // Offre Pro choisie : on part directement payer sur PayDunya. Si la
    // passerelle échoue, le compte existe déjà (offre Gratuit) et la page
    // « Mon offre » permet de réessayer.
    if (wantsPaidOffer && data.user) {
      // Offre de lancement (novembre) : Pro offert jusqu'au 1er décembre, rien
      // à payer maintenant. Plus de place → paiement du 1er mois comme d'habitude.
      let promo = false;
      try {
        promo = await grantLaunchPromo(data.user.id);
      } catch (err) {
        console.error("[launch promo]", err);
      }
      if (promo) redirect(`${OFFER_PAGE}?lancement=1`);

      let checkoutUrl: string | null = null;
      try {
        checkoutUrl = await startProCheckout({
          id: data.user.id,
          name: fullName,
          email,
          phone,
        });
      } catch (err) {
        console.error("[paydunya checkout]", err);
      }
      redirect(checkoutUrl ?? `${OFFER_PAGE}?erreur=1`);
    }
    redirect(landing);
  }

  // Confirmation par e-mail requise : on conserve la destination pour la
  // reprendre après la connexion qui suit l'activation.
  const params = new URLSearchParams({ inscription: "ok", email });
  const kept = role === "client" ? safeRedirect(redirectTo, "") : "";
  if (kept) params.set("redirect", kept);
  redirect(`/connexion?${params.toString()}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ------------------------------------------------------------------------- */
/* Mot de passe oublié                                                        */
/* ------------------------------------------------------------------------- */

export type ResetRequestState = { sent: true } | { error: string } | null;

/** Origine publique du site (https://jalofa.com en prod, localhost en dev). */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "jalofa.com";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Envoie le lien de réinitialisation. La réponse est la même que le compte
 * existe ou non : sinon le formulaire servirait à deviner qui est inscrit.
 */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Saisissez l'adresse e-mail de votre compte." };
  }
  if (!isSupabaseConfigured()) return { error: DB_NOT_READY };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/mot-de-passe/nouveau`,
  });

  // Seule la limite d'envoi est signalée : elle ne révèle rien sur le compte.
  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit")) {
    return { error: "Trop de demandes. Patientez quelques minutes puis réessayez." };
  }
  return { sent: true };
}

/**
 * Pose le nouveau mot de passe. La session vient du lien reçu par e-mail
 * (`/auth/confirm`) : sans elle, le lien a expiré ou a déjà servi.
 */
export async function setNewPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: DB_NOT_READY };

  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (next !== confirm) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }
  const weak = passwordIssue(next);
  if (weak) return { error: weak };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    return {
      error:
        "Le lien a expiré. Demandez un nouveau lien depuis « Mot de passe oublié ».",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    if (error.code === "weak_password") {
      return {
        error:
          "Mot de passe trop faible : 8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial.",
      };
    }
    if (error.code === "same_password") {
      return { error: "Choisissez un mot de passe différent de l'ancien." };
    }
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  revalidatePath("/", "layout");
  redirect(ROLE_LANDING[(profile?.role as string) ?? "client"] ?? "/compte");
}
