import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight, BadgeCheck, Ruler, Scissors, ShieldCheck } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import { COLLECTION_CTA, COLLECTION_HEADING } from "@/components/catalog/collection-sections";
import { display } from "@/lib/display-font";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "JALOFA AFRIQUE",
    description: t(
      "Grand boubou, kaftan, robe, thiaya et tenues de cérémonie : les habits africains, coupés sur mesure par nos tailleurs.",
    ),
  };
}

/** Une grande section par public : photo d'un côté, texte et bouton de l'autre. */
const AUDIENCES = [
  {
    id: "homme",
    eyebrow: "Homme",
    title: "L'homme africain",
    text: "Avant même que vous parliez, on sait qui vous êtes. Un habit taillé pour votre corps, qui impose le respect et vous donne la prestance d'un chef.",
    image: {
      src: "/collection%20homme/mallem.jpg",
      alt: "Silhouette d'un homme en costume devant une porte éclairée",
      // Photo en paysage dans un cadre portrait : l'homme reste dans le cadre.
      position: "object-[40%_center]",
    },
    href: "/modeles?category=homme",
    cta: "Voir la collection Homme",
  },
  {
    id: "femme",
    eyebrow: "Femme",
    title: "La femme africaine",
    text: "Quand vous entrez, tous les regards se tournent vers vous. Une tenue coupée pour votre corps, qui sublime votre allure et vous fait vous sentir reine.",
    image: {
      src: "/collection%20femme/tella.jpg",
      alt: "Portrait en noir et blanc d'une femme souriante, bras levé, en robe noire",
      // Portrait vertical : on garde le visage et la main levée dans le cadre.
      position: "object-[50%_30%]",
    },
    href: "/modeles?category=femme",
    cta: "Voir la collection Femme",
  },
];

/** Ce que porte un habit africain : trois valeurs de la tradition. */
const TRADITION = [
  {
    number: "01",
    title: "Un savoir transmis",
    text: "La coupe d'un grand boubou s'apprend à l'atelier, de maître à apprenti. Chaque tenue garde ce geste vivant.",
  },
  {
    number: "02",
    title: "Un tissu qui parle",
    text: "Bazin, wax, broderie : les couleurs et les motifs disent la fête, la famille, la région d'où l'on vient.",
  },
  {
    number: "03",
    title: "Une fierté portée",
    text: "Au mariage, à la Tabaski, le vendredi : l'habit africain se porte avec dignité, et se transmet.",
  },
];

const PROMISES = [
  {
    icon: Scissors,
    title: "Des tailleurs d'expérience",
    text: "Des ateliers du Sénégal, notés par leurs clients.",
  },
  {
    icon: Ruler,
    title: "À vos mesures",
    text: "Votre corps, votre taille : l'habit tombe juste.",
  },
  {
    icon: BadgeCheck,
    title: "Votre tissu, votre style",
    text: "Bazin, wax, broderie : vous choisissez chaque détail.",
  },
  {
    icon: ShieldCheck,
    title: "Payé après la livraison",
    text: "Le tailleur est payé seulement quand vous avez reçu votre tenue.",
  },
];

/**
 * JALOFA AFRIQUE : une section Homme, une section Femme (chacune mène à sa
 * collection complète), puis le marketing — les grands moments, la promesse et
 * l'appel aux tailleurs.
 */
