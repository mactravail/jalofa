import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conditions générales",
  description: `Conditions générales d'utilisation de la plateforme ${APP_NAME}.`,
};

const SECTIONS = [
  {
    title: "1. Objet",
    body: `${APP_NAME} met en relation des clients, des tailleurs et des vendeurs de tissus pour la confection de vêtements sur mesure en Afrique. En créant un compte, vous acceptez les présentes conditions générales.`,
  },
  {
    title: "2. Comptes",
    body: "Le compte client est gratuit. Les tailleurs et vendeurs choisissent un abonnement pro (Gratuit avec commission, Standard ou Premium). Vous êtes responsable de l'exactitude des informations fournies et de la confidentialité de votre mot de passe.",
  },
  {
    title: "3. Abonnements et paiements",
    body: "Les abonnements payants sont facturés mensuellement, sans engagement, et résiliables à tout moment. Le règlement s'effectue par Wave ou par virement bancaire. Le plan Gratuit prélève une commission sur chaque vente. Les paiements des commandes s'effectuent via Orange Money, Wave, Free Money ou carte bancaire.",
  },
  {
    title: "4. Commandes et confection",
    body: "Chaque vêtement est confectionné sur mesure d'après les mesures que vous renseignez. Les délais et prix sont indiqués par le tailleur avant confirmation. Les pièces sur mesure ne sont ni reprises ni échangées, sauf défaut de confection avéré.",
  },
  {
    title: "5. Données personnelles",
    body: `${APP_NAME} collecte les données nécessaires à la gestion de votre compte, de vos commandes et de vos paiements. Vos coordonnées bancaires ne sont pas stockées. Le détail figure dans notre politique de confidentialité.`,
  },
  {
    title: "6. Contact",
    body: "Pour toute question relative à ces conditions ou à vos données, contactez notre équipe depuis votre espace personnel.",
  },
];

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Conditions générales
      </h1>
      <p className="text-muted-foreground mt-3">
        Conditions générales d&apos;utilisation de {APP_NAME}.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p className="text-muted-foreground mt-10 text-sm">
        Voir aussi notre{" "}
        <Link
          href="/confidentialite"
          className="text-foreground underline underline-offset-4"
        >
          politique de confidentialité
        </Link>{" "}
        et nos{" "}
        <Link
          href="/mentions-legales"
          className="text-foreground underline underline-offset-4"
        >
          mentions légales
        </Link>
        .
      </p>
    </div>
  );
}
