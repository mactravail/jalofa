import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Éditeur, hébergement et informations légales de la plateforme ${APP_NAME}.`,
};

const SECTIONS = [
  {
    title: "Éditeur",
    body: `Le site ${APP_NAME} est édité par ${APP_NAME}, plateforme de couture sur mesure basée en Afrique. Pour toute question, contactez notre équipe depuis votre espace personnel.`,
  },
  {
    title: "Directeur de la publication",
    body: `Le directeur de la publication est le représentant légal de ${APP_NAME}.`,
  },
  {
    title: "Hébergement",
    body: "Le site est hébergé par Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis). Les données sont stockées via Supabase.",
  },
  {
    title: "Activité",
    body: `${APP_NAME} met en relation des clients avec des tailleurs et des vendeurs de tissus pour la confection de vêtements sur mesure. La plateforme facilite la commande, le paiement et le suivi ; la confection est réalisée par des tailleurs indépendants.`,
  },
  {
    title: "Propriété intellectuelle",
    body: `L'ensemble des contenus du site (marque, logo, textes, interface) est la propriété de ${APP_NAME} ou de ses partenaires. Les photos de modèles et de tissus restent la propriété des tailleurs et vendeurs qui les publient. Toute reproduction sans autorisation est interdite.`,
  },
  {
    title: "Responsabilité",
    body: `${APP_NAME} s'efforce d'assurer l'exactitude des informations publiées, sans garantir l'absence d'erreurs. La responsabilité de la qualité de confection incombe au tailleur choisi ; ${APP_NAME} intervient en cas de litige selon ses conditions générales.`,
  },
];

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Mentions légales
      </h1>
      <p className="text-muted-foreground mt-3">
        Éditeur, hébergement et informations légales de {APP_NAME}.
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
        Voir aussi nos{" "}
        <Link href="/conditions" className="text-foreground underline underline-offset-4">
          conditions générales
        </Link>{" "}
        et notre{" "}
        <Link
          href="/confidentialite"
          className="text-foreground underline underline-offset-4"
        >
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
