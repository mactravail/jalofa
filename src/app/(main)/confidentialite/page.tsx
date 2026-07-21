import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${APP_NAME} collecte, utilise et protège vos données personnelles.`,
};

const SECTIONS = [
  {
    title: "1. Données que nous collectons",
    body: `Pour créer votre compte et traiter vos commandes, ${APP_NAME} collecte votre nom, votre numéro de téléphone, votre adresse e-mail, vos adresses de livraison et les mesures que vous renseignez. Les tailleurs et vendeurs fournissent en plus les informations de leur activité (nom de la boutique, ville, catalogue).`,
  },
  {
    title: "2. Utilisation des données",
    body: "Vos données servent uniquement à gérer votre compte, à confectionner et livrer vos commandes, à assurer la mise en relation avec les tailleurs et vendeurs, à traiter les paiements et à vous envoyer les notifications liées à vos commandes.",
  },
  {
    title: "3. Mesures et confection",
    body: "Vos mesures corporelles ne sont partagées qu'avec le tailleur en charge de votre commande, et uniquement le temps nécessaire à sa réalisation. Elles ne sont jamais revendues ni utilisées à des fins publicitaires.",
  },
  {
    title: "4. Paiements",
    body: "Les paiements (Orange Money, Wave, Free Money, carte bancaire) sont traités par nos prestataires de paiement. Vos coordonnées bancaires complètes ne transitent pas par nos serveurs et ne sont pas stockées par la plateforme.",
  },
  {
    title: "5. Partage avec des tiers",
    body: `${APP_NAME} ne vend pas vos données. Elles ne sont partagées qu'avec les tailleurs et vendeurs concernés par vos commandes, ainsi qu'avec les prestataires techniques strictement nécessaires (hébergement, paiement, livraison).`,
  },
  {
    title: "6. Conservation",
    body: "Vos données sont conservées tant que votre compte est actif, puis pendant la durée légale requise pour les obligations comptables et fiscales. Vous pouvez demander la suppression de votre compte à tout moment.",
  },
  {
    title: "7. Vos droits",
    body: "Vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. Vous pouvez exercer ces droits depuis votre espace personnel ou en contactant notre équipe.",
  },
  {
    title: "8. Cookies",
    body: `${APP_NAME} utilise des cookies techniques indispensables au fonctionnement du site (session, panier, préférences). Aucun cookie publicitaire tiers n'est déposé sans votre consentement.`,
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Politique de confidentialité
      </h1>
      <p className="text-muted-foreground mt-3">
        Comment {APP_NAME} collecte, utilise et protège vos données
        personnelles.
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
