import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SubscriptionPlans } from "@/components/subscriptions/subscription-plans";

export const metadata: Metadata = {
  title: "Abonnements pros",
  description:
    "Tailleurs et vendeurs de tissus : choisissez l'offre JALOFA adaptée à votre activité. Gratuit, Standard ou Premium.",
};

const METIER_COPY = {
  tailor: {
    title: "Devenez tailleur sur JALOFA",
    subtitle:
      "Recevez des commandes sur mesure et gérez votre atelier. Démarrez gratuitement et ne payez qu'une commission sur vos ventes, ou passez à un forfait mensuel sans commission.",
  },
  vendor: {
    title: "Vendez vos tissus sur JALOFA",
    subtitle:
      "Ouvrez votre boutique de tissus en ligne pour toute la communauté. Démarrez gratuitement et ne payez qu'une commission sur vos ventes, ou passez à un forfait mensuel sans commission.",
  },
} as const;

const DEFAULT_COPY = {
  title: "Développez votre activité sur JALOFA",
  subtitle:
    "Démarrez gratuitement et ne payez qu'une commission sur vos ventes, ou passez à un forfait mensuel sans commission. Vendez du tissu, confectionnez des tenues — ou les deux.",
};

export default async function AbonnementsPage({
  searchParams,
}: {
  searchParams: Promise<{ metier?: string }>;
}) {
  const { metier } = await searchParams;
  const scope: "tailor" | "vendor" | undefined =
    metier === "tailor" || metier === "vendor" ? metier : undefined;
  const copy = scope ? METIER_COPY[scope] : DEFAULT_COPY;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">
          Espace pro
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">{copy.subtitle}</p>
      </div>

      <SubscriptionPlans metier={scope} />

      {/* Sortie « client » : les visiteurs qui veulent seulement commander
          repartent vers la création d'un compte client, sans abonnement. */}
      <div className="bg-muted/40 mx-auto mt-12 max-w-2xl rounded-2xl border p-6 text-center">
        <p className="font-medium">Vous voulez seulement commander des tenues ?</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Le compte client est gratuit et sans abonnement.
        </p>
        <Link
          href="/inscription?role=client"
          className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Créer un compte client <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
