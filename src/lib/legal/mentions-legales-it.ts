import { APP_NAME } from "@/lib/constants";
import type { LegalChrome, LegalClause } from "@/lib/legal/types";

/**
 * Note legali — versione italiana di `src/app/(main)/mentions-legales/page.tsx`.
 * Ogni modifica del testo francese va riportata qui.
 */

export const MENTIONS_CHROME_IT: LegalChrome = {
  metaTitle: "Note legali",
  metaDescription: `Editore, hosting e informazioni legali della piattaforma ${APP_NAME}.`,
  heading: "Note legali",
  intro: `Editore, hosting e informazioni legali di ${APP_NAME}.`,
  seeAlso: "Vedi anche le nostre",
  and: "e la nostra",
  links: {
    conditions: "condizioni generali",
    confidentialite: "informativa sulla privacy",
    mentions: "note legali",
  },
};

export const MENTIONS_SECTIONS_IT: LegalClause[] = [
  {
    title: "Editore",
    body: `Il sito ${APP_NAME} è edito da ${APP_NAME}, piattaforma di sartoria su misura con sede in Africa. Per qualsiasi domanda, contatta il nostro team dal tuo spazio personale.`,
  },
  {
    title: "Direttore della pubblicazione",
    body: `Il direttore della pubblicazione è il rappresentante legale di ${APP_NAME}.`,
  },
  {
    title: "Hosting",
    body: "Il sito è ospitato da Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, Stati Uniti). I dati sono conservati tramite Supabase.",
  },
  {
    title: "Attività",
    body: `${APP_NAME} mette in contatto i clienti con sarti e venditori di tessuti per la confezione di abiti su misura. La piattaforma facilita l'ordine, il pagamento e il monitoraggio; la confezione è realizzata da sarti indipendenti.`,
  },
  {
    title: "Proprietà intellettuale",
    body: `Tutti i contenuti del sito (marchio, logo, testi, interfaccia) sono di proprietà di ${APP_NAME} o dei suoi partner. Le foto di modelli e tessuti restano di proprietà dei sarti e dei venditori che le pubblicano. Qualsiasi riproduzione senza autorizzazione è vietata.`,
  },
  {
    title: "Responsabilità",
    body: `${APP_NAME} si impegna a garantire l'esattezza delle informazioni pubblicate, senza garantire l'assenza di errori. La responsabilità della qualità della confezione spetta al sarto scelto; ${APP_NAME} interviene in caso di controversia secondo le sue condizioni generali.`,
  },
];
