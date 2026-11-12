import { Children } from "react";
import Image from "next/image";
import Link from "@/components/i18n/link";

import { Price } from "@/components/cart/price";
import type { CollectionTile } from "@/components/home/collection-marquee";
import { modelHref } from "@/components/catalog/model-card";
import {
  FEMME_OCCASIONS,
  HOMME_OCCASIONS,
  orderForPicker,
  wornCover,
} from "@/lib/collection-occasions";
import { EUROPE_SLOGAN, EUROPE_TYPES } from "@/lib/europe";
import { EUROPE_HERO, EUROPE_TYPE_IMAGES } from "@/lib/europe-images";
import { HeroVideo } from "@/components/home/hero-video";
import { getFabrics, getModels } from "@/lib/data";
import { SELECTION_CTA, SELECTION_SUBTITLE, SELECTION_TITLE } from "@/lib/selection";
import type { Fabric, GarmentModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// Accueil « éditorial » inspiré de la mise en page Dolly Noire : une suite de
// grandes bannières pleine largeur (sur-titre, titre, « Découvrir »), chacune
// suivie de sa grille de pièces et d'un lien « Tout voir ». Peu de texte, tout
// passe par l'image.

/** Lien texte souligné, en capitales — le « Scopri » de la référence. */
async function DiscoverLink({
  href,
  children,
  light,
}: {
  href: string;
  children?: React.ReactNode;
  light?: boolean;
}) {
  const t = await getT();
  return (
    <Link
      href={href}
      className={cn(
        "inline-block border-b pb-1 text-xs font-semibold tracking-[0.25em] uppercase transition-opacity hover:opacity-70",
        light ? "border-white text-white" : "border-foreground text-foreground",
      )}
    >
      {children ?? t("Découvrir")}
    </Link>
  );
}

/** Texte des bannières : en bas à gauche, sur-titre, très grand titre, lien. */
function BannerCaption({
  eyebrow,
  title,
  href,
  cta,
  text,
  note,
  highlight,
  inFlow,
  as: Heading = "h2",
}: {
  /** Sur-titre en orange (annonce d'une promo). */
  highlight?: boolean;
  /**
   * Texte dans le flux (et non posé en absolu) : la bannière grandit s'il ne
   * tient pas dans la photo — utile sur mobile quand il y a un paragraphe.
   */
  inFlow?: boolean;
  eyebrow: string;
  title: string;
  href: string;
  cta: string;
  text?: string;
  /** Petite mention discrète sous le texte (ex. une promo). */
  note?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "pointer-events-none flex flex-col items-start px-4 pb-8 text-white md:px-6 md:pb-12",
        inFlow ? "relative pt-24" : "absolute inset-x-0 bottom-0",
      )}
    >
      <p
        className={cn(
          "text-xs font-medium tracking-[0.15em] uppercase",
          highlight ? "font-bold text-orange-500" : "text-white/90",
        )}
      >
        {eyebrow}
      </p>
      <Heading className="mt-3 text-5xl leading-none font-medium tracking-tight text-balance sm:text-7xl md:text-8xl lg:text-9xl">
        {title}
      </Heading>
      {text && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">{text}</p>
      )}
      {/* Petite ligne discrète, façon « mention en bas de page ». */}
      {note && <p className="mt-2 max-w-xl text-xs leading-snug text-white/60">{note}</p>}
      <div className="pointer-events-auto mt-6">
        <DiscoverLink href={href} light>
          {cta}
        </DiscoverLink>
      </div>
    </div>
  );
}

/**
 * Le hero : la vidéo occupe tout l'écran, sous le header transparent. Le fond du
 * film est clair, d'où les deux dégradés qui gardent le texte blanc lisible. Sur
 * mobile, la barre du bas (fixe) est déduite pour que le texte reste visible.
 */
async function VideoHero() {
  const t = await getT();
  const href = "/modeles";
  const title = t("Créer ma tenue");
  const cta = t("Découvrir");
  return (
    <section className="relative h-[calc(100svh-2.25rem-var(--spacing-bottom-nav))] min-h-[28rem] w-full overflow-hidden bg-neutral-900 md:h-[calc(100svh-2.25rem)]">
      <Link href={href} aria-label={`${title} — ${cta}`} className="absolute inset-0">
        <HeroVideo
          poster="/videos/hero-poster.jpg"
          alt={t("Deux mannequins en tenue, pendant une séance photo en studio")}
        />
      </Link>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <BannerCaption as="h1" eyebrow={t("Sur mesure · Sénégal")} title={title} href={href} cta={cta} />
    </section>
  );
}

