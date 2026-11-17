import type { Metadata } from "next";

import { RegisterChoice } from "@/components/auth/register-choice";
import { RegisterForm } from "@/components/auth/register-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Créer un compte") };
}

/**
 * « Créer un compte » : deux comptes seulement — **client** (gratuit) ou
 * **pro** (tailleur + vendeur de tissu, candidature à la Sélection JALOFA). Sans
 * `role`, on affiche le choix. Les anciens liens `role=tailor|vendor`, `plan=…`
 * et `offre=…` mènent au compte pro.
 */
const PRO_ROLES = new Set(["pro", "tailor", "vendor"]);

type Provider = "google" | "apple";

/**
 * Accès Google / Apple réellement activés dans Supabase. Un bouton n'apparaît
 * que si son accès est actif : tant qu'il ne l'est pas, il est caché (sinon le
 * pro tomberait sur une erreur). Relu toutes les 5 minutes.
 */
async function enabledProviders(): Promise<Provider[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const external =
      ((await res.json()) as { external?: Record<string, boolean> }).external ??
      {};
    return (["google", "apple"] as const).filter((p) => external[p] === true);
  } catch {
    return [];
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    plan?: string;
    offre?: string;
    redirect?: string;
    erreur?: string;
  }>;
}) {
  const { role, plan, offre, redirect, erreur } = await searchParams;

  const isPro =
    (role && PRO_ROLES.has(role)) || Boolean(plan) || Boolean(offre);
  if (!isPro && role !== "client") {
    return <RegisterChoice redirect={redirect} />;
  }

  const providers = isPro ? await enabledProviders() : [];

  return (
    <RegisterForm
      providers={providers}
      kind={isPro ? "pro" : "client"}
      redirectTo={redirect}
      oauthFailed={erreur === "oauth"}
    />
  );
}
