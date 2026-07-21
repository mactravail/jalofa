import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: `Les réponses aux questions les plus courantes sur ${APP_NAME} : commandes, mesures, paiement, livraison et espaces pros.`,
};

type QA = { q: string; a: string };
type Category = { title: string; items: QA[] };

const CATEGORIES: Category[] = [
  {
    title: "Commander",
    items: [
      {
        q: "Comment passer une commande sur mesure ?",
        a: "Choisissez un modèle, un style et un tissu (ou utilisez le vôtre), sélectionnez un tailleur, renseignez vos mesures puis réglez le paiement. Chaque étape est guidée dans l'application.",
      },
      {
        q: "Puis-je utiliser mon propre tissu ?",
        a: "Oui. Au moment de choisir le tissu, sélectionnez l'option « J'ai déjà mon tissu » : vous convenez alors avec le tailleur de la remise du tissu.",
      },
      {
        q: "Puis-je commander un vêtement sans le personnaliser ?",
        a: "Oui. Certains modèles peuvent être commandés tels quels en indiquant simplement une taille standard, sans passer par la personnalisation détaillée.",
      },
    ],
  },
  {
    title: "Mesures & tailles",
    items: [
      {
        q: "Comment renseigner mes mesures ?",
        a: "Deux options : saisir vos mesures détaillées (en centimètres) ou choisir une taille standard, de XS à XXXL. Vos mesures sont enregistrées pour vos prochaines commandes.",
      },
      {
        q: "Qui a accès à mes mesures ?",
        a: "Seul le tailleur en charge de votre commande y accède, uniquement le temps de la confection. Elles ne sont jamais revendues.",
      },
    ],
  },
  {
    title: "Paiement",
    items: [
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Orange Money, Wave, Free Money et carte bancaire. Le paiement s'effectue de façon sécurisée au moment de la commande.",
      },
      {
        q: "Mes coordonnées bancaires sont-elles conservées ?",
        a: "Non. Les paiements sont traités par nos prestataires et vos coordonnées bancaires complètes ne sont pas stockées par la plateforme.",
      },
    ],
  },
  {
    title: "Livraison & suivi",
    items: [
      {
        q: "Comment suivre ma commande ?",
        a: "Depuis votre espace client, vous suivez chaque étape : commande acceptée, tissu préparé, couture, contrôle qualité, expédition et livraison.",
      },
      {
        q: "Quels sont les modes de livraison ?",
        a: "La livraison à domicile ou le retrait en boutique, selon ce que propose le tailleur. Le mode et les frais sont indiqués avant le paiement.",
      },
      {
        q: "Puis-je retourner un vêtement sur mesure ?",
        a: "Les pièces confectionnées sur mesure ne sont ni reprises ni échangées, sauf défaut de confection avéré. Dans ce cas, contactez-nous depuis votre espace personnel.",
      },
    ],
  },
  {
    title: "Tailleurs & vendeurs",
    items: [
      {
        q: "Comment devenir tailleur ou vendeur de tissus ?",
        a: "Créez un compte pro et choisissez un abonnement. Vous accédez alors à votre espace pour publier votre catalogue et gérer vos commandes.",
      },
      {
        q: "Quels sont les abonnements pros ?",
        a: "Gratuit (avec une commission prélevée sur chaque vente), Standard (un métier, sans commission) et Premium (les deux métiers, sans commission). Les détails figurent sur la page Abonnements.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Questions fréquentes
      </h1>
      <p className="text-muted-foreground mt-3">
        Tout ce qu&apos;il faut savoir pour commander votre tenue sur mesure sur{" "}
        {APP_NAME}.
      </p>

      <div className="mt-10 space-y-10">
        {CATEGORIES.map((category) => (
          <section key={category.title}>
            <h2 className="text-lg font-semibold">{category.title}</h2>
            <div className="mt-3 divide-y rounded-xl border">
              {category.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="bg-muted/40 mt-12 rounded-2xl border p-6 text-center">
        <h2 className="text-lg font-semibold">Vous ne trouvez pas votre réponse ?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Découvrez le déroulé complet d&apos;une commande.
        </p>
        <div className="mt-4">
          <Link
            href="/comment-ca-marche"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Comment ça marche
          </Link>
        </div>
      </div>
    </div>
  );
}
