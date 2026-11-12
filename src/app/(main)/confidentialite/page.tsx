import type { Metadata } from "next";
import Link from "@/components/i18n/link";

import { APP_NAME } from "@/lib/constants";
import { getLocale } from "@/lib/i18n/server";
import {
  CONFIDENTIALITE_CHROME_IT,
  CONFIDENTIALITE_SECTIONS_IT,
} from "@/lib/legal/confidentialite-it";
import type { LegalChrome, LegalClause } from "@/lib/legal/types";

// Texte de référence en français ; la version italienne vit dans
// `src/lib/legal/confidentialite-it.ts` — reporter toute modification.

const CHROME_FR: LegalChrome = {
  metaTitle: "Politique de confidentialité",
  metaDescription: `Comment ${APP_NAME} collecte, utilise et protège vos données personnelles, y compris vos mesures corporelles.`,
  heading: "Politique de confidentialité",
  intro: `Comment ${APP_NAME} collecte, utilise et protège vos données personnelles, y compris vos mesures corporelles.`,
  updatedLabel: "Dernière mise à jour :",
  updated: "25 juillet 2026",
  seeAlso: "Voir aussi nos",
  and: "et nos",
  links: {
    conditions: "conditions générales",
    confidentialite: "politique de confidentialité",
    mentions: "mentions légales",
  },
};

async function content(): Promise<{ chrome: LegalChrome; sections: LegalClause[] }> {
  return (await getLocale()) === "it"
    ? { chrome: CONFIDENTIALITE_CHROME_IT, sections: CONFIDENTIALITE_SECTIONS_IT }
    : { chrome: CHROME_FR, sections: SECTIONS };
}

export async function generateMetadata(): Promise<Metadata> {
  const { chrome } = await content();
  return { title: chrome.metaTitle, description: chrome.metaDescription };
}