/**
 * Bannière pleine largeur. Une image : plein cadre. Deux images : côte à côte
 * sur ordinateur, seule la première sur mobile (comme les visuels desktop /
 * mobile séparés de la référence).
 */
async function Banner({
  images,
  eyebrow,
  title,
  href,
  cta: ctaProp,
  text,
  note,
  highlight,
}: {
  highlight?: boolean;
  images: { src: string; alt: string; position?: string }[];
  eyebrow: string;
  title: string;
  href: string;
  cta?: string;
  text?: string;
  note?: string;
}) {
  const t = await getT();
  const cta = ctaProp ?? t("Découvrir");
  return (
    // Avec un paragraphe, le texte est dans le flux et la section n'a pas
    // d'overflow-hidden : elle garde son format photo mais s'allonge si le texte
    // ne tient pas (sinon, sur mobile, le haut du texte était coupé).
    <section
      className={cn(
        "relative aspect-4/5 w-full bg-neutral-900 md:aspect-16/7",
        text ? "flex flex-col justify-end" : "overflow-hidden",
      )}
    >
      <Link href={href} aria-label={`${title} — ${cta}`} className="absolute inset-0 flex">
        {images.map((img, i) => (
          <div
            key={img.src}
            className={cn("relative h-full flex-1", i > 0 && "max-md:hidden")}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={images.length > 1 ? "(min-width: 768px) 50vw, 100vw" : "100vw"}
              className={cn("object-cover", img.position)}
            />
          </div>
        ))}
      </Link>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <BannerCaption eyebrow={eyebrow} title={title} href={href} cta={cta} text={text} note={note} highlight={highlight} inFlow={!!text} />
    </section>
  );
}

/** Alterne deux listes (homme, femme, homme…) : la rangée mélange les deux. */
function alternate<T>(a: T[], b: T[]): T[] {
  return Array.from({ length: Math.max(a.length, b.length) }).flatMap((_, i) =>
    [a[i], b[i]].filter((x): x is T => x !== undefined),
  );
}

/**
 * JALOFA AFRIQUE : les habits africains des collections Homme et Femme, mêlés.
 * Tirés du catalogue réel (`getModels` écarte déjà les modèles retirés, cf.
 * `retired-models.ts`) : un habit supprimé du site disparaît aussi d'ici.
 */
async function getAfriqueTiles(): Promise<CollectionTile[]> {
  const [homme, femme] = await Promise.all([
    getModels({ category: "homme" }),
    getModels({ category: "femme" }),
  ]);
  const toTiles = (
    models: GarmentModel[],
    occasions: typeof HOMME_OCCASIONS,
    audience: CollectionTile["audience"],
  ): CollectionTile[] =>
    orderForPicker(
      models.filter(
        (m) => m.tailor_id === null && !m.origin?.europe && !m.slug?.startsWith("europe-"),
      ),
      occasions,
    ).flatMap(({ model }) => {
      const src = wornCover(model);
      return src
        ? [{ name: model.name, audience, src, href: modelHref(model), alt: model.name }]
        : [];
    });
  return alternate(
    toTiles(homme, HOMME_OCCASIONS, "Homme"),
    toTiles(femme, FEMME_OCCASIONS, "Femme"),
  );
}

/** JALOFA EUROPE : chaque catégorie avec sa photo, homme et femme mêlés. */
const EUROPE_TILES: CollectionTile[] = (() => {
  const toTile = (type: (typeof EUROPE_TYPES)[number]): CollectionTile | null => {
    const src = EUROPE_TYPE_IMAGES[type.value];
    if (!src) return null;
    return {
      name: type.label,
      audience: type.category === "homme" ? "Homme" : "Femme",
      src,
      href: `/modeles?category=${type.category}`,
      alt: type.label,
    };
  };
  const tiles = (category: "homme" | "femme") =>
    EUROPE_TYPES.filter((type) => type.category === category)
      .map(toTile)
      .filter((tile): tile is CollectionTile => tile !== null);
  return alternate(tiles("femme"), tiles("homme"));
})();

/** Largeur réelle des cartes de la rangée (`w-48 sm:w-60 lg:w-72`) : pas de photo trop grande sur téléphone. */
const CARD_SIZES = "(min-width: 1024px) 18rem, (min-width: 640px) 15rem, 12rem";

/** Carte produit sobre : image 4/5, nom puis précision, sans cadre. */
async function GarmentCard({ tile }: { tile: CollectionTile }) {
  const t = await getT();
  return (
    <Link href={tile.href} className="group block">
      <div className="bg-muted relative aspect-4/5 overflow-hidden">
        <Image
          src={tile.src}
          alt={t(tile.alt)}
          fill
          sizes={CARD_SIZES}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className="mt-3 text-sm font-medium">{t(tile.name)}</h3>
      <p className="text-muted-foreground text-xs">{t("Sur mesure")}</p>
    </Link>
  );
}

