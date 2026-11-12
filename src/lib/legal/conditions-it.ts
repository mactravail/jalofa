import { FABRIC_SHIP_HOURS, PRO_RESPONSE_HOURS } from "@/lib/after-sale";
import { APP_NAME } from "@/lib/constants";
import type { LegalChrome, LegalPart } from "@/lib/legal/types";

/**
 * Condizioni generali d'uso — versione italiana di
 * `src/app/(main)/conditions/page.tsx`. Stessa struttura, stessi articoli : ogni
 * modifica del testo francese va riportata qui.
 */

export const CONDITIONS_CHROME_IT: LegalChrome = {
  metaTitle: "Condizioni generali d'uso",
  metaDescription: `Condizioni generali d'uso di ${APP_NAME}: regole comuni, condizioni per i clienti e condizioni per i sarti e i venditori.`,
  heading: "Condizioni generali d'uso",
  intro: `Le regole di ${APP_NAME}, in due tempi: prima le disposizioni comuni a tutti, poi le condizioni proprie dei clienti e quelle proprie dei sarti e dei venditori.`,
  updatedLabel: "Ultimo aggiornamento:",
  updated: "12 novembre 2026",
  toc: "Indice",
  seeAlso: "Vedi anche la nostra",
  and: "e le nostre",
  links: {
    conditions: "condizioni generali",
    confidentialite: "informativa sulla privacy",
    mentions: "note legali",
  },
};

