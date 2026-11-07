import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return <ForgotPasswordForm linkError={erreur === "lien"} />;
}