const SECTIONS: LegalClause[] = [
  {
    title: "1. Responsable du traitement",
    body: `${APP_NAME} est responsable du traitement des données personnelles collectées sur la plateforme. Pour toute question relative à vos données ou pour exercer vos droits, contactez-nous depuis votre espace personnel ou à mactravail23@gmail.com.`,
  },
  {
    title: "2. Champ d'application",
    body: `Cette politique s'applique à toute personne qui utilise ${APP_NAME} : clients, tailleurs, vendeurs de tissus et visiteurs. Elle complète nos conditions générales d'utilisation. En utilisant la plateforme, vous en prenez connaissance.`,
  },
  {
    title: "3. Données que nous collectons",
    body: "Selon votre profil et votre usage, nous collectons :",
    list: [
      "Identité et compte : nom, mot de passe (stocké chiffré), rôle (client, tailleur, vendeur).",
      "Coordonnées : numéro de téléphone, adresse e-mail, adresses de livraison.",
      "Mesures corporelles : les mesures que vous renseignez (au centimètre) ou la taille standard choisie.",
      "Commandes et paiements : historique de commandes, montants, moyen de paiement utilisé, statut des livraisons.",
      "Données professionnelles (pros) : nom de la boutique, ville, catalogue, prix, plan d'abonnement, informations de reversement.",
      "Contenus que vous publiez : photos de modèles et de tissus, avis, messages échangés dans la messagerie.",
      "Données techniques : cookies de session, journaux de connexion, type d'appareil — pour la sécurité et le bon fonctionnement du site.",
    ],
  },
  {
    title: "4. Pourquoi nous utilisons vos données",
    body: "Vos données servent uniquement à faire fonctionner le service :",
    list: [
      "créer et gérer votre compte, et vous authentifier ;",
      "traiter, confectionner, suivre et livrer vos commandes ;",
      "assurer la mise en relation entre clients, tailleurs et vendeurs ;",
      "traiter les paiements et gérer les fonds en attente puis les reversements ;",
      "vous envoyer les notifications liées à vos commandes et à votre compte ;",
      "prévenir la fraude, gérer les réclamations et appliquer nos conditions ;",
      "améliorer la plateforme et respecter nos obligations légales.",
    ],
  },
  {
    title: "5. Base légale des traitements",
    body: `Nous traitons vos données lorsque cela est nécessaire à l'exécution du service que vous nous demandez (votre commande, votre compte), pour respecter nos obligations légales (comptables et fiscales), au titre de notre intérêt légitime à sécuriser la plateforme et à prévenir la fraude, ou sur la base de votre consentement lorsqu'il est requis. ${APP_NAME} traite ces données dans le respect de la réglementation sénégalaise sur la protection des données à caractère personnel.`,
  },
  {
    title: "6. Vos mesures corporelles",
    body: "Vos mesures sont des données sensibles que nous protégeons avec un soin particulier. Elles ne sont partagées qu'avec le tailleur en charge de votre commande, et uniquement le temps nécessaire à sa réalisation. Elles ne sont jamais revendues, ni utilisées à des fins publicitaires, ni communiquées à un tiers non concerné par votre commande. Vous pouvez les mettre à jour ou en demander la suppression.",
  },
  {
    title: "7. Paiements",
    body: "Les paiements (Orange Money, Wave, Free Money, carte bancaire) sont traités par nos prestataires de paiement. Vos coordonnées bancaires complètes ne transitent pas par nos serveurs et ne sont pas stockées par la plateforme. Nous ne conservons que les informations nécessaires au suivi de la commande (montant, moyen utilisé, statut).",
  },
  {
    title: "8. Fonds en attente et lutte contre la fraude",
    body: `Pour protéger clients et professionnels, la somme d'une commande est conservée en fonds en attente puis reversée au professionnel 3 jours après la livraison, en l'absence de réclamation. À ce titre, nous conservons les informations nécessaires au suivi des paiements, des réclamations et des reversements, et à la détection des comportements frauduleux.`,
  },
  {
    title: "9. Partage de vos données",
    body: `${APP_NAME} ne vend pas vos données. Elles ne sont partagées qu'avec :`,
    list: [
      `le tailleur ou le vendeur concerné par votre commande. Pendant une demande de devis, il reçoit un code, vos mesures et votre adresse de livraison : votre nom, votre téléphone et votre e-mail ne sont connus que de ${APP_NAME}. Il les reçoit une fois la commande payée, pour vous livrer ;`,
      "nos prestataires techniques strictement nécessaires : hébergement, base de données, paiement, livraison ;",
      "les autorités compétentes, uniquement lorsque la loi l'exige.",
    ],
  },
  {
    title: "10. Hébergement et transferts hors du Sénégal",
    body: "Le site est hébergé par Vercel Inc. (États-Unis) et les données sont stockées via Supabase. Certaines données peuvent donc être traitées en dehors du Sénégal, chez des prestataires qui présentent des garanties de sécurité appropriées. Nous limitons ces transferts à ce qui est nécessaire au fonctionnement du service.",
  },
  {
    title: "11. Durée de conservation",
    body: "Vos données sont conservées tant que votre compte est actif, puis pendant la durée légale requise par nos obligations comptables et fiscales. Les mesures corporelles sont conservées le temps nécessaire à vos commandes et à votre confort d'utilisation, et supprimées sur demande. Les données liées à la fraude ou aux litiges sont conservées le temps de traiter le dossier.",
  },
  {
    title: "12. Sécurité",
    body: `${APP_NAME} met en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement des mots de passe, accès restreints, cloisonnement des données par compte. Aucune plateforme ne peut garantir une sécurité absolue, mais nous nous engageons à protéger vos informations et à réagir rapidement en cas d'incident.`,
  },
  {
    title: "13. Vos droits",
    body: "Vous disposez d'un droit d'accès, de rectification, d'opposition, de limitation et de suppression de vos données, ainsi que d'un droit à en obtenir une copie. Vous pouvez exercer ces droits depuis votre espace personnel ou en nous écrivant à mactravail23@gmail.com. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission de Protection des Données Personnelles (CDP) du Sénégal.",
  },
  {
    title: "14. Cookies",
    body: `${APP_NAME} utilise des cookies techniques indispensables au fonctionnement du site (session, panier, préférences). Aucun cookie publicitaire tiers n'est déposé sans votre consentement. Vous pouvez configurer votre navigateur pour limiter les cookies, au risque de dégrader certaines fonctionnalités.`,
  },
  {
    title: "15. Avis, photos et contenus publics",
    body: "Les avis que vous publiez, ainsi que les photos qui les accompagnent, sont visibles par les autres utilisateurs. Ne publiez pas d'informations personnelles que vous souhaitez garder privées. Les professionnels sont responsables des photos de modèles et de tissus qu'ils mettent en ligne.",
  },
  {
    title: "16. Mineurs",
    body: `${APP_NAME} n'est pas destiné aux mineurs de moins de 18 ans sans l'accord d'un représentant légal. Nous ne collectons pas sciemment les données d'un mineur sans cet accord.`,
  },
  {
    title: "17. Modifications de cette politique",
    body: "Nous pouvons faire évoluer cette politique. La version en vigueur est celle publiée sur cette page, avec sa date de mise à jour. En cas de changement important, nous vous en informons.",
  },
  {
    title: "18. Contact",
    body: "Pour toute question relative à vos données ou à cette politique, contactez notre équipe depuis votre espace personnel ou à mactravail23@gmail.com.",
  },
];

export default async function ConfidentialitePage() {
  const { chrome, sections } = await content();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{chrome.heading}</h1>
      <p className="text-muted-foreground mt-3">{chrome.intro}</p>
      <p className="text-muted-foreground mt-2 text-sm">
        {chrome.updatedLabel} {chrome.updated}
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{section.body}</p>
            {section.list ? (
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <p className="text-muted-foreground mt-10 border-t pt-8 text-sm">
        {chrome.seeAlso}{" "}
        <Link href="/conditions" className="text-foreground underline underline-offset-4">
          {chrome.links.conditions}
        </Link>{" "}
        {chrome.and}{" "}
        <Link href="/mentions-legales" className="text-foreground underline underline-offset-4">
          {chrome.links.mentions}
        </Link>
        .
      </p>
    </div>
  );
}
