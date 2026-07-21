import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  MessageCircle,
  Ruler,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import { TailorCard } from "@/components/catalog/tailor-card";
import { AtelierHero } from "@/components/home/atelier-hero";
import { FabricMarquee } from "@/components/home/fabric-marquee";
import { FemmeCollection } from "@/components/home/femme-collection";
import { FitShowcase } from "@/components/home/fit-showcase";
import { HommeCollection } from "@/components/home/homme-collection";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, PAYMENT_METHOD_LABELS, formatPrice } from "@/lib/constants";
import { getFabrics, getTailors } from "@/lib/data";
import { cn } from "@/lib/utils";

const FLOWS = [
  {
    icon: Scissors,
    title: "Vêtement complet",
    desc: "Choisissez un modèle, un tissu et un tailleur. Nous gérons tout, de la commande à la livraison.",
    href: "/modeles",
    cta: "Créer ma tenue",
  },
  {
    icon: ShoppingBag,
    title: "Tissu seul",
    desc: "Parcourez le catalogue, achetez au mètre et recevez votre tissu à la maison.",
    href: "/tissus",
    cta: "Acheter du tissu",
  },
  {
    icon: Ruler,
    title: "J'ai déjà mon tissu",
    desc: "Envoyez votre propre tissu à un tailleur et faites confectionner votre modèle.",
    href: "/modeles?type=own_fabric",
    cta: "Trouver un tailleur",
  },
];

const STEPS = [
  { icon: Sparkles, title: "Choisissez", desc: "Modèle, style et tissu parmi des centaines d'options." },
  { icon: Ruler, title: "Vos mesures", desc: "Saisie manuelle détaillée ou taille standard XS → XXXL." },
  { icon: Scissors, title: "Confection", desc: "Un tailleur qualifié réalise votre pièce sur mesure." },
  { icon: Truck, title: "Livraison", desc: "Suivez chaque étape et recevez votre tenue à domicile." },
];

// Témoignages mis en avant — repris des avis de démonstration (`REVIEWS` dans
// fixtures.ts), donc cohérents avec les fiches tailleurs publiques.
const TESTIMONIALS = [
  {
    quote: "Boubou impeccable, finitions soignées et livraison à l'heure. Merci !",
    name: "Bineta Gueye",
    context: "Grand boubou · Atelier Fatou Couture",
  },
  {
    quote: "La broderie est magnifique, exactement ce que je voulais.",
    name: "Ousmane Ba",
    context: "Broderie fine · Awa Design & Broderie",
  },
  {
    quote: "Deuxième commande, toujours aussi satisfaite. Je recommande vivement.",
    name: "Ndeye Fall",
    context: "Cliente fidèle · Dakar",
  },
];

const AVATAR_TONES = [
  "bg-primary/15 text-primary",
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground",
];

// Les 4 objections qui bloquent le plus l'achat de sur-mesure en ligne, avec
// les réponses réelles du produit (reprises / adaptées de la page FAQ).
const HOME_FAQ = [
  {
    q: "Et si mes mesures ne sont pas exactes ?",
    a: "La saisie est guidée champ par champ (en centimètres), ou vous choisissez une taille standard XS → XXXL. En cas de doute, votre tailleur vous contacte via le chat avant de couper le tissu, et vos mesures sont enregistrées pour les prochaines commandes.",
  },
  {
    q: "Puis-je utiliser mon propre tissu ?",
    a: "Oui. Au moment de choisir le tissu, sélectionnez « J'ai déjà mon tissu » : vous convenez alors avec le tailleur de la remise du tissu.",
  },
  {
    q: "Comment je paie, et est-ce sécurisé ?",
    a: "Orange Money, Wave, Free Money ou carte bancaire. Les paiements sont traités par nos prestataires sécurisés et vos coordonnées bancaires complètes ne sont jamais stockées par la plateforme.",
  },
  {
    q: "Combien de temps pour recevoir ma tenue ?",
    a: "Entre 6 et 12 jours selon le tailleur — le délai est affiché sur chaque profil avant de commander. Vous suivez ensuite chaque étape en temps réel : couture, contrôle qualité, expédition, livraison.",
  },
];

// Piliers de réassurance affichés juste avant l'appel à l'action final :
// uniquement des engagements que le produit tient réellement (pipeline de
// commande, chat, paiement, livraison).
const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé",
    desc: "Orange Money, Wave, Free Money ou carte — sans stockage de vos données bancaires.",
  },
  {
    icon: BadgeCheck,
    title: "Contrôle qualité",
    desc: "Chaque pièce est inspectée avant expédition, c'est une étape officielle de la commande.",
  },
  {
    icon: MessageCircle,
    title: "Chat direct",
    desc: "Échangez avec votre tailleur à chaque étape, du choix du tissu à la livraison.",
  },
  {
    icon: Truck,
    title: "Livraison suivie",
    desc: "À domicile ou en retrait boutique, avec un suivi en temps réel étape par étape.",
  },
];

