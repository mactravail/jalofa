import type { Metadata } from "next";

import { RegisterChoice } from "@/components/auth/register-choice";
import { RegisterForm } from "@/components/auth/register-form";
import type { ProOfferId } from "@/lib/subscriptions";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Créer un compte") };
}

/**
 * « Créer un compte » : deux comptes seulement — **client** (gratuit) ou
 * **pro** (tailleur + vendeur de tissu, deux offres). Sans `role`, on affiche le
 * choix. Les anciens liens `role=tailor|vendor` et `plan=…` mènent au compte pro.
 */
const PRO_ROLES = new Set(["pro", "tailor", "vendor"]);

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    plan?: string;
    offre?: string;
    redirect?: string;
  }>;
}) {
  const { role, plan, offre, redirect } = await searchParams;

  const isPro = (role && PRO_ROLES.has(role)) || Boolean(plan);
  if (!isPro && role !== "client") {
    return <RegisterChoice redirect={redirect} />;
  }

  const wanted = offre ?? plan;
  const initialOffer: ProOfferId | undefined =
    wanted === "pro" || wanted === "premium" || wanted === "standard"
      ? "premium"
      : wanted === "free" || wanted === "gratuit"
        ? "free"
        : undefined;

  return (
    <RegisterForm
      kind={isPro ? "pro" : "client"}
      initialOffer={initialOffer}
      redirectTo={redirect}
    />
  );
}
