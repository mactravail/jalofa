import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import {
  ChevronDown,
  CreditCard,
  Ruler,
  Scissors,
  Sparkles,
  Truck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Questions fréquentes"),
    description: t("Les réponses aux questions les plus courantes sur {app} : commandes, mesures, paiement, livraison et espaces pros.", { app: APP_NAME }),
  };
}

const STEPS = [
  {
    icon: Sparkles,
    title: "1. Choisissez",
    desc: "Sélectionnez un modèle, un style et un tissu parmi des centaines d'options — ou utilisez votre propre tissu.",
  },
  {
    icon: Scissors,
    title: "2. Choisissez un tailleur",
    desc: "Comparez les tailleurs, leurs prix, délais et avis, puis sélectionnez celui qui vous convient.",
  },
  {
    icon: Ruler,
    title: "3. Vos mesures",
    desc: "Renseignez vos mesures détaillées ou choisissez une taille standard (XS à XXXL).",
  },
  {
    icon: CreditCard,
    title: "4. Payez le professionnel",
    desc: "Vous payez le tissu à JALOFA (Wave 77 500 85 83) et la couture directement au tailleur, qui vous envoie son moyen de paiement.",
  },
  {
    icon: Truck,
    title: "5. Suivez et recevez",
    desc: "Suivez chaque étape de la confection et recevez votre tenue à domicile ou en boutique.",
  },
];

type QA = { q: string; a: string };
type Category = { title: string; items: QA[] };

const CATEGORIES: Category[] = [
  {
    title: "Commander",
    items: [
      {
        q: "Comment passer une commande sur mesure ?",
        a: "Choisissez un modèle, un style et un tissu (ou utilisez le vôtre), sélectionnez un tailleur, renseignez vos mesures puis confirmez : le tailleur vous envoie son moyen de paiement. Chaque étape est guidée dans l'application.",
      },
      {
        q: "Puis-je utiliser mon propre tissu ?",
        a: "Oui. Sur la page du vêtement, touchez « Sur mesure » puis « J'envoie mon tissu » : vous ne payez que la couture. Le tailleur vous dit combien de mètres il faut, et l'adresse de son atelier s'affiche dans votre commande dès que vous acceptez son devis.",
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
        a: "Le tissu se paie à JALOFA, seul vendeur de tissus du site (Wave 77 500 85 83). La couture se paie directement au tailleur : après votre commande (ou votre devis accepté), il vous envoie son moyen de paiement — Wave, Orange Money, Free Money…",
      },
      {
        q: "JALOFA prend-il une commission ?",
        a: "Non. JALOFA est gratuit : vous payez seulement le prix du professionnel.",
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
        a: "Les pièces confectionnées sur mesure ne sont ni reprises ni échangées, sauf défaut de confection avéré. Dans ce cas, écrivez-nous sur WhatsApp au 77 500 85 83 ou par e-mail à mactravail23@gmail.com.",
      },
    ],
  },
  {
    title: "Tailleurs",
    items: [
      {
        q: "Comment devenir tailleur sur JALOFA ?",
        a: "Candidatez à la Sélection JALOFA en créant un compte pro tailleur. Les tissus sont vendus par JALOFA et envoyés à votre atelier : vous vous concentrez sur la couture. Vous accédez aussitôt à votre espace pour publier votre catalogue et recevoir des commandes. JALOFA garde les professionnels sérieux et qualifiés : qualité des créations, finitions soignées, prix justes, service client sérieux, délais respectés.",
      },
      {
        q: "Combien ça coûte de vendre sur JALOFA ?",
        a: "Rien. Les professionnels sélectionnés par JALOFA ont l'accès PRO offert : 0 FCFA, sans commission sur leurs ventes. Si JALOFA propose un jour une offre payante, elle vous sera présentée à l'avance et vous serez libre de l'accepter ou non. Vos clients vous paient directement : vous leur envoyez votre moyen de paiement (Orange Money, Wave, Free Money…).",
      },
      {
        q: "Comment est fixé le prix d'une tenue ?",
        a: "Chaque modèle affiche un prix « à partir de ». Si vous l'avez en prêt-à-porter et que le client le prend tel quel, il paie ce prix. S'il personnalise la tenue, vous recevez sa demande et lui envoyez un devis avec le vrai prix ; il accepte, puis paie.",
      },
    ],
  },
];

export default async function FaqPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("Questions fréquentes")}
      </h1>
      <p className="text-muted-foreground mt-3">
        {t("Tout ce qu'il faut savoir pour commander votre tenue sur mesure sur {app}.", { app: APP_NAME })}
      </p>

      <section id="comment-ca-marche" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold">{t("Comment ça marche")}</h2>
        <div className="mt-4 space-y-6">
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-4">
              <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                <s.icon className="size-6" />
              </span>
              <div>
                <h3 className="font-semibold">{t(s.title)}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{t(s.desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-10">
        {CATEGORIES.map((category) => (
          <section key={category.title}>
            <h2 className="text-lg font-semibold">{t(category.title)}</h2>
            <div className="mt-3 divide-y rounded-xl border">
              {category.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {t(item.q)}
                    <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed">
                    {t(item.a)}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="bg-muted/40 mt-12 rounded-2xl border p-6 text-center">
        <h2 className="text-lg font-semibold">{t("Prêt à commencer ?")}</h2>
        <div className="mt-4">
          <Link href="/modeles" className={cn(buttonVariants({ size: "lg" }), "h-11 text-base")}>
            <Scissors className="size-4" /> {t("Créer ma tenue")}
          </Link>
        </div>
      </div>
    </div>
  );
}