function Stars({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

// En-tête de section éditorial : petit surtitre en capitales + titre serif.
function SectionHead({
  kicker,
  title,
  desc,
  align = "center",
}: {
  kicker: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-10", align === "center" ? "text-center" : "text-left")}>
      <span className="text-primary text-xs font-semibold tracking-[0.25em] uppercase">
        {kicker}
      </span>
      <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {desc && (
        <p
          className={cn(
            "text-muted-foreground mt-3 text-pretty",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [tailors, fabrics] = await Promise.all([getTailors(), getFabrics()]);

  // Preuve sociale calculée sur les données réelles (fixtures aujourd'hui,
  // Supabase demain) : note moyenne pondérée, volume d'avis, fourchettes de
  // prix et de délais. Valeurs de repli si le catalogue est vide.
  const reviewCount = tailors.reduce((sum, t) => sum + t.rating_count, 0);
  const avgRating = reviewCount
    ? tailors.reduce((sum, t) => sum + t.rating * t.rating_count, 0) / reviewCount
    : 4.8;
  const ratingLabel = avgRating.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const prices = tailors
    .map((t) => t.base_price)
    .filter((p): p is number => typeof p === "number");
  const minPrice = prices.length ? Math.min(...prices) : 10000;
  const days = tailors
    .map((t) => t.avg_delivery_days)
    .filter((d): d is number => typeof d === "number");
  const minDays = days.length ? Math.min(...days) : 6;
  const maxDays = days.length ? Math.max(...days) : 12;
  const featuredTailors = [...tailors].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const marqueeFabrics = fabrics.slice(0, 12);

  return (
    <div>
      {/* ── Hero cinématographique ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="from-primary/12 via-background to-background pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b" />
        <div className="from-accent/40 pointer-events-none absolute -top-24 -right-24 -z-10 size-[32rem] rounded-full bg-gradient-to-br to-transparent blur-3xl" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <span className="border-primary/30 bg-background/60 text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              Maison de couture digitale · 100 % tailleurs africains
            </span>

            <h1 className="mt-5 font-serif text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Le sur-mesure d&apos;exception,{" "}
              <span className="text-primary italic">cousu main</span> pour vous.
            </h1>

            <p className="text-muted-foreground mt-5 max-w-md text-lg text-pretty">
              Choisissez le modèle, le tissu et l&apos;artisan, renseignez vos mesures et
              suivez la confection jusqu&apos;à votre porte — toute une maison de couture,
              depuis votre téléphone.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/modeles"
                className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-lg px-6 text-base")}
              >
                Créer ma tenue <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/tissus"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 rounded-lg px-6 text-base",
                )}
              >
                Parcourir les tissus
              </Link>
            </div>

            {/* Preuve sociale + repères */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <span className="flex -space-x-2">
                  {TESTIMONIALS.map((t, i) => (
                    <span
                      key={t.name}
                      className={cn(
                        "ring-background flex size-8 items-center justify-center rounded-full text-[11px] font-semibold ring-2",
                        AVATAR_TONES[i % AVATAR_TONES.length],
                      )}
                    >
                      {t.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                  ))}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <Stars />
                  <span className="font-semibold">{ratingLabel}/5</span>
                  <span className="text-muted-foreground">
                    · {reviewCount.toLocaleString("fr-FR")} avis
                  </span>
                </span>
              </div>
              <span className="text-muted-foreground border-border hidden text-sm sm:inline-flex sm:border-l sm:pl-5">
                Sur mesure dès{" "}
                <span className="text-foreground ml-1 font-semibold">{formatPrice(minPrice)}</span>
              </span>
            </div>
          </div>

          <AtelierHero />
        </div>
      </section>

      {/* ── Bandeau tissus ─────────────────────────────────────────────── */}
      <section className="border-y bg-muted/30 py-10">
        <div className="mx-auto mb-6 flex max-w-6xl flex-wrap items-end justify-between gap-2 px-4">
          <div>
            <span className="text-primary text-xs font-semibold tracking-[0.25em] uppercase">
              Des étoffes d&apos;exception
            </span>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight">
              Wax, bazin, laine &amp; broderie
            </h2>
          </div>
          <Link
            href="/tissus"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Tout le catalogue <ArrowRight className="size-4" />
          </Link>
        </div>
        <FabricMarquee fabrics={marqueeFabrics} />
      </section>

      {/* ── Trois façons de commencer ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHead
          kicker="Par où commencer"
          title="Trois façons d'obtenir votre tenue"
          desc="Que vous partiez de zéro ou de votre propre tissu, tout se fait dans l'application."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {FLOWS.map((flow, i) => (
            <Link key={flow.title} href={flow.href} className="group block h-full">
              <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
                      <flow.icon className="size-6" />
                    </span>
                    <span className="text-muted-foreground/30 font-serif text-4xl font-medium">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{flow.title}</h3>
                  <p className="text-muted-foreground mt-2 flex-1 text-sm">{flow.desc}</p>
                  <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">
                    {flow.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Collections ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHead
          kicker="Le lookbook"
          title="Nos collections"
          desc="Des pièces cousues pour vous, jamais en série. Chaque modèle se prend tel quel ou se personnalise à vos mesures."
        />

        <div className="space-y-14">
          {/* Collections Femme & Homme — carrousels « à la Hockerty » */}
          <FemmeCollection />
          <HommeCollection />
        </div>
      </section>

      {/* ── Configurateur ──────────────────────────────────────────────── */}
      <FitShowcase />

      {/* ── Tailleurs (autorité) ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHead
          kicker="Nos artisans partenaires"
          title="Des tailleurs notés et certifiés, choisis par vous"
          desc="Chaque avis provient d'une commande réelle. Notes, tarifs et délais sont publics : vous confiez votre tissu en toute connaissance de cause."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTailors.map((tailor) => (
            <TailorCard key={tailor.id} tailor={tailor} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/tailleurs"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-lg px-6")}
          >
            Voir tous les tailleurs <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Témoignages ────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mb-10 text-center">
            <span className="text-primary text-xs font-semibold tracking-[0.25em] uppercase">
              Ils nous font confiance
            </span>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Ils portent déjà du {APP_NAME}
            </h2>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm">
              <Stars />
              <span className="font-semibold">{ratingLabel}/5</span>
              <span className="text-muted-foreground">
                sur {reviewCount.toLocaleString("fr-FR")} avis clients
              </span>
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <figure key={testimonial.name} className="bg-card flex flex-col rounded-2xl border p-6 shadow-sm">
                <Stars />
                <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-pretty">
                  « {testimonial.quote} »
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-xs font-semibold",
                      AVATAR_TONES[i % AVATAR_TONES.length],
                    )}
                  >
                    {testimonial.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{testimonial.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {testimonial.context}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHead
          kicker="Le déroulé"
          title="Comment ça marche"
          desc="De l'idée à la livraison, en quatre étapes."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {i < STEPS.length - 1 && (
                <span className="border-border absolute top-6 left-14 hidden w-[calc(100%-2rem)] border-t border-dashed lg:block" />
              )}
              <div className="bg-card relative flex size-12 items-center justify-center rounded-2xl border shadow-sm">
                <step.icon className="text-primary size-6" />
              </div>
              <div className="text-primary mt-4 text-xs font-semibold tracking-[0.2em] uppercase">
                Étape {i + 1}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/comment-ca-marche"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Voir le déroulé complet <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <SectionHead
            kicker="Avant de commander"
            title="Vos questions, nos réponses"
            desc="Ce que nos clients demandent avant leur première commande."
          />
          <div className="bg-card divide-y rounded-2xl border shadow-sm">
            {HOME_FAQ.map((item) => (
              <details key={item.q} className="group">
                <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-muted-foreground px-5 pb-4 text-sm leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            D&apos;autres questions ?{" "}
            <Link href="/faq" className="text-primary font-medium hover:underline">
              Consultez la FAQ complète
            </Link>
          </p>
        </div>
      </section>

      {/* ── Garanties + CTA final ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <item.icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="from-primary to-primary/85 text-primary-foreground overflow-hidden border-0 bg-gradient-to-br">
          <CardContent className="relative flex flex-col items-center gap-6 p-10 text-center md:flex-row md:justify-between md:text-left">
            <div className="bg-primary-foreground/10 pointer-events-none absolute -top-16 -right-10 size-56 rounded-full blur-2xl" />
            <div className="relative">
              <h2 className="font-serif text-2xl font-medium sm:text-3xl">
                Prêt à porter du vrai sur mesure ?
              </h2>
              <p className="text-primary-foreground/80 mt-2 max-w-xl text-pretty">
                Composez votre tenue en quelques minutes — un tailleur certifié s&apos;occupe
                du reste, de la coupe à la livraison en {minDays} à {maxDays} jours.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {Object.values(PAYMENT_METHOD_LABELS).map((label) => (
                  <span
                    key={label}
                    className="bg-primary-foreground/10 rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative flex shrink-0 flex-col items-center gap-2">
              <Link
                href="/modeles"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "h-12 rounded-lg px-6 text-base",
                )}
              >
                Créer ma tenue <ArrowRight className="size-4" />
              </Link>
              <span className="text-primary-foreground/70 text-xs">
                Sur mesure dès {formatPrice(minPrice)}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
