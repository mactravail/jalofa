import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, Scale, ShieldCheck, Smartphone, Store, Undo2 } from "lucide-react";

import { Price } from "@/components/cart/price";
import { COLLECTION_HEADING } from "@/components/catalog/collection-sections";
import { display } from "@/lib/display-font";
import { FREE_COMMISSION_RATE, getPlan, PAID_PLAN_ID } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

// Les sections de /tailleurs qui s'adressent aux deux publics : pourquoi un client
// passe par JALOFA, comment l'argent est gardé, pourquoi un tailleur nous rejoint.
// Le délai de reversement doit rester celui de /conditions (articles 5 et B8).

const PAID_PLAN = getPlan(PAID_PLAN_ID)!;
const COMMISSION_PCT = Math.round(FREE_COMMISSION_RATE * 100);

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
    text: "Il reçoit son argent 5 jours après la livraison, si le client ne signale aucun problème.",
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

/** Une offre : le prix en très grand, puis deux phrases. Même structure pour les deux. */
function OfferCard({
  name,
  amount,
  lines,
  href,
  cta,
  highlighted = false,
}: {
  name: string;
  amount: number;
  lines: React.ReactNode[];
  href: string;
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl p-6 md:p-10",
        highlighted ? "bg-orange-500 text-black" : "border border-white/20",
      )}
    >
      <p className={cn(display.className, "text-lg tracking-[0.15em] uppercase")}>{name}</p>
      <p className={cn(display.className, "mt-6 text-7xl leading-none md:text-8xl")}>
        {amount.toLocaleString("fr-FR")}
      </p>
      <p className={cn("mt-2 text-lg", highlighted ? "text-black/75" : "text-white/60")}>
        FCFA par mois
      </p>
      <div className="mt-8 mb-8 flex-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className={cn(
              "border-t py-4 text-lg leading-snug font-medium",
              highlighted ? "border-black/30" : "border-white/25",
            )}
          >
            {line}
          </p>
        ))}
      </div>
      <Link
        href={href}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition-colors",
          highlighted
            ? "border border-black hover:bg-black hover:text-white"
            : "border border-white hover:bg-white hover:text-black",
        )}
      >
        {cta}
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

export function WhyJalofa() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 md:px-8 md:pt-28">
      <h2 className={COLLECTION_HEADING}>Pourquoi passer par JALOFA</h2>
      <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
        {CLIENT_REASONS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="border-t border-white/25 pt-5">
            <Icon className="size-7" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-4 text-xl leading-snug font-medium tracking-tight">{title}</h3>
            <p className="text-muted-foreground mt-1 text-base">{text}</p>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-8 text-sm">
        <Link
          href="/faq#comment-ca-marche"
          className="hover:text-foreground underline underline-offset-4"
        >
          Voir tout le parcours de commande
        </Link>
      </p>
    </section>
  );
}

export function MoneyProtection() {
  return (
    <section className="relative mt-16 overflow-hidden bg-[#0e0e0e] md:mt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen"
        style={{ backgroundImage: CHARCOAL_GRAIN, backgroundSize: "220px 220px" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <h2 className={COLLECTION_HEADING}>L&apos;argent attend la livraison</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          Pour éviter les arnaques, des deux côtés.
        </p>
        <ol className="mt-10 grid gap-x-10 gap-y-8 md:mt-14 md:grid-cols-3">
          {MONEY_STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-white/25 pt-4">
              <span className={cn(display.className, "text-4xl tracking-[0.02em] md:text-5xl")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl leading-snug font-medium tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-base">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function JoinTailors() {
  return (
    <section id="rejoindre" className="scroll-mt-16">
      <div className="relative min-h-[26rem] overflow-hidden md:min-h-[34rem]">
        <Image
          src="/look/tailleur.jpg"
          alt="Pied-de-biche d'une machine à coudre sur un tissu noir"
          fill
          sizes="100vw"
          className="object-cover object-[30%_center] brightness-[0.8] md:object-center"
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 md:px-8 md:pb-12">
          <h2 className={cn(COLLECTION_HEADING, "max-w-3xl")}>Tailleur, rejoignez-nous</h2>
          <p className="mt-3 max-w-xl text-lg">
            Cousez. Nous nous occupons du paiement. L&apos;inscription est gratuite.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:px-8 md:pt-16 md:pb-28">
        <ul className="grid gap-x-10 gap-y-8 md:grid-cols-3">
          {TAILOR_REASONS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t border-white/25 pt-5">
              <Icon className="size-7" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-xl leading-snug font-medium tracking-tight">{title}</h3>
              <p className="text-muted-foreground mt-1 text-base">{text}</p>
            </li>
          ))}
        </ul>

        <h3 className={cn(COLLECTION_HEADING, "mt-16 md:mt-24 md:text-5xl")}>Nos deux offres</h3>
        <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
          Dans les deux cas : votre boutique, vos commandes et vos messages. Vous pouvez coudre et
          vendre du tissu.
        </p>

        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2">
          <OfferCard
            name="Gratuit"
            amount={0}
            lines={[
              "Rien à payer pour commencer.",
              `Nous prenons ${COMMISSION_PCT}% sur chaque vente.`,
            ]}
            href="/inscription?role=pro&offre=free"
            cta="Commencer gratuitement"
          />
          <OfferCard
            highlighted
            name={PAID_PLAN.name}
            amount={PAID_PLAN.monthlyPrice}
            lines={[
              <>
                Rien à payer aujourd&apos;hui. Nous prenons les{" "}
                <Price amount={PAID_PLAN.monthlyPrice} /> à votre première vente.
              </>,
              "0% de commission sur vos ventes.",
            ]}
            href="/inscription?role=pro&offre=premium"
            cta={`Choisir l'offre ${PAID_PLAN.name}`}
          />
        </div>
      </div>
    </section>
  );
}
