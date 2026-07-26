import type { Metadata } from "next";

import { RegisterChoice } from "@/components/auth/register-choice";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Créer un compte" };

/**
 * « Créer un compte » commence par un choix de profil (client / tailleur /
 * vendeur). On n'affiche le formulaire que lorsque le profil est connu :
 * `role=client|tailor|vendor` (choix explicite). L'inscription est gratuite pour
 * tous — les pros n'ont plus d'abonnement à choisir. Le paramètre `plan=…` reste
 * accepté (page `/abonnements` conservée mais non liée) pour un retour éventuel
 * des forfaits.
 */
const KNOWN_ROLES = new Set(["client", "tailor", "vendor"]);

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

  if (!plan && !(role && KNOWN_ROLES.has(role))) {
    return <RegisterChoice redirect={redirect} />;
  }

  return (
    <RegisterForm
      initialPlan={plan}
      initialPeriod={period}
      initialRole={role}
      initialMetier={metier}
      redirectTo={redirect}
    />
  );
}
