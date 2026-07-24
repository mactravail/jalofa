import type { Metadata } from "next";

import { RegisterChoice } from "@/components/auth/register-choice";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Créer un compte" };

/**
 * « Créer un compte » commence par un choix de profil (client / tailleur /
 * vendeur) — on ne jette plus les clients sur les tarifs pros. On n'affiche le
 * formulaire que lorsque le profil est connu : `role=client` (choix explicite)
 * ou `plan=…` (arrivée depuis les offres pros).
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    period?: string;
    role?: string;
    metier?: string;
    redirect?: string;
  }>;
}) {
  const { plan, period, role, metier, redirect } = await searchParams;

  if (!plan && role !== "client") {
    return <RegisterChoice redirect={redirect} />;
  }

  return (
    <RegisterForm
      initialPlan={plan}
      initialPeriod={period}
      initialMetier={metier}
      redirectTo={redirect}
    />
  );
}
