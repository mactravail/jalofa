import { NextResponse, type NextRequest } from "next/server";

import { grantSelectionAccess, OFFER_PAGE } from "@/lib/pro-subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ROLE_LANDING: Record<string, string> = {
  client: "/compte",
  tailor: "/tailleur/espace",
  vendor: "/vendeur/espace",
  admin: "/admin",
};

/** Un compte créé il y a moins de 15 min est « nouveau » : on peut en faire un pro. */
const NEW_ACCOUNT_MS = 15 * 60 * 1000;

/**
 * Retour de Google / Apple (`signUpWithProvider`). Ouvre la session, puis, si
 * l'inscription venait de la page pro (`?role=pro`) et que le compte vient
 * d'être créé, en fait un compte pro — ce que `handle_new_user` fait à
 * l'inscription par e-mail. Google/Apple ne transmettent pas de rôle : le
 * déclencheur a donc créé un client, que l'on promeut avec la clé de service
 * (le rôle est une colonne protégée). Un compte client EXISTANT n'est jamais
 * converti en passant par là.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const wantsPro = searchParams.get("role") === "pro";
  const failure = new URL(`/inscription?${wantsPro ? "role=pro&" : ""}erreur=oauth`, origin);

  if (!code) return NextResponse.redirect(failure);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(failure);

  const user = data.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role as string) ?? "client";

  const isNew = Date.now() - new Date(user.created_at).getTime() < NEW_ACCOUNT_MS;
  if (wantsPro && role === "client" && isNew) {
    try {
      const admin = createAdminClient();
      const meta = user.user_metadata ?? {};
      const name = String(meta.full_name ?? meta.name ?? "").trim() || null;
      await admin.from("profiles").update({ role: "tailor", full_name: name }).eq("id", user.id);
      const shop = { id: user.id, shop_name: name ?? "", plan: "free", is_activated: true };
      await Promise.all([
        admin.from("tailors").upsert(shop, { onConflict: "id", ignoreDuplicates: true }),
        admin.from("vendors").upsert(shop, { onConflict: "id", ignoreDuplicates: true }),
      ]);
      const granted = await grantSelectionAccess(user.id);
      return NextResponse.redirect(
        new URL(granted ? `${OFFER_PAGE}?selection=1` : ROLE_LANDING.tailor, origin),
      );
    } catch (err) {
      console.error("[oauth pro signup]", err);
      return NextResponse.redirect(new URL("/compte", origin));
    }
  }

  return NextResponse.redirect(new URL(ROLE_LANDING[role] ?? "/compte", origin));
}
