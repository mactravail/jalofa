import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; inscription?: string }>;
}) {
  const { redirect, inscription } = await searchParams;

  return (
    <div className="space-y-4">
      {inscription === "ok" && (
        <p className="border-primary/30 bg-primary/5 text-foreground rounded-md border px-3 py-2 text-center text-sm">
          Compte créé. Vérifiez votre e-mail si une confirmation est requise, puis
          connectez-vous.
        </p>
      )}
      <LoginForm redirectTo={redirect} />
    </div>
  );
}
