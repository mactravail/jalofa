import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight, Gem, Ruler, Scissors, ShieldCheck } from "lucide-react";

import { CollectionHero } from "@/components/catalog/collection-hero";
import { COLLECTION_CTA, COLLECTION_HEADING } from "@/components/catalog/collection-sections";
import { FabricCard } from "@/components/catalog/fabric-card";
import { TailorCard } from "@/components/catalog/tailor-card";
import { VendorCard } from "@/components/catalog/vendor-card";
import { DemoBanner } from "@/components/demo-banner";
import { getFabrics, getModels, getTailors, getVendors } from "@/lib/data";
import { display } from "@/lib/display-font";
import {
  EUROPE_LABEL,
  EUROPE_SLOGAN,
  EUROPE_TYPES,
  isEuropeCountry,
} from "@/lib/europe";
import {
  EUROPE_ATELIER_IMAGE,
  EUROPE_BUSINESS,
  EUROPE_HERO,
  EUROPE_TYPE_IMAGES,
} from "@/lib/europe-images";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: EUROPE_LABEL,
    description: t(
      "Robes, smokings, costumes, chemises et tenues de tous les jours des ateliers européens, sur mesure ou prêt-à-porter. L'élégance européenne, accessible au monde.",
    ),
  };
}

const PROMISES = [
  {
    icon: Scissors,
    title: "Le savoir-faire des ateliers",
    text: "Des tailleurs et créateurs installés en Europe, en Italie d'abord.",
  },
  {
    icon: Gem,
    title: "Des matières de qualité",
    text: "Chaque fiche dit la matière et le tissu utilisés.",
  },
  {
    icon: Ruler,
    title: "Sur mesure ou prêt-à-porter",
    text: "À vos mesures, ou dans votre taille. Vous choisissez.",
  },
  {
    icon: ShieldCheck,
    title: "Payé après la livraison",
    text: "L'atelier est payé seulement quand vous avez reçu votre tenue.",
  },
];

/**
 * JALOFA EUROPE : les créations des ateliers européens, ouvertes à tous les
 * visiteurs (Afrique, Europe, diaspora) — rien n'est masqué selon le pays. Les
 * produits viennent du catalogue JALOFA : un pro est « européen » par le pays
 * qu'il a déclaré (cf. `europe.ts`), sans table ni boutique à part.
 */
