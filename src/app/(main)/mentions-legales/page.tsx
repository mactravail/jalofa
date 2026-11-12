import type { Metadata } from "next";
import Link from "@/components/i18n/link";

import { APP_NAME } from "@/lib/constants";
import { getLocale } from "@/lib/i18n/server";
import { MENTIONS_CHROME_IT, MENTIONS_SECTIONS_IT } from "@/lib/legal/mentions-legales-it";
import type { LegalChrome, LegalClause } from "@/lib/legal/types";

// Texte de référence en français ; la version italienne vit dans
// `src/lib/legal/mentions-legales-it.ts` — reporter toute modification.

const CHROME_FR: LegalChrome = {
  metaTitle: "Mentions légales",
  metaDescription: `Éditeur, hébergement et informations légales de la plateforme ${APP_NAME}.`,
  heading: "Mentions légales",
  intro: `Éditeur, hébergement et informations légales de ${APP_NAME}.`,
  seeAlso: "Voir aussi nos",
  and: "et notre",
  links: {
    conditions: "conditions générales",
    confidentialite: "politique de confidentialité",
    mentions: "mentions légales",
  },
};

async function content(): Promise<{ chrome: LegalChrome; sections: LegalClause[] }> {
  return (await getLocale()) === "it"
    ? { chrome: MENTIONS_CHROME_IT, sections: MENTIONS_SECTIONS_IT }
    : { chrome: CHROME_FR, sections: SECTIONS };
}

export async function generateMetadata(): Promise<Metadata> {
  const { chrome } = await content();
  return { title: chrome.metaTitle, description: chrome.metaDescription };
}

const SECTIONS: LegalClause[] = [
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

export default async function MentionsLegalesPage() {
  const { chrome, sections } = await content();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{chrome.heading}</h1>
      <p className="text-muted-foreground mt-3">{chrome.intro}</p>

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

      <p className="text-muted-foreground mt-10 text-sm">
        {chrome.seeAlso}{" "}
        <Link href="/conditions" className="text-foreground underline underline-offset-4">
          {chrome.links.conditions}
        </Link>{" "}
        {chrome.and}{" "}
        <Link href="/confidentialite" className="text-foreground underline underline-offset-4">
          {chrome.links.confidentialite}
        </Link>
        .
      </p>
    </div>
  );
}
