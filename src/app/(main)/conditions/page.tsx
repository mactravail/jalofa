import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: `Conditions générales d'utilisation de ${APP_NAME} : règles communes, conditions pour les clients et conditions pour les tailleurs et vendeurs.`,
};

const LAST_UPDATED = "25 juillet 2026";

type Clause = {
  title: string;
  body: string;
  /** Puces optionnelles, affichées sous le paragraphe. */
  list?: string[];
};

type Part = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: Clause[];
};

const PARTS: Part[] = [
  // ---------------------------------------------------------------------------
  // Dispositions communes
  // ---------------------------------------------------------------------------
  {
    id: "commun",
    eyebrow: "À lire par tous",
    title: "Dispositions communes",
    intro: `Ces règles s'appliquent à toute personne qui utilise ${APP_NAME}, qu'elle soit cliente ou professionnelle. Elles posent les principes qui font la confiance sur la plateforme : des prix clairs, un paiement unique et un tiers de confiance qui protège chacun.`,
    sections: [
      {
        title: "1. Objet et acceptation",
        body: `${APP_NAME} est une place de marché en ligne qui met en relation des clients, des tailleurs et des vendeurs de tissus — et, à l'avenir, des créateurs — pour la confection et l'achat de vêtements sur mesure au Sénégal. La confection est réalisée par des tailleurs indépendants ; les tissus sont vendus par des vendeurs indépendants. ${APP_NAME} fournit l'outil de commande, le paiement sécurisé, la messagerie et le suivi, et intervient comme tiers de confiance entre les parties. En créant un compte ou en utilisant le site, vous reconnaissez avoir lu et accepté les présentes conditions. Elles se lisent en deux temps : cette partie commune, puis la partie qui correspond à votre profil — « Clients » ou « Tailleurs et vendeurs ». Si vous n'acceptez pas ces conditions, n'utilisez pas la plateforme.`,
      },
      {
        title: "2. Définitions",
        body: "Pour lire ces conditions sans ambiguïté :",
        list: [
          `« Plateforme » ou « ${APP_NAME} » : le site et l'application, ainsi que les services associés.`,
          "« Client » : toute personne qui commande un vêtement, une prestation de couture ou du tissu.",
          "« Professionnel » ou « Pro » : un tailleur ou un vendeur de tissus inscrit avec un abonnement.",
          "« Commande » : un achat passé et payé sur la plateforme (vêtement complet, tissu seul, ou couture sur tissu fourni).",
          `« Fonds en attente » (séquestre) : la somme payée par le client, conservée par ${APP_NAME} avant d'être reversée au professionnel.`,
          `« Manquement avéré » : un manquement d'un professionnel constaté par ${APP_NAME} après vérification, preuves à l'appui et les deux parties entendues.`,
        ],
      },
      {
        title: "3. Transparence des prix — le prix affiché est le prix payé",
        body: `La transparence totale est la règle de ${APP_NAME}. Le client doit toujours savoir à l'avance, et exactement, combien il va payer.`,
        list: [
          "Chaque tailleur fixe et publie ses prix ; chaque vendeur affiche le prix de ses tissus.",
          "Avant de confirmer, le client voit le montant total et son détail (tissu, confection, livraison et, le cas échéant, frais de service).",
          "Aucun frais caché. Le client paie une seule fois, sur la plateforme, et plus rien ne lui est réclamé ensuite pour cette commande.",
          `Toute demande d'argent en dehors de ${APP_NAME} — de la main à la main, sur un autre numéro, « pour aller plus vite » — est strictement interdite et constitue une faute grave.`,
        ],
      },
      {
        title: "4. Paiement unique et sécurisé",
        body: `Les paiements s'effectuent sur la plateforme par Orange Money, Wave, Free Money ou carte bancaire, en FCFA. Le client règle sa commande en une seule fois. La somme n'est pas versée immédiatement au professionnel : elle est d'abord conservée par ${APP_NAME} (voir l'article suivant). Les coordonnées bancaires complètes ne sont pas stockées par la plateforme.`,
      },
      {
        title: "5. Fonds en attente : reversement 5 jours après la livraison",
        body: `Pour protéger le client contre la fraude et lui laisser le temps de vérifier ce qu'il a reçu, la somme payée est conservée par ${APP_NAME} en fonds en attente. Elle est reversée au professionnel 5 jours après la confirmation de la livraison, à condition qu'aucune réclamation ne soit ouverte. Si une réclamation légitime est en cours, le reversement est suspendu jusqu'à sa résolution ; s'il est établi que le professionnel est en tort, la somme peut être remboursée au client au lieu d'être versée. Ce délai de 5 jours est une garantie pour le client comme pour le professionnel honnête.`,
      },
      {
        title: "6. Dire et faire seulement ce que l'on peut faire",
        body: `${APP_NAME} repose sur la parole tenue. Chacun s'engage à être sincère : un professionnel ne propose et n'accepte que ce qu'il sait réellement faire, dans les délais annoncés et tel qu'il l'a décrit ; un client fournit des informations exactes et n'abuse pas des garanties. Mieux vaut refuser une commande que promettre puis décevoir. Ce principe est détaillé, pour les professionnels, dans la Partie 2.`,
      },
      {
        title: "7. Signalement, médiation et litiges",
        body: `En cas de problème (retard, non-conformité, description trompeuse, comportement déplacé), la partie concernée le signale à ${APP_NAME} depuis son espace personnel. ${APP_NAME} examine les preuves, entend les deux parties et tranche en tiers de confiance : rappel à l'ordre, remboursement, retour du tissu, ou sanction du professionnel selon le barème de la Partie 2. Les décisions de ${APP_NAME} en matière de médiation sont prises de bonne foi et dans l'intérêt d'un marché sain.`,
      },
      {
        title: "8. Sanctions",
        body: `Le non-respect de ces conditions expose son auteur à des mesures proportionnées : avertissement, retrait d'un contenu, suspension temporaire, puis exclusion définitive de la plateforme. Le barème applicable aux tailleurs et vendeurs figure à la Partie 2. Les clients qui abusent de la plateforme (fausses réclamations, avis mensongers, fraude au paiement) s'exposent également à la suspension ou à la fermeture de leur compte.`,
      },
      {
        title: "9. Contenus et propriété intellectuelle",
        body: `La marque, le logo, les textes et l'interface de ${APP_NAME} lui appartiennent. Les photos de modèles et de tissus restent la propriété des professionnels qui les publient ; en les mettant en ligne, ceux-ci garantissent en détenir les droits et accordent à ${APP_NAME} le droit de les afficher pour les besoins du service. Toute reproduction non autorisée des contenus de la plateforme est interdite.`,
      },
      {
        title: "10. Rôle d'intermédiaire et responsabilité",
        body: `${APP_NAME} met en relation et sécurise les échanges, mais ne confectionne pas les vêtements et ne fabrique pas les tissus. La qualité de la confection relève du tailleur choisi ; la conformité du tissu relève du vendeur. ${APP_NAME} s'efforce d'assurer l'exactitude des informations publiées et le bon fonctionnement du site, sans pouvoir en garantir l'absence totale d'erreurs ou d'interruptions. En cas de litige, ${APP_NAME} intervient selon les présentes conditions.`,
      },
      {
        title: "11. Données personnelles",
        body: `${APP_NAME} traite vos données conformément à sa politique de confidentialité, qui détaille les informations collectées, leur usage et vos droits. La protection des mesures corporelles y fait l'objet d'un soin particulier.`,
      },
      {
        title: "12. Modification des conditions, droit applicable et contact",
        body: `${APP_NAME} peut faire évoluer ces conditions ; la version en vigueur est celle publiée sur cette page, avec sa date de mise à jour. Les présentes conditions sont régies par le droit sénégalais. Pour toute question, contactez l'équipe depuis votre espace personnel ou à mactravail23@gmail.com.`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Partie 1 — Clients
  // ---------------------------------------------------------------------------
  {
    id: "clients",
    eyebrow: "Partie 1",
    title: "Conditions pour les clients",
    intro: `En tant que client, vous commandez un vêtement sur mesure, du tissu ou une prestation de couture. Voici vos droits — dont le remboursement en cas de tromperie — et vos obligations.`,
    sections: [
      {
        title: "A1. Votre compte client",
        body: "La création d'un compte client est gratuite. Vous vous engagez à fournir des informations exactes (nom, téléphone, adresse) et à garder votre mot de passe confidentiel. Votre compte est personnel ; vous êtes responsable des commandes passées depuis celui-ci.",
      },
      {
        title: "A2. Passer une commande",
        body: "Vous choisissez un modèle (ou du tissu), un tailleur ou un vendeur, puis renseignez vos mesures (au centimètre ou en taille standard). Avant de payer, la plateforme vous affiche le récapitulatif complet : ce que vous commandez, chez qui, le délai annoncé et le prix total détaillé. La confirmation et le paiement valent commande ferme, et déclenchent la mise en fonds en attente.",
      },
      {
        title: "A3. Un prix tout compris, payé une seule fois",
        body: `Le montant affiché avant paiement est le montant définitif pour cette commande. Vous ne paierez rien de plus par la suite : ni supplément, ni frais caché, ni « complément » réclamé par le tailleur ou le vendeur. Si un professionnel vous demande de l'argent en dehors de ${APP_NAME}, refusez et signalez-le : c'est interdit.`,
      },
      {
        title: "A4. Délais de confection (12 jours maximum)",
        body: "Le tailleur s'engage sur un délai, affiché avant votre paiement, qui ne peut dépasser 12 jours pour la confection (hors délai de livraison lié à votre ville). Vous suivez l'avancement de votre commande étape par étape depuis votre espace. Si le tailleur ne peut pas tenir ce délai, il doit refuser la commande dès le départ plutôt que de l'accepter et vous faire attendre.",
      },
      {
        title: "A5. Livraison et vérification à réception",
        body: "À la réception, vérifiez que ce que vous recevez correspond bien à votre commande : le bon modèle, les bonnes finitions, et — pour un tissu — la bonne matière, la bonne couleur et le bon métrage. En cas de problème, ne tardez pas : ouvrez une réclamation pendant le délai de fonds en attente de 5 jours.",
      },
      {
        title: "A6. Votre droit de réclamation et de remboursement",
        body: "Vous pouvez ouvrir une réclamation et être remboursé lorsque le professionnel n'a pas tenu parole, notamment :",
        list: [
          "le tailleur a menti sur ce qu'il savait faire (il a accepté un modèle qu'il ne maîtrise pas et l'a raté) ;",
          "on vous livre autre chose que ce que vous avez commandé (modèle, coupe, couleur ou finitions différents) ;",
          "la confection présente un défaut avéré ou n'est pas conforme aux mesures fournies ;",
          "la commande n'est jamais livrée, ou l'est très au-delà du délai annoncé.",
        ],
      },
      {
        title: "A7. Retour d'un tissu mal décrit",
        body: `Si un vendeur a décrit un tissu avec des informations fausses — matière, composition, couleur, motif, largeur, métrage/longueur ou qualité qui ne correspondent pas à ce que vous recevez — vous pouvez retourner le tissu et être remboursé. La description mensongère d'un tissu est à la charge du vendeur et constitue un manquement de sa part.`,
      },
      {
        title: "A8. Comment faire une réclamation",
        body: `Ouvrez la réclamation depuis la commande concernée, dans votre espace, pendant le délai de fonds en attente de 5 jours suivant la livraison. Décrivez le problème et joignez des photos si possible. Ces preuves permettent à ${APP_NAME} d'examiner votre dossier, d'entendre le professionnel et de trancher rapidement.`,
      },
      {
        title: "A9. Remboursements",
        body: `Lorsqu'une réclamation est fondée, ${APP_NAME} procède au remboursement — total ou partiel selon le préjudice — par le moyen de paiement utilisé, ou organise le retour du tissu. Comme la somme est encore en fonds en attente, le remboursement est direct et n'a pas à être « récupéré » auprès du professionnel. Un vêtement sur mesure correctement confectionné d'après vos mesures ne peut pas être remboursé pour simple changement d'avis ; il l'est en cas de défaut, de non-conformité ou de tromperie avérés.`,
      },
      {
        title: "A10. Vos obligations",
        body: "Pour que tout se passe bien, vous vous engagez à :",
        list: [
          "fournir des mesures et une adresse de livraison exactes ;",
          "communiquer avec courtoisie avec le tailleur ou le vendeur ;",
          "ne pas déposer de fausse réclamation ni d'avis mensonger ;",
          "ne pas tenter de payer en dehors de la plateforme ni de contourner les frais.",
        ],
      },
      {
        title: "A11. Avis clients",
        body: "Après une commande, vous pouvez laisser un avis honnête, éventuellement accompagné de photos. Les avis aident les autres clients et récompensent les bons professionnels. Les avis diffamatoires, faux ou hors sujet peuvent être retirés.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Partie 2 — Tailleurs & vendeurs
  // ---------------------------------------------------------------------------
  {
    id: "pros",
    eyebrow: "Partie 2",
    title: "Conditions pour les tailleurs et vendeurs",
    intro: `En tant que professionnel, vous exercez sur ${APP_NAME} avec un abonnement. Vous vous engagez à la sincérité et au respect des délais. Ces règles — et le barème de sanctions qui les accompagne — protègent les clients et l'ensemble des professionnels sérieux. Le principe est simple : faites et dites seulement ce que vous pouvez faire.`,
    sections: [
      {
        title: "B1. S'inscrire comme professionnel",
        body: `Pour vendre sur ${APP_NAME}, vous créez un compte professionnel (tailleur, vendeur de tissus, ou les deux) et souscrivez un abonnement. Votre inscription est validée par l'administration avant l'ouverture de votre boutique. Vous garantissez l'exactitude des informations de votre activité (nom de boutique, ville, catalogue, prix).`,
      },
      {
        title: "B2. Abonnements et commissions",
        body: `Vous choisissez votre formule sur la page des abonnements : le plan Gratuit (sans abonnement mensuel, mais avec une commission par vente) ou un plan payant Standard ou Premium (sans commission). Les abonnements payants sont sans engagement et résiliables à tout moment ; ils se règlent par Wave. Les tarifs et commissions en vigueur sont ceux affichés sur la page « Abonnements ». En cas d'exclusion pour faute, l'abonnement déjà payé n'est pas remboursé.`,
      },
      {
        title: "B3. Vos engagements fondamentaux",
        body: "En exerçant sur la plateforme, vous vous engagez à :",
        list: [
          "ne proposer et n'accepter que ce que vous savez réellement réaliser ou fournir ;",
          "afficher des prix clairs et complets, sans frais caché ;",
          "respecter le délai que vous annoncez, dans la limite de 12 jours pour la confection ;",
          "décrire vos tissus et vos modèles avec exactitude ;",
          "communiquer avec vos clients et honorer les commandes acceptées ;",
          `n'exiger aucun paiement en dehors de ${APP_NAME}.`,
        ],
      },
      {
        title: "B4. Publier des prix clairs (obligation)",
        body: "Chaque tailleur doit écrire ses prix ; chaque vendeur doit afficher le prix de ses tissus. Le client doit savoir à l'avance combien il va payer. Il est interdit d'annoncer un prix puis d'en réclamer un autre, ou d'ajouter un supplément après commande. Aucun prix caché : le prix affiché engage le professionnel.",
      },
      {
        title: "B5. Respecter le délai (12 jours maximum)",
        body: "Vous vous engagez sur un délai réaliste, plafonné à 12 jours pour la confection. Tenez le client informé en mettant à jour le statut de la commande. Si vous ne pouvez pas tenir le délai ou réaliser la commande, refusez-la dès le départ (motifs prévus : « Je ne sais pas faire ce modèle », « Je suis trop chargé », « Je ne peux pas livrer dans les délais ») plutôt que de l'accepter et de faire attendre le client.",
      },
      {
        title: "B6. Tailleurs : ne proposer que ce que vous savez faire",
        body: "Ne prétendez jamais savoir réaliser un modèle que vous ne maîtrisez pas. Un tailleur qui affirme pouvoir faire un modèle, l'accepte, puis livre un travail raté ou ne le livre pas, commet un manquement. Si un modèle dépasse votre savoir-faire, refusez la commande : c'est votre droit, et c'est mieux qu'un client déçu.",
      },
      {
        title: "B7. Vendeurs : décrire les tissus avec exactitude",
        body: "La fiche d'un tissu doit être exacte : matière et composition, couleur, motif, largeur, métrage/longueur, qualité et prix. Un tissu décrit avec des informations fausses peut être retourné par le client, à vos frais, et constitue un manquement. Photographiez et décrivez vos tissus tels qu'ils sont réellement.",
      },
      {
        title: "B8. Encaissement : reversement 5 jours après la livraison",
        body: `L'argent d'une commande ne vous est pas versé immédiatement. ${APP_NAME} le conserve en fonds en attente, puis vous le reverse 5 jours après la confirmation de livraison, en l'absence de réclamation. Ce délai protège les clients contre la fraude et vous protège, vous, contre les contestations : une commande honnête et livrée conforme est payée sans encombre. Si une réclamation fondée aboutit, la somme peut être remboursée au client plutôt que versée.`,
      },
      {
        title: "B9. Barème des sanctions",
        body: "Lorsqu'un manquement avéré est constaté — mensonge sur un modèle, non-respect du délai de 12 jours, tissu faussement décrit, livraison non conforme — les sanctions s'appliquent de façon progressive :",
        list: [
          "1ᵉʳ manquement avéré : avertissement écrit.",
          "2ᵉ manquement avéré : second avertissement, avec réduction de votre visibilité dans le catalogue.",
          "3ᵉ manquement avéré : suspension du compte pour au moins une semaine (fiche masquée, plus aucune nouvelle commande).",
          `Récidive après la suspension : bannissement définitif de ${APP_NAME}, sans remboursement de l'abonnement en cours.`,
        ],
      },
      {
        title: "B10. Ce qu'est un « manquement avéré »",
        body: `Toutes les plaintes ne comptent pas : seul un manquement vérifié par ${APP_NAME} entre dans le barème. Face à une réclamation, ${APP_NAME} examine les preuves et entend les deux parties avant de décider. Vous êtes ainsi protégé contre les réclamations abusives ou de mauvaise foi. En revanche, un client lésé qui se plaint une, deux, trois fois de faits vérifiés déclenche l'escalade des sanctions.`,
      },
      {
        title: "B11. Fautes graves : sanction immédiate",
        body: `Certaines fautes justifient une suspension ou un bannissement immédiat, sans passer par tous les paliers : exiger un paiement en dehors de la plateforme, la fraude, l'usurpation d'identité, la publication de contenus d'autrui, ou tout comportement mettant en danger un client. Là encore, l'abonnement déjà payé n'est pas remboursé.`,
      },
      {
        title: "B12. Effet de la suspension et du bannissement",
        body: "Pendant une suspension, votre fiche est masquée et vous ne recevez plus de nouvelles commandes ; les commandes en cours doivent être menées à terme. En cas de bannissement, votre accès est fermé et votre abonnement n'est pas remboursé. Les sommes déjà dues pour des commandes honnêtement livrées et non contestées vous restent acquises : la sanction porte sur l'avenir, pas sur le travail correctement réalisé.",
      },
      {
        title: "B13. Résiliation et départ volontaire",
        body: "Vous pouvez quitter la plateforme et résilier votre abonnement à tout moment. Vous devez toutefois honorer les commandes déjà acceptées et en cours avant votre départ. Les fonds en attente vous concernant sont réglés selon les règles habituelles.",
      },
      {
        title: "B14. Obligations légales du professionnel",
        body: `Vous exercez en tant que professionnel indépendant. Vous êtes responsable du respect de vos obligations légales, fiscales et réglementaires liées à votre activité. ${APP_NAME} est un intermédiaire technique et un tiers de confiance ; il n'est pas votre employeur.`,
      },
    ],
  },
];

function Clauses({ sections }: { sections: Clause[] }) {
  return (
    <div className="mt-6 space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h3 className="text-base font-semibold">{section.title}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {section.body}
          </p>
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
  );
}

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="text-muted-foreground mt-3">
        Les règles de {APP_NAME}, en deux temps : d&apos;abord les dispositions
        communes à tous, puis les conditions propres aux clients et celles
        propres aux tailleurs et vendeurs.
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        Dernière mise à jour : {LAST_UPDATED}
      </p>

      {/* Sommaire */}
      <nav
        aria-label="Sommaire"
        className="bg-muted/40 mt-8 rounded-xl border p-5"
      >
        <p className="text-sm font-semibold">Sommaire</p>
        <ol className="mt-3 space-y-2 text-sm">
          {PARTS.map((part, index) => (
            <li key={part.id}>
              <a
                href={`#${part.id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {index + 1}. {part.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-14">
        {PARTS.map((part) => (
          <section key={part.id} id={part.id} className="scroll-mt-24">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              {part.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {part.title}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {part.intro}
            </p>
            <Clauses sections={part.sections} />
          </section>
        ))}
      </div>

      <p className="text-muted-foreground mt-14 border-t pt-8 text-sm">
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
