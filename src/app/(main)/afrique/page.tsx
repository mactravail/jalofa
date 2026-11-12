import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight, BadgeCheck, Ruler, Scissors, ShieldCheck } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import { COLLECTION_CTA, COLLECTION_HEADING } from "@/components/catalog/collection-sections";
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
    title: "L'excellence du sur-mesure africain commence ici.",
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
    title: "Votre style mérite un tailleur d'exception.",
    text: "Ne confiez plus vos tenues au hasard. Trouvez des tailleurs qualifiés et sélectionnés pour transformer vos envies en pièces uniques.",
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
        eyebrow="Votre style mérite un tailleur d'exception"
        title="Prestige et exclusivité"
        titleClassName="text-[11vw] leading-[0.95] md:text-[6.5vw]"
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