export const CONDITIONS_PARTS_IT: LegalPart[] = [
  // ---------------------------------------------------------------------------
  // Disposizioni comuni
  // ---------------------------------------------------------------------------
  {
    id: "commun",
    eyebrow: "Da leggere per tutti",
    title: "Disposizioni comuni",
    intro: `Queste regole si applicano a chiunque utilizzi ${APP_NAME}, cliente o professionista. Fissano i principi su cui si basa la fiducia sulla piattaforma: prezzi chiari, un pagamento unico e un terzo di fiducia che protegge ciascuno.`,
    sections: [
      {
        title: "1. Oggetto e accettazione",
        body: `${APP_NAME} è un marketplace online che mette in contatto clienti, sarti e venditori di tessuti — e, in futuro, stilisti — per la confezione e l'acquisto di abiti su misura in Senegal. La confezione è realizzata da sarti indipendenti; i tessuti sono venduti da venditori indipendenti. ${APP_NAME} fornisce lo strumento d'ordine, il pagamento sicuro, la messaggistica e il monitoraggio, e interviene come terzo di fiducia tra le parti. Creando un account o utilizzando il sito, dichiari di aver letto e accettato le presenti condizioni. Si leggono in due tempi: questa parte comune, poi la parte che corrisponde al tuo profilo — «Clienti» oppure «Sarti e venditori». Se non accetti queste condizioni, non utilizzare la piattaforma.`,
      },
      {
        title: "2. Definizioni",
        body: "Per leggere queste condizioni senza ambiguità:",
        list: [
          `«Piattaforma» o «${APP_NAME}»: il sito e l'applicazione, nonché i servizi collegati.`,
          "«Cliente»: chiunque ordini un abito, un servizio di sartoria o del tessuto.",
          "«Professionista» o «Pro»: un sarto o un venditore di tessuti iscritto sulla piattaforma.",
          "«Ordine»: un acquisto effettuato e pagato sulla piattaforma (abito completo, solo tessuto, o confezione su tessuto fornito).",
          `«Fondi in attesa» (deposito a garanzia): la somma pagata dal cliente, custodita da ${APP_NAME} prima di essere versata al professionista.`,
          `«Inadempienza accertata»: un'inadempienza di un professionista constatata da ${APP_NAME} dopo verifica, sulla base di prove e dopo aver ascoltato entrambe le parti.`,
        ],
      },
      {
        title: "3. Trasparenza dei prezzi — il prezzo mostrato è il prezzo pagato",
        body: `La trasparenza totale è la regola di ${APP_NAME}. Il cliente deve sempre sapere in anticipo, ed esattamente, quanto pagherà.`,
        list: [
          "Ogni sarto fissa e pubblica i suoi prezzi; ogni venditore mostra il prezzo dei suoi tessuti.",
          "Prima di confermare, il cliente vede l'importo totale e il suo dettaglio (tessuto, confezione, consegna ed eventuali costi di servizio).",
          "Nessun costo nascosto. Il cliente paga una sola volta, sulla piattaforma, e per quell'ordine non gli viene chiesto più nulla, salvo il trasporto quando il pro ha indicato che è a carico del cliente (vedi articolo A5).",
          `Qualsiasi richiesta di denaro al di fuori di ${APP_NAME} — in contanti, su un altro numero, «per fare prima» — è severamente vietata e costituisce una colpa grave.`,
          `Il cliente evita di pagare al di fuori di ${APP_NAME}. Se lo fa comunque, è a suo rischio: ${APP_NAME} non è responsabile di quel denaro, non lo rimborsa e non interviene in caso di truffa.`,
        ],
      },
      {
        title: "4. Pagamento unico e sicuro",
        body: `I pagamenti si effettuano sulla piattaforma tramite Orange Money, Wave, Free Money o carta bancaria, in FCFA. Il cliente paga il suo ordine in un'unica soluzione. La somma non viene versata subito al professionista: viene prima custodita da ${APP_NAME} (vedi articolo seguente). I dati bancari completi non sono conservati dalla piattaforma.`,
      },
      {
        title: "5. Fondi in attesa: versamento 3 giorni dopo la consegna",
        body: `Per proteggere il cliente dalle frodi e lasciargli il tempo di verificare ciò che ha ricevuto, la somma pagata è custodita da ${APP_NAME} come fondi in attesa. Viene versata al professionista 3 giorni dopo la conferma della consegna, a condizione che non sia aperto alcun reclamo. Se è in corso un reclamo legittimo, il versamento è sospeso fino alla sua risoluzione; se risulta che il professionista ha torto, la somma può essere rimborsata al cliente invece di essere versata. Questo termine di 3 giorni è una garanzia sia per il cliente sia per il professionista onesto.`,
      },
      {
        title: "6. Dire e fare solo ciò che si è in grado di fare",
        body: `${APP_NAME} si basa sulla parola data. Ognuno si impegna a essere sincero: un professionista propone e accetta solo ciò che sa davvero fare, nei tempi annunciati e come lo ha descritto; un cliente fornisce informazioni esatte e non abusa delle garanzie. Meglio rifiutare un ordine che promettere e poi deludere. Questo principio è descritto in dettaglio, per i professionisti, nella Parte 2.`,
      },
      {
        title: "7. Segnalazione, mediazione e controversie",
        body: `In caso di problema (ritardo, non conformità, descrizione ingannevole, comportamento scorretto), la parte interessata lo segnala a ${APP_NAME} dal proprio spazio personale. ${APP_NAME} esamina le prove, ascolta entrambe le parti e decide come terzo di fiducia: richiamo, rimborso, restituzione del tessuto o sanzione del professionista secondo la tabella della Parte 2. Le decisioni di ${APP_NAME} in materia di mediazione sono prese in buona fede e nell'interesse di un mercato sano.`,
      },
      {
        title: "8. Sanzioni",
        body: `Il mancato rispetto di queste condizioni espone il suo autore a misure proporzionate: avvertimento, rimozione di un contenuto, sospensione temporanea, poi esclusione definitiva dalla piattaforma. La tabella applicabile ai sarti e ai venditori è riportata nella Parte 2. Anche i clienti che abusano della piattaforma (falsi reclami, recensioni false, frode nei pagamenti) rischiano la sospensione o la chiusura del proprio account.`,
      },
      {
        title: "9. Contenuti e proprietà intellettuale",
        body: `Il marchio, il logo, i testi e l'interfaccia di ${APP_NAME} gli appartengono. Le foto dei modelli e dei tessuti restano di proprietà dei professionisti che le pubblicano; mettendole online, questi garantiscono di detenerne i diritti e concedono a ${APP_NAME} il diritto di mostrarle per le esigenze del servizio. Qualsiasi riproduzione non autorizzata dei contenuti della piattaforma è vietata.`,
      },
      {
        title: "10. Ruolo di intermediario e responsabilità",
        body: `${APP_NAME} mette in contatto e rende sicuri gli scambi, ma non vende nulla, non consegna nulla, non confeziona gli abiti e non produce i tessuti. Ogni professionista fissa i suoi prezzi e si occupa della sua consegna: per ogni tessuto e ogni modello indica se è gratuita, e dove. La qualità della confezione dipende dal sarto scelto; la conformità del tessuto dipende dal venditore. ${APP_NAME} si impegna a garantire l'esattezza delle informazioni pubblicate e il buon funzionamento del sito, senza poter garantire la totale assenza di errori o interruzioni. In caso di controversia, ${APP_NAME} interviene secondo le presenti condizioni.`,
      },
      {
        title: "11. Dati personali",
        body: `${APP_NAME} tratta i tuoi dati secondo la sua informativa sulla privacy, che descrive le informazioni raccolte, il loro utilizzo e i tuoi diritti. La protezione delle misure corporee è oggetto di particolare attenzione.`,
      },
      {
        title: "12. Modifica delle condizioni, legge applicabile e contatti",
        body: `${APP_NAME} può modificare queste condizioni; la versione in vigore è quella pubblicata su questa pagina, con la data di aggiornamento. Le presenti condizioni sono regolate dal diritto senegalese. In caso di dubbi tra le versioni linguistiche, fa fede la versione francese. Per qualsiasi domanda, contatta il team dal tuo spazio personale o all'indirizzo mactravail23@gmail.com.`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Parte 1 — Clienti
  // ---------------------------------------------------------------------------
  {
    id: "clients",
    eyebrow: "Parte 1",
    title: "Condizioni per i clienti",
    intro: `Come cliente, ordini un abito su misura, del tessuto o un servizio di sartoria. Ecco i tuoi diritti — tra cui il rimborso in caso di inganno — e i tuoi obblighi.`,
    sections: [
      {
        title: "A1. Il tuo account cliente",
        body: "La creazione di un account cliente è gratuita. Ti impegni a fornire informazioni esatte (nome, telefono, indirizzo) e a mantenere riservata la tua password. Il tuo account è personale; sei responsabile degli ordini effettuati da esso.",
      },
      {
        title: "A2. Effettuare un ordine",
        body: "Scegli un modello (o un tessuto), un sarto o un venditore, poi inserisci le tue misure (in centimetri o in taglia standard). Prima di pagare, la piattaforma ti mostra il riepilogo completo: cosa ordini, da chi, i tempi annunciati e il prezzo totale dettagliato. La conferma e il pagamento valgono come ordine definitivo e attivano il deposito dei fondi in attesa.",
      },
      {
        title: "A3. Un prezzo tutto compreso, pagato una sola volta",
        body: `L'importo mostrato prima del pagamento è l'importo definitivo per quell'ordine. Non pagherai nulla in più al sarto o al venditore in seguito: nessun supplemento, nessun costo nascosto, nessuna «integrazione». Solo il trasporto può restare a tuo carico, se è indicato sul prodotto (articolo A5). Se un professionista ti chiede denaro al di fuori di ${APP_NAME}, rifiuta e segnalalo: è vietato.`,
      },
      {
        title: "A3 bis. Preventivi gratuiti",
        body: "Per un capo personalizzato, ogni sarto fissa liberamente il suo prezzo, su preventivo:",
        list: [
          "Chiedere un preventivo è sempre gratuito e senza impegno, tutte le volte che vuoi.",
          "Il preventivo compare nel tuo spazio, con il dettaglio: il tessuto, la consegna e il lavoro del sarto.",
          "Puoi modificare il tessuto o alcuni dettagli della tua richiesta e chiedere un nuovo preventivo. Sostituisce il precedente.",
          "Se accetti, paghi il totale in un'unica soluzione. Il sarto e il venditore di tessuto vengono quindi avvisati e iniziano il loro lavoro.",
        ],
      },
      {
        title: "A3 ter. Non pagare mai al di fuori del sito",
        body: `La tua protezione (fondi in attesa, reclamo, rimborso) vale solo per i pagamenti effettuati su ${APP_NAME}. Se paghi un sarto o un venditore al di fuori del sito e sei vittima di una truffa, di un ritardo o di un cattivo servizio, è sotto la tua sola responsabilità: ${APP_NAME} non ti rimborserà e non interverrà.`,
      },
      {
        title: "A3 quater. Le tue informazioni restano private",
        body: `Durante il preventivo, il sarto riceve il riepilogo della tua richiesta, un codice e il tuo indirizzo di consegna. Il tuo nome, il tuo telefono e la tua e-mail sono noti solo a ${APP_NAME}. Il sarto li riceve una volta pagato l'ordine, per consegnarti. Non indicare i tuoi recapiti nella nota dell'ordine: vengono nascosti.`,
      },
      {
        title: "A4. Tempi di confezione (massimo 12 giorni)",
        body: "Il sarto si impegna su un termine, mostrato prima del pagamento, che non può superare 12 giorni per la confezione (esclusi i tempi di consegna legati alla tua città). Segui l'avanzamento del tuo ordine passo dopo passo dal tuo spazio. Se il sarto non può rispettare questo termine, deve rifiutare l'ordine fin dall'inizio piuttosto che accettarlo e farti aspettare. Oltre una settimana di ritardo rispetto alla data promessa: puoi annullare l'ordine dal tuo spazio, finché l'abito non è partito, e vieni rimborsato per intero.",
      },
      {
        title: "A5. Consegna e verifica al ricevimento",
        body: `${APP_NAME} non consegna e non aggiunge alcun costo di consegna a un acquisto diretto. Per ogni tessuto e ogni modello, il professionista indica dove la consegna è gratuita, e questa informazione ti viene mostrata prima del pagamento. Fuori da questa zona, paghi direttamente il GP o il corriere: questo pagamento non passa da ${APP_NAME}, che non ne è responsabile. Al ricevimento, verifica che ciò che ricevi corrisponda al tuo ordine: il modello giusto, le finiture giuste e — per un tessuto — il materiale, il colore e il metraggio giusti. In caso di problema, non aspettare: apri un reclamo entro il termine dei fondi in attesa di 3 giorni.`,
      },
      {
        title: "A6. Il tuo diritto di reclamo e di rimborso",
        body: "Puoi aprire un reclamo ed essere rimborsato quando il professionista non ha mantenuto la parola data, in particolare:",
        list: [
          "il sarto ha mentito su ciò che sapeva fare (ha accettato un modello che non padroneggia e lo ha sbagliato);",
          "ti viene consegnato qualcosa di diverso da ciò che hai ordinato (modello, taglio, colore o finiture diversi);",
          "la confezione presenta un difetto accertato o non è conforme alle misure fornite;",
          "l'ordine non viene mai consegnato, o ha più di una settimana di ritardo rispetto al termine annunciato (vedi A4).",
        ],
      },
      {
        title: "A7. Restituzione di un tessuto descritto male",
        body: `Se un venditore ha descritto un tessuto con informazioni false — materiale, composizione, colore, motivo, larghezza, metraggio/lunghezza o qualità che non corrispondono a ciò che ricevi — puoi restituire il tessuto ed essere rimborsato. La descrizione falsa di un tessuto è a carico del venditore e costituisce un'inadempienza da parte sua.`,
      },
      {
        title: "A8. Come fare un reclamo",
        body: `Apri il reclamo dall'ordine interessato, nel tuo spazio, entro il termine dei fondi in attesa di 3 giorni dalla consegna. Descrivi il problema e allega foto, se possibile. Queste prove permettono a ${APP_NAME} di esaminare la tua pratica, ascoltare il professionista e decidere rapidamente.`,
      },
      {
        title: "A9. Rimborsi",
        body: `Quando un reclamo è fondato, ${APP_NAME} procede al rimborso — totale o parziale in base al danno — con il mezzo di pagamento utilizzato, oppure organizza la restituzione del tessuto. Poiché la somma è ancora nei fondi in attesa, il rimborso è diretto e non deve essere «recuperato» presso il professionista. Un abito su misura confezionato correttamente secondo le tue misure non può essere rimborsato per un semplice ripensamento; lo è in caso di difetto, non conformità o inganno accertati.`,
      },
      {
        title: "A10. I tuoi obblighi",
        body: "Perché tutto vada bene, ti impegni a:",
        list: [
          "fornire misure e un indirizzo di consegna esatti;",
          "comunicare con cortesia con il sarto o il venditore;",
          "non presentare falsi reclami né recensioni false;",
          "non tentare di pagare al di fuori della piattaforma né di aggirare i costi.",
        ],
      },
      {
        title: "A11. Recensioni dei clienti",
        body: "Dopo un ordine, puoi lasciare una recensione onesta, eventualmente accompagnata da foto. Le recensioni aiutano gli altri clienti e premiano i professionisti bravi. Le recensioni diffamatorie, false o fuori tema possono essere rimosse.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Parte 2 — Sarti e venditori
  // ---------------------------------------------------------------------------
  {
    id: "pros",
    eyebrow: "Parte 2",
    title: "Condizioni per i sarti e i venditori",
    intro: `Come professionista, lavori su ${APP_NAME} impegnandoti alla sincerità e al rispetto dei tempi. Queste regole — e la tabella delle sanzioni che le accompagna — proteggono i clienti e tutti i professionisti seri. Il principio è semplice: fai e di' solo ciò che sei in grado di fare.`,
    sections: [
      {
        title: "B1. Iscriversi come professionista",
        body: `Per vendere su ${APP_NAME}, crei un account professionale (sarto, venditore di tessuti, o entrambi): è la tua candidatura alla Selezione ${APP_NAME}. ${APP_NAME} sceglie i professionisti seri e qualificati (qualità delle creazioni, finiture, prezzi coerenti, servizio clienti, rispetto dei tempi) e può in qualsiasi momento chiudere la boutique di un professionista che non risponde più a questi criteri. Garantisci l'esattezza delle informazioni sulla tua attività (nome della boutique, città, catalogo, prezzi).`,
      },
      {
        title: "B2. Accesso PRO in regalo e offerte future",
        body: `Durante l'attuale fase di selezione, i professionisti selezionati da ${APP_NAME} beneficiano gratuitamente dell'accesso PRO: nessun abbonamento da pagare e nessuna commissione sulle loro vendite. Questa gratuità non è definitiva: in futuro, le offerte non saranno tutte gratuite. ${APP_NAME} potrà proporre, a seconda delle formule, un abbonamento mensile, un abbonamento annuale, oppure una formula a 0 FCFA con una commissione su ogni vendita. Le nuove offerte e i loro prezzi ti saranno presentati in anticipo e si applicheranno solo con il tuo consenso; se li rifiuti, potrai chiudere la tua boutique.`,
      },
      {
        title: "B3. I tuoi impegni fondamentali",
        body: "Lavorando sulla piattaforma, ti impegni a:",
        list: [
          "proporre e accettare solo ciò che sai davvero realizzare o fornire;",
          "mostrare prezzi chiari e completi, senza costi nascosti;",
          `rispondere a ogni nuovo ordine o richiesta di preventivo entro ${PRO_RESPONSE_HOURS} h (accettare o rifiutare);`,
          `venditori: spedire il tessuto entro ${FABRIC_SHIP_HOURS} h dal pagamento;`,
          "rispettare il termine che annunci, nel limite di 12 giorni per la confezione: oltre una settimana di ritardo, il cliente può annullare e viene rimborsato;",
          "descrivere i tuoi tessuti e i tuoi modelli con esattezza;",
          "comunicare con i tuoi clienti e onorare gli ordini accettati;",
          `non esigere alcun pagamento al di fuori di ${APP_NAME};`,
          "non cercare di contattare un cliente prima del suo pagamento: durante il preventivo, lavori a partire dal riepilogo, dal suo codice e dal suo indirizzo di consegna.",
        ],
      },
      {
        title: "B4. Pubblicare prezzi chiari (obbligo)",
        body: "Ogni sarto deve indicare i suoi prezzi; ogni venditore deve mostrare il prezzo dei suoi tessuti. Il cliente deve sapere in anticipo quanto pagherà. È vietato annunciare un prezzo e poi chiederne un altro, o aggiungere un supplemento dopo l'ordine. Nessun prezzo nascosto: il prezzo mostrato impegna il professionista.",
      },
      {
        title: "B5. Rispettare il termine (massimo 12 giorni)",
        body: "Ti impegni su un termine realistico, con un limite di 12 giorni per la confezione. Tieni informato il cliente aggiornando lo stato dell'ordine. Se non puoi rispettare il termine o realizzare l'ordine, rifiutalo fin dall'inizio (motivi previsti: «Non so fare questo modello», «Sono troppo carico», «Non posso consegnare nei tempi») piuttosto che accettarlo e far aspettare il cliente.",
      },
      {
        title: "B6. Sarti: proporre solo ciò che sai fare",
        body: "Non affermare mai di saper realizzare un modello che non padroneggi. Un sarto che afferma di poter fare un modello, lo accetta, poi consegna un lavoro sbagliato o non lo consegna, commette un'inadempienza. Se un modello supera le tue capacità, rifiuta l'ordine: è un tuo diritto, ed è meglio di un cliente deluso.",
      },
      {
        title: "B7. Venditori: descrivere i tessuti con esattezza",
        body: "La scheda di un tessuto deve essere esatta: materiale e composizione, colore, motivo, larghezza, metraggio/lunghezza, qualità e prezzo. Un tessuto descritto con informazioni false può essere restituito dal cliente, a tue spese, e costituisce un'inadempienza. Fotografa e descrivi i tuoi tessuti come sono realmente.",
      },
      {
        title: "B8. Incasso: versamento 3 giorni dopo la consegna",
        body: `Il denaro di un ordine non ti viene versato subito. ${APP_NAME} lo custodisce come fondi in attesa, poi te lo versa 3 giorni dopo la conferma della consegna, in assenza di reclami. Questo termine protegge i clienti dalle frodi e protegge te dalle contestazioni: un ordine onesto e consegnato conforme viene pagato senza problemi. Se un reclamo fondato viene accolto, la somma può essere rimborsata al cliente invece che versata.`,
      },
      {
        title: "B9. Tabella delle sanzioni",
        body: "Quando viene constatata un'inadempienza accertata — menzogna su un modello, mancato rispetto del termine di 12 giorni, tessuto descritto in modo falso, consegna non conforme — le sanzioni si applicano in modo progressivo:",
        list: [
          "1ª inadempienza accertata: avvertimento scritto.",
          "2ª inadempienza accertata: secondo avvertimento, con riduzione della tua visibilità nel catalogo.",
          "3ª inadempienza accertata: sospensione dell'account per almeno una settimana (scheda nascosta, nessun nuovo ordine).",
          `Recidiva dopo la sospensione: esclusione definitiva da ${APP_NAME}, senza rimborso dell'abbonamento in corso.`,
        ],
      },
      {
        title: "B10. Che cos'è un'«inadempienza accertata»",
        body: `Non tutti i reclami contano: entra nella tabella solo un'inadempienza verificata da ${APP_NAME}. Di fronte a un reclamo, ${APP_NAME} esamina le prove e ascolta entrambe le parti prima di decidere. Sei così protetto dai reclami abusivi o in malafede. Al contrario, un cliente danneggiato che si lamenta una, due, tre volte per fatti verificati fa scattare l'aumento delle sanzioni.`,
      },
      {
        title: "B11. Colpe gravi: sanzione immediata",
        body: `Alcune colpe giustificano una sospensione o un'esclusione immediata, senza passare da tutti i livelli: esigere un pagamento al di fuori della piattaforma, la frode, il furto d'identità, la pubblicazione di contenuti altrui, o qualsiasi comportamento che metta in pericolo un cliente. Anche in questo caso, l'abbonamento già pagato non viene rimborsato.`,
      },
      {
        title: "B12. Effetti della sospensione e dell'esclusione",
        body: "Durante una sospensione, la tua scheda è nascosta e non ricevi più nuovi ordini; gli ordini in corso devono essere portati a termine. In caso di esclusione, il tuo accesso viene chiuso e il tuo abbonamento non viene rimborsato. Le somme già dovute per ordini consegnati onestamente e non contestati restano tue: la sanzione riguarda il futuro, non il lavoro svolto correttamente.",
      },
      {
        title: "B13. Recesso e uscita volontaria",
        body: "Puoi lasciare la piattaforma e disdire il tuo abbonamento in qualsiasi momento. Devi però onorare gli ordini già accettati e in corso prima della tua uscita. I fondi in attesa che ti riguardano vengono regolati secondo le regole abituali.",
      },
      {
        title: "B14. Obblighi legali del professionista",
        body: `Lavori come professionista indipendente. Sei responsabile del rispetto dei tuoi obblighi legali, fiscali e normativi legati alla tua attività. ${APP_NAME} è un intermediario tecnico e un terzo di fiducia; non è il tuo datore di lavoro.`,
      },
    ],
  },
];
