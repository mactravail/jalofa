import { APP_NAME } from "@/lib/constants";
import type { LegalChrome, LegalClause } from "@/lib/legal/types";

/**
 * Informativa sulla privacy — versione italiana di
 * `src/app/(main)/confidentialite/page.tsx`. Ogni modifica del testo francese
 * va riportata qui.
 */

export const CONFIDENTIALITE_CHROME_IT: LegalChrome = {
  metaTitle: "Informativa sulla privacy",
  metaDescription: `Come ${APP_NAME} raccoglie, utilizza e protegge i tuoi dati personali, comprese le tue misure corporee.`,
  heading: "Informativa sulla privacy",
  intro: `Come ${APP_NAME} raccoglie, utilizza e protegge i tuoi dati personali, comprese le tue misure corporee.`,
  updatedLabel: "Ultimo aggiornamento:",
  updated: "25 luglio 2026",
  seeAlso: "Vedi anche le nostre",
  and: "e le nostre",
  links: {
    conditions: "condizioni generali",
    confidentialite: "informativa sulla privacy",
    mentions: "note legali",
  },
};

export const CONFIDENTIALITE_SECTIONS_IT: LegalClause[] = [
  {
    title: "1. Titolare del trattamento",
    body: `${APP_NAME} è titolare del trattamento dei dati personali raccolti sulla piattaforma. Per qualsiasi domanda sui tuoi dati o per esercitare i tuoi diritti, contattaci dal tuo spazio personale o all'indirizzo mactravail23@gmail.com.`,
  },
  {
    title: "2. Ambito di applicazione",
    body: `Questa informativa si applica a chiunque utilizzi ${APP_NAME}: clienti, sarti, venditori di tessuti e visitatori. Completa le nostre condizioni generali d'uso. Utilizzando la piattaforma, ne prendi conoscenza.`,
  },
  {
    title: "3. Dati che raccogliamo",
    body: "A seconda del tuo profilo e del tuo utilizzo, raccogliamo:",
    list: [
      "Identità e account: nome, password (conservata cifrata), ruolo (cliente, sarto, venditore).",
      "Recapiti: numero di telefono, indirizzo e-mail, indirizzi di consegna.",
      "Misure corporee: le misure che inserisci (in centimetri) o la taglia standard scelta.",
      "Ordini e pagamenti: storico degli ordini, importi, mezzo di pagamento utilizzato, stato delle consegne.",
      "Dati professionali (pro): nome della boutique, città, catalogo, prezzi, piano di abbonamento, informazioni per i versamenti.",
      "Contenuti che pubblichi: foto di modelli e tessuti, recensioni, messaggi scambiati nella messaggistica.",
      "Dati tecnici: cookie di sessione, registri di connessione, tipo di dispositivo — per la sicurezza e il buon funzionamento del sito.",
    ],
  },
  {
    title: "4. Perché utilizziamo i tuoi dati",
    body: "I tuoi dati servono solo a far funzionare il servizio:",
    list: [
      "creare e gestire il tuo account, e autenticarti;",
      "gestire, confezionare, seguire e consegnare i tuoi ordini;",
      "mettere in contatto clienti, sarti e venditori;",
      "gestire i pagamenti, i fondi in attesa e poi i versamenti;",
      "inviarti le notifiche relative ai tuoi ordini e al tuo account;",
      "prevenire le frodi, gestire i reclami e applicare le nostre condizioni;",
      "migliorare la piattaforma e rispettare i nostri obblighi legali.",
    ],
  },
  {
    title: "5. Base giuridica dei trattamenti",
    body: `Trattiamo i tuoi dati quando è necessario per fornire il servizio che ci chiedi (il tuo ordine, il tuo account), per rispettare i nostri obblighi legali (contabili e fiscali), sulla base del nostro legittimo interesse a rendere sicura la piattaforma e a prevenire le frodi, oppure sulla base del tuo consenso quando è richiesto. ${APP_NAME} tratta questi dati nel rispetto della normativa senegalese sulla protezione dei dati personali.`,
  },
  {
    title: "6. Le tue misure corporee",
    body: "Le tue misure sono dati sensibili che proteggiamo con particolare cura. Sono condivise solo con il sarto incaricato del tuo ordine, e solo per il tempo necessario alla sua realizzazione. Non vengono mai rivendute, né utilizzate a fini pubblicitari, né comunicate a terzi non coinvolti nel tuo ordine. Puoi aggiornarle o chiederne la cancellazione.",
  },
  {
    title: "7. Pagamenti",
    body: "I pagamenti (Orange Money, Wave, Free Money, carta bancaria) sono gestiti dai nostri fornitori di servizi di pagamento. I tuoi dati bancari completi non passano dai nostri server e non sono conservati dalla piattaforma. Conserviamo solo le informazioni necessarie per seguire l'ordine (importo, mezzo utilizzato, stato).",
  },
  {
    title: "8. Fondi in attesa e lotta contro le frodi",
    body: `Per proteggere clienti e professionisti, la somma di un ordine è custodita come fondi in attesa e poi versata al professionista 3 giorni dopo la consegna, in assenza di reclami. Per questo conserviamo le informazioni necessarie per seguire pagamenti, reclami e versamenti, e per individuare comportamenti fraudolenti.`,
  },
  {
    title: "9. Condivisione dei tuoi dati",
    body: `${APP_NAME} non vende i tuoi dati. Sono condivisi solo con:`,
    list: [
      `il sarto o il venditore interessato dal tuo ordine. Durante una richiesta di preventivo, riceve un codice, le tue misure e il tuo indirizzo di consegna: il tuo nome, il tuo telefono e la tua e-mail sono noti solo a ${APP_NAME}. Li riceve una volta pagato l'ordine, per consegnarti;`,
      "i nostri fornitori tecnici strettamente necessari: hosting, database, pagamento, consegna;",
      "le autorità competenti, solo quando la legge lo richiede.",
    ],
  },
  {
    title: "10. Hosting e trasferimenti fuori dal Senegal",
    body: "Il sito è ospitato da Vercel Inc. (Stati Uniti) e i dati sono conservati tramite Supabase. Alcuni dati possono quindi essere trattati fuori dal Senegal, presso fornitori che offrono garanzie di sicurezza adeguate. Limitiamo questi trasferimenti a quanto necessario al funzionamento del servizio.",
  },
  {
    title: "11. Durata di conservazione",
    body: "I tuoi dati sono conservati finché il tuo account è attivo, poi per la durata legale richiesta dai nostri obblighi contabili e fiscali. Le misure corporee sono conservate per il tempo necessario ai tuoi ordini e alla comodità d'uso, e cancellate su richiesta. I dati legati a frodi o controversie sono conservati per il tempo necessario a gestire la pratica.",
  },
  {
    title: "12. Sicurezza",
    body: `${APP_NAME} adotta misure tecniche e organizzative per proteggere i tuoi dati: cifratura delle password, accessi limitati, separazione dei dati per account. Nessuna piattaforma può garantire una sicurezza assoluta, ma ci impegniamo a proteggere le tue informazioni e a reagire rapidamente in caso di incidente.`,
  },
  {
    title: "13. I tuoi diritti",
    body: "Hai diritto di accesso, rettifica, opposizione, limitazione e cancellazione dei tuoi dati, nonché il diritto di ottenerne una copia. Puoi esercitare questi diritti dal tuo spazio personale o scrivendoci all'indirizzo mactravail23@gmail.com. Se ritieni che i tuoi diritti non siano rispettati, puoi rivolgerti alla Commission de Protection des Données Personnelles (CDP) del Senegal.",
  },
  {
    title: "14. Cookie",
    body: `${APP_NAME} utilizza cookie tecnici indispensabili al funzionamento del sito (sessione, carrello, preferenze). Nessun cookie pubblicitario di terze parti viene installato senza il tuo consenso. Puoi configurare il tuo browser per limitare i cookie, con il rischio di ridurre alcune funzionalità.`,
  },
  {
    title: "15. Recensioni, foto e contenuti pubblici",
    body: "Le recensioni che pubblichi, e le foto che le accompagnano, sono visibili agli altri utenti. Non pubblicare informazioni personali che vuoi mantenere private. I professionisti sono responsabili delle foto di modelli e tessuti che mettono online.",
  },
  {
    title: "16. Minori",
    body: `${APP_NAME} non è destinato ai minori di 18 anni senza il consenso di un rappresentante legale. Non raccogliamo consapevolmente i dati di un minore senza questo consenso.`,
  },
  {
    title: "17. Modifiche a questa informativa",
    body: "Possiamo modificare questa informativa. La versione in vigore è quella pubblicata su questa pagina, con la data di aggiornamento. In caso di modifiche importanti, te ne informeremo.",
  },
  {
    title: "18. Contatti",
    body: "Per qualsiasi domanda sui tuoi dati o su questa informativa, contatta il nostro team dal tuo spazio personale o all'indirizzo mactravail23@gmail.com.",
  },
];