function FabricCard({ fabric }: { fabric: Fabric }) {
  return (
    <Link href={`/tissus/${fabric.id}`} className="group block">
      <div className="bg-muted relative aspect-4/5 overflow-hidden">
        {fabric.image_url && (
          <Image
            src={fabric.image_url}
            alt={fabric.name}
            fill
            sizes={CARD_SIZES}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <h3 className="mt-3 truncate text-sm font-medium">{fabric.name}</h3>
      <p className="text-muted-foreground text-xs">
        <Price amount={fabric.price_per_meter} /> / m
      </p>
    </Link>
  );
}

/**
 * Rangée défilante sous une bannière, puis le lien « Tout voir ». Une seule
 * ligne : deux pistes identiques translatées en boucle (`animate-marquee`,
 * globals.css), pause au survol, figée si `prefers-reduced-motion`. Sans JS.
 */
async function Grid({
  label,
  href,
  children,
}: {
  label?: string;
  href: string;
  children: React.ReactNode;
}) {
  const t = await getT();
  const items = Children.toArray(children);
  return (
    <section className="py-10 md:py-14">
      {label && (
        <p className="text-muted-foreground mb-6 px-4 text-center text-xs font-semibold tracking-[0.3em] uppercase">
          {label}
        </p>
      )}
      <div className="group flex overflow-hidden [--marquee:45s]">
        {[0, 1].map((track) => (
          <div
            key={track}
            aria-hidden={track === 1}
            inert={track === 1}
            className="animate-marquee flex shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused] md:gap-5 md:pr-5"
          >
            {items.map((item, i) => (
              <div key={i} className="w-48 shrink-0 sm:w-60 lg:w-72">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <DiscoverLink href={href}>{t("Tout voir")}</DiscoverLink>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [allFabrics, afriqueTiles] = await Promise.all([getFabrics(), getAfriqueTiles()]);
  const fabrics = allFabrics.slice(0, 8);
  const t = await getT();

  return (
    <div>
      <VideoHero />

      <Banner
        images={[{ src: "/collection femme/coppia.png", alt: t("Un homme en grand boubou brodé et une femme en robe drapée devant une porte sombre"), position: "object-[center_25%]" }]}
        eyebrow={t("La tradition, portée avec élégance")}
        title={t("Afrique")}
        href="/afrique"
      />
      <Grid label={t("Entrez, et tout le monde se retourne")} href="/afrique">
        {afriqueTiles.map((tile) => (
          <GarmentCard key={tile.href} tile={tile} />
        ))}
      </Grid>

      <Banner
        images={[
          {
            src: EUROPE_HERO.src,
            alt: t(EUROPE_HERO.alt),
            // Photo d'atelier très claire : assombrie pour rester dans le thème noir du site.
            position: cn(EUROPE_HERO.position, "brightness-[0.5] contrast-110"),
          },
        ]}
        eyebrow={t(EUROPE_SLOGAN)}
        title="Europe"
        href="/europe"
      />
      <Grid label={t("Taillé pour vous, porté comme une signature")} href="/europe">
        {EUROPE_TILES.map((tile) => (
          <GarmentCard key={tile.src} tile={tile} />
        ))}
      </Grid>

      {fabrics.length > 0 && (
        <>
          <Banner
            images={[{ src: "/look/karola.jpg", alt: t("Rouleaux de tissus jaunes, orange et rouges") }]}
            eyebrow={t("Choisissez votre tissu parmi les meilleurs")}
            title={t("Tissus")}
            href="/tissus"
          />
          <Grid label={t("Choisissez votre étoffe")} href="/tissus">
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </Grid>
        </>
      )}

      <Banner
        images={[
          {
            src: "/look/tailleur.jpg",
            alt: t("Pied-de-biche d'une machine à coudre sur un tissu noir"),
            // Calée vers le bas : la machine passe au-dessus du titre.
            position: "object-[30%_center] md:object-bottom",
          },
        ]}
        // Sélection JALOFA (cf. `selection.ts`) : accès PRO offert, sans
        // prix ni durée affichés.
        eyebrow={t("Sélection JALOFA · Accès PRO offert")}
        title={t("Rejoignez-nous")}
        highlight
        text={t(SELECTION_TITLE)}
        note={t(SELECTION_SUBTITLE)}
        href="/inscription?role=pro"
        cta={t(SELECTION_CTA)}
      />
    </div>
  );
}
