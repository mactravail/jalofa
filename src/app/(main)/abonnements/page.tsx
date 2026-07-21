import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SubscriptionPlans } from "@/components/subscriptions/subscription-plans";

export const metadata: Metadata = {
  title: "Abonnements pros",
  description:
    "Tailleurs et vendeurs de tissus : choisissez l'offre JALOFA adaptée à votre activité. Gratuit, Standard ou Premium.",
};

export default function AbonnementsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Développez votre activité sur JALOFA
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Démarrez gratuitement et ne payez qu&apos;une commission sur vos ventes,
          ou passez à un forfait mensuel sans commission. Vendez du tissu,
          confectionnez des tenues — ou les deux.
        </p>
      </div>

      <SubscriptionPlans />

      {/* Sortie « client » : les visiteurs qui veulent seulement commander
          atterrissent aussi ici depuis « Créer un compte ». */}
      <div className="bg-muted/40 mx-auto mt-12 max-w-2xl rounded-2xl border p-6 text-center">
        <p className="font-medium">Vous voulez seulement commander des tenues ?</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Le compte client est gratuit et sans abonnement.
        </p>
        <Link
          href="/inscription"
          className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Créer un compte client <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
