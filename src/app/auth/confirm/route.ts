import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirect } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Atterrissage des liens envoyés par e-mail (réinitialisation du mot de passe).
 *
 * Deux formats acceptés :
 *   - `?token_hash=…&type=recovery` (modèle d'e-mail recommandé : marche même si
 *     le lien est ouvert dans un autre navigateur que celui de la demande) ;
 *   - `?code=…` (modèle Supabase par défaut, flux PKCE).
 * Succès → session ouverte, puis `next` (chemin interne uniquement).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"), "/mot-de-passe/nouveau");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/mot-de-passe-oublie?erreur=lien", origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