export default async function AfriquePage() {
  const t = await getT();

  return (
    <>
      <CollectionHero
        number="06"
        eyebrow="Homme · Femme"
        title="Afrique"
        titleClassName="text-[18vw] md:text-[11vw]"
        image={{
          src: "/models/afrique.jpg",
          alt: "Les mains d'un tailleur cousent un tissu à l'aiguille",
          // Sur mobile (portrait), on garde l'aiguille et les doigts au centre.
          position: "object-[57%_40%]",
        }}
        target="homme"
      />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Homme puis Femme : photo et texte alternés. */}
        {AUDIENCES.map((audience, index) => (
          <section
            key={audience.id}
            id={audience.id}
            className="grid scroll-mt-16 gap-8 pt-14 md:grid-cols-2 md:items-center md:gap-14 md:pt-24"
          >
            <Link
              href={audience.href}
              className={cn(
                "group relative aspect-4/5 overflow-hidden rounded-xl",
                index % 2 === 1 && "md:order-2",
              )}
            >
              <Image
                src={audience.image.src}
                alt={t(audience.image.alt)}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className={cn(
                  "object-cover transition-transform duration-700 group-hover:scale-[1.03]",
                  audience.image.position,
                )}
              />
            </Link>
            <div>
              <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
                {t(audience.eyebrow)}
              </p>
              <h2 className={cn(COLLECTION_HEADING, "mt-3")}>{t(audience.title)}</h2>
              <p className="mt-5 text-lg md:text-xl">{t(audience.text)}</p>
              <Link href={audience.href} className={cn(COLLECTION_CTA, "mt-8")}>
                {t(audience.cta)}
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            </div>
          </section>
        ))}

        {/* L'habit africain et la valeur de la tradition, puis Homme / Femme. */}
        <section className="pt-16 md:pt-28">
          <div className="grid gap-8 md:grid-cols-2 md:gap-14">
            <div>
              <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
                {t("L'habit africain")}
              </p>
              <h2 className={cn(COLLECTION_HEADING, "mt-3")}>{t("Porter la tradition")}</h2>
            </div>
            <div className="space-y-5 text-lg md:text-xl">
              <p>
                {t(
                  "Le grand boubou, le kaftan, la thiaya, la robe de cérémonie : ces habits ne sont pas de simples vêtements. Ils racontent une histoire, une famille, un pays.",
                )}
              </p>
              <p className="text-muted-foreground">
                {t(
                  "Ils sont coupés à la main par des tailleurs qui tiennent leur métier de leurs aînés. Porter un habit africain sur mesure, c'est garder cette tradition vivante.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6">
            {TRADITION.map((item) => (
              <div key={item.number} className="border-t border-white/15 pt-5">
                <p className="text-muted-foreground text-sm tracking-[0.2em]">{item.number}</p>
                <h3 className={cn(display.className, "mt-2 text-2xl tracking-[0.04em] uppercase")}>
                  {t(item.title)}
                </h3>
                <p className="text-muted-foreground mt-2 text-lg">{t(item.text)}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row md:mt-16">
            <Link href="/modeles?category=homme" className={COLLECTION_CTA}>
              {t("Habits pour homme")}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/modeles?category=femme" className={COLLECTION_CTA}>
              {t("Habits pour femme")}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>

          <p
            className={cn(
              display.className,
              "mt-16 text-center text-3xl leading-tight tracking-[0.03em] uppercase md:mt-24 md:text-5xl",
            )}
          >
            {t("Cousu à Dakar. Porté partout dans le monde.")}
          </p>
        </section>

        {/* La promesse */}
        <section className="pt-16 md:pt-28">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="border-t border-white/15 pt-5">
                <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-3 text-lg font-medium">{t(title)}</h3>
                <p className="text-muted-foreground mt-1">{t(text)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Les tailleurs africains rejoignent JALOFA avec le compte pro habituel. */}
        <section className="my-16 grid gap-8 rounded-2xl border border-white/15 px-5 py-10 md:my-28 md:grid-cols-2 md:items-center md:gap-12 md:px-12 md:py-14">
          <div className="relative aspect-4/3 overflow-hidden rounded-xl md:order-2">
            <Image
              src="/look/tailleur.jpg"
              alt={t("Pied-de-biche d'une machine à coudre sur un tissu noir")}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
              {t("Tailleur ou vendeur de tissus")}
            </p>
            <h2 className={cn(COLLECTION_HEADING, "mt-3")}>{t("Votre atelier est en Afrique ?")}</h2>
            <p className="mt-4 max-w-2xl text-lg">
              {t("Ouvrez votre boutique sur JALOFA : vos créations sont vues au Sénégal, en Europe et dans la diaspora.")}
            </p>
            <Link href="/inscription?role=pro" className={cn(COLLECTION_CTA, "mt-8")}>
              {t("Créer mon compte pro")}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
