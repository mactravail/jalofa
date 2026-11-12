import Image from "next/image";
import Link from "@/components/i18n/link";
import {
  ArrowRight,
  Check,
  Eye,
  Scale,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Undo2,
} from "lucide-react";

import { COLLECTION_HEADING } from "@/components/catalog/collection-sections";
import { display } from "@/lib/display-font";
import {
  SELECTION_CRITERIA,
  SELECTION_CTA,
  SELECTION_SUBTITLE,
  SELECTION_TITLE,
} from "@/lib/selection";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// Les sections de /tailleurs qui s'adressent aux deux publics : pourquoi un client
// passe par JALOFA, comment l'argent est gardé, pourquoi un tailleur nous rejoint.
// Le délai de reversement doit rester celui de /conditions (articles 5 et B8).

/** Le grain du fond charbon : un bruit SVG léger, sans fichier image à charger. */
const CHARCOAL_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.2 0 0 0 -0.95'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

const CLIENT_REASONS = [
  {
    icon: ShieldCheck,
    title: "Votre argent est protégé",
    text: "Le tailleur est payé seulement après la livraison.",
  },
  {
    icon: Scale,
    title: "Vous comparez",
    text: "Les prix, les délais et les avis de chaque tailleur. Vous décidez.",
  },
  {
    icon: Eye,
    title: "Vous suivez votre habit",
    text: "Vous voyez chaque étape sur votre téléphone.",
  },
  {
    icon: Undo2,
    title: "Parole non tenue ? Remboursé",
    text: "Grand retard, défaut, mauvais habit : ouvrez une réclamation.",
  },
];

const MONEY_STEPS = [
  {
    title: "Le client paie",
    text: "Il paie sur JALOFA, avant que le tailleur commence.",
  },
  {
    title: "JALOFA garde l'argent",
    text: "Le tailleur coud sans crainte : le client a déjà payé. Le client est tranquille : son argent n'est pas encore parti.",
  },
  {
    title: "Livré ? Le tailleur est payé",
    text: "Il reçoit son argent 3 jours après la livraison, si le client ne signale aucun problème.",
  },
];

const TAILOR_REASONS = [
  {
    icon: Store,
    title: "Votre boutique en ligne",
    text: "Vos créations et vos prix, visibles par les clients de JALOFA.",
  },
  {
    icon: ShieldCheck,
    title: "Plus de client qui disparaît",
    text: "Le client a déjà payé avant que vous coupiez le tissu.",
  },
  {
    icon: Smartphone,
    title: "Tout sur votre téléphone",
    text: "Vos commandes, vos messages et vos livraisons.",
  },
];

/**
 * Sélection JALOFA (cf. `selection.ts`) : une seule formule, l'accès PRO
 * offert — ni prix habituel, ni durée, ni commission affichés.
 */
async function SelectionCard() {
  const t = await getT();
  return (
    <div className="relative flex flex-col rounded-xl bg-orange-500 p-6 text-black md:p-10">
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-bold tracking-wide text-orange-400 uppercase md:left-10">
        <Star aria-hidden className="size-3.5 fill-current" />
        {t("Sélection JALOFA")}
      </span>
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className={cn(display.className, "text-lg tracking-[0.15em] uppercase")}>
            {t("Accès PRO offert")}
          </p>
          <h3 className="mt-3 max-w-2xl text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            {t(SELECTION_TITLE)}
          </h3>
          <p className="mt-4 max-w-2xl text-lg text-black/75">{t(SELECTION_SUBTITLE)}</p>
        </div>
        <p className={cn(display.className, "text-7xl leading-none whitespace-nowrap md:text-8xl")}>
          0 <span className="text-3xl md:text-4xl">FCFA</span>
        </p>
      </div>
      <p className="mt-8 text-lg font-semibold">{t("Ce que nous recherchons :")}</p>
      <ul className="mt-2 mb-8 grid gap-x-10 md:grid-cols-2">
        {SELECTION_CRITERIA.map((line) => (
          <li key={line} className="flex items-start gap-3 border-t border-black/30 py-4">
            <Check className="mt-1 size-5 shrink-0" aria-hidden />
            <span className="text-lg leading-snug font-semibold">{t(line)}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/inscription?role=pro"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-black px-6 text-base font-semibold transition-colors hover:bg-black hover:text-white md:w-auto md:self-start"
      >
        {t(SELECTION_CTA)}
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

export async function WhyJalofa() {
  const t = await getT();
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 md:px-8 md:pt-28">
      <h2 className={COLLECTION_HEADING}>{t("Pourquoi passer par JALOFA")}</h2>
      <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
        {CLIENT_REASONS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="border-t border-white/25 pt-5">
            <Icon className="size-7" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-4 text-xl leading-snug font-medium tracking-tight">{t(title)}</h3>
            <p className="text-muted-foreground mt-1 text-base">{t(text)}</p>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-8 text-sm">
        <Link
          href="/faq#comment-ca-marche"
          className="hover:text-foreground underline underline-offset-4"
        >
          {t("Voir tout le parcours de commande")}
        </Link>
      </p>
    </section>
  );
}

export async function MoneyProtection() {
  const t = await getT();
  return (
    <section className="relative mt-16 overflow-hidden bg-[#0e0e0e] md:mt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen"
        style={{ backgroundImage: CHARCOAL_GRAIN, backgroundSize: "220px 220px" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <h2 className={COLLECTION_HEADING}>{t("L'argent attend la livraison")}</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          {t("Pour éviter les arnaques, des deux côtés.")}
        </p>
        <ol className="mt-10 grid gap-x-10 gap-y-8 md:mt-14 md:grid-cols-3">
          {MONEY_STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-white/25 pt-4">
              <span className={cn(display.className, "text-4xl tracking-[0.02em] md:text-5xl")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl leading-snug font-medium tracking-tight">{t(step.title)}</h3>
              <p className="text-muted-foreground mt-1 text-base">{t(step.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function JoinTailors() {
  const t = await getT();
  return (
    <section id="rejoindre" className="scroll-mt-16">
      <div className="relative min-h-[26rem] overflow-hidden md:min-h-[34rem]">
        <Image
          src="/look/tailleur.jpg"
          alt={t("Pied-de-biche d'une machine à coudre sur un tissu noir")}
          fill
          sizes="100vw"
          className="object-cover object-[30%_center] brightness-[0.8] md:object-center"
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 md:px-8 md:pb-12">
          <h2 className={cn(COLLECTION_HEADING, "max-w-3xl")}>{t("Tailleur, rejoignez-nous")}</h2>
          <p className="mt-3 max-w-xl text-lg">
            {t("Cousez. Nous nous occupons du paiement. L'inscription est gratuite.")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:px-8 md:pt-16 md:pb-28">
        <ul className="grid gap-x-10 gap-y-8 md:grid-cols-3">
          {TAILOR_REASONS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t border-white/25 pt-5">
              <Icon className="size-7" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-xl leading-snug font-medium tracking-tight">{t(title)}</h3>
              <p className="text-muted-foreground mt-1 text-base">{t(text)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16 md:mt-24">
          <SelectionCard />
        </div>
      </div>
    </section>
  );
}
