import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; period?: string }>;
}) {
  const { plan, period } = await searchParams;
  return <RegisterForm initialPlan={plan} initialPeriod={period} />;
}