export default async function EuropePage() {
  const t = await getT();

  const [allFabrics, allTailors, allVendors, models] = await Promise.all([
    getFabrics(),
    getTailors(),
    getVendors(),
    getModels(),
  ]);
  // Chaque tuile ouvre sa fiche vêtement (tel quel ou sur mesure) :
  // /modeles/europe-<catégorie>. Tant que la fiche n'existe pas en base, la
  // tuile mène à la collection Homme / Femme.
  const slugs = new Set(models.map((m) => m.slug).filter(Boolean));
  const tileHref = (type: (typeof EUROPE_TYPES)[number]) =>
    slugs.has(`europe-${type.value}`)
      ? `/modeles/europe-${type.value}`
      : `/modeles?category=${type.category}`;
  const fabrics = allFabrics.filter((f) => f.origin?.europe);
  const tailors = allTailors.filter((p) => isEuropeCountry(p.country));
  const vendors = allVendors.filter((p) => isEuropeCountry(p.country));

  return (
    <>
      <CollectionHero
        number="05"
        eyebrow={EUROPE_SLOGAN}
        title="Europe"
        image={EUROPE_HERO}
        target="categories"
        secondaryLink={{ href: "#rejoindre", label: "Ateliers : rejoindre" }}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <DemoBanner />

        {/* Les catégories de lancement */}
        <section id="categories" className="scroll-mt-16 pt-14 md:pt-24">
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
            {EUROPE_LABEL}
          </p>
          <h2 className={cn(COLLECTION_HEADING, "mt-3")}>{t("L'élégance européenne")}</h2>
          <p className="mt-3 max-w-xl text-lg">
            {t("Robes, smokings, costumes, chemises et tenues de tous les jours, coupés dans les ateliers d'Europe. Livrés en Afrique, en Europe et partout dans le monde.")}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
            {EUROPE_TYPES.map((type, index) => {
              const image = EUROPE_TYPE_IMAGES[type.value];
              return (
                <Link
                  key={type.value}
                  href={tileHref(type)}
                  className={cn(
                    "group relative flex aspect-3/4 overflow-hidden rounded-xl border border-white/15 bg-neutral-950",
                  )}
                >
                  {image && (
                    <Image
                      src={image}
                      alt={t(type.label)}
                      fill
                      sizes="(min-width: 768px) 20vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                  <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                  <span
                    className={cn(
                      display.className,
                      "relative mt-auto p-3 text-xl leading-none tracking-[0.04em] text-white uppercase md:p-4 md:text-2xl",
                    )}
                  >
                    <span className="block text-xs tracking-[0.2em] opacity-70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1.5 block">{t(type.tile)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/*
          Section marketing : les entrepreneurs africains, hommes et femmes
          d'affaires. La vitrine filtrable (`EuropeCatalog`) est mise de côté
          pour le moment : il suffit de la remettre ici quand les ateliers
          auront publié.
        */}
        <section id="affaires" className="scroll-mt-16 pt-16 md:pt-28">
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-14">
            <div className="relative aspect-4/5 overflow-hidden rounded-xl">
              <Image
                src={EUROPE_BUSINESS.lead.src}
                alt={t(EUROPE_BUSINESS.lead.alt)}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
                {t("Pour les entrepreneurs africains")}
              </p>
              <h2 className={cn(COLLECTION_HEADING, "mt-3")}>{t("Habillé pour réussir")}</h2>
              <p className="mt-5 text-lg md:text-xl">
                {t("Vous signez des contrats, dirigez des équipes, représentez votre entreprise de Dakar à Milan. Votre tenue parle avant vous.")}
              </p>
              <p className="text-muted-foreground mt-4 text-lg">
                {t("Les ateliers européens de JALOFA coupent pour vous des costumes, des tailleurs et des chemises dans les plus beaux tissus, à vos mesures. Livrés chez vous, en Afrique comme ailleurs.")}
              </p>
              <a href="#categories" className={cn(COLLECTION_CTA, "mt-8")}>
                {t("Choisir ma tenue")}
                <ArrowRight className="size-5" aria-hidden />
              </a>
            </div>
          </div>

          <div className="mt-14 grid gap-8 md:mt-20 md:grid-cols-3 md:gap-6">
            {EUROPE_BUSINESS.moments.map((moment) => (
              <figure key={moment.src}>
                <div className="relative aspect-3/4 overflow-hidden rounded-xl">
                  <Image
                    src={moment.src}
                    alt={t(moment.alt)}
                    fill
                    sizes="(min-width: 768px) 30vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-4">
                  <h3 className={cn(display.className, "text-2xl tracking-[0.04em] uppercase")}>
                    {t(moment.title)}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-lg">{t(moment.text)}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <p
            className={cn(
              display.className,
              "mt-16 text-center text-3xl leading-tight tracking-[0.03em] uppercase md:mt-24 md:text-5xl",
            )}
          >
            {t("Coupé en Europe. Porté à Dakar, Abidjan et Lagos.")}
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

        {fabrics.length > 0 && (
          <section className="pt-16 md:pt-28">
            <h2 className={COLLECTION_HEADING}>{t("Tissus d'Europe")}</h2>
            <p className="text-muted-foreground mt-3 mb-6 max-w-xl">
              {t("Laine, soie, coton, lin : au mètre, chez nos vendeurs européens.")}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {fabrics.slice(0, 8).map((fabric) => (
                <FabricCard key={fabric.id} fabric={fabric} />
              ))}
            </div>
          </section>
        )}

        {tailors.length > 0 && (
          <section className="pt-16 md:pt-28">
            <h2 className={COLLECTION_HEADING}>{t("Les ateliers")}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {tailors.slice(0, 8).map((tailor) => (
                <TailorCard key={tailor.id} tailor={tailor} />
              ))}
            </div>
          </section>
        )}

        {vendors.length > 0 && (
          <section className="pt-16 md:pt-28">
            <h2 className={COLLECTION_HEADING}>{t("Les vendeurs de tissus")}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.slice(0, 6).map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </section>
        )}

        {/* Les pros européens rejoignent JALOFA avec le compte pro habituel. */}
        <section
          id="rejoindre"
          className="my-16 grid scroll-mt-16 gap-8 rounded-2xl border border-white/15 px-5 py-10 md:my-28 md:grid-cols-2 md:items-center md:gap-12 md:px-12 md:py-14"
        >
          <div className="relative aspect-4/3 overflow-hidden rounded-xl md:order-2">
            <Image
              src={EUROPE_ATELIER_IMAGE.src}
              alt={t(EUROPE_ATELIER_IMAGE.alt)}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover brightness-60"
            />
          </div>
          <div>
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
            {t("Tailleurs, créateurs, vendeurs de tissus")}
          </p>
          <h2 className={cn(COLLECTION_HEADING, "mt-3")}>
            {t("Votre atelier est en Europe ?")}
          </h2>
          <p className="mt-4 max-w-2xl text-lg">
            {t("Ouvrez votre boutique sur JALOFA, indiquez votre pays et votre ville : vos créations rejoignent JALOFA EUROPE et sont vues en Afrique, en Europe et dans la diaspora.")}
          </p>
          <Link
            href="/inscription?role=pro"
            className={cn(COLLECTION_CTA, "mt-8")}
          >
            {t("Créer mon compte pro")}
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          </div>
        </section>
      </div>
    </>
  );
}
