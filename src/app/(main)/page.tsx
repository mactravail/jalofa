import { Children } from "react";
import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/cart/price";
import {
  ENFANT,
  FEMME,
  HOMME,
  type CollectionTile,
} from "@/components/home/collection-marquee";
import { getFabrics } from "@/lib/data";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";

// Accueil « éditorial » inspiré de la mise en page Dolly Noire : une suite de
// grandes bannières pleine largeur (sur-titre, titre, « Découvrir »), chacune
// suivie de sa grille de pièces et d'un lien « Tout voir ». Peu de texte, tout
// passe par l'image.

/** Lien texte souligné, en capitales — le « Scopri » de la référence. */
function DiscoverLink({
  href,
  children = "Découvrir",
  light,
}: {
  href: string;
  children?: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-block border-b pb-1 text-xs font-semibold tracking-[0.25em] uppercase transition-opacity hover:opacity-70",
        light ? "border-white text-white" : "border-foreground text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Bannière pleine largeur. Une image : plein cadre. Deux images : côte à côte
 * sur ordinateur, seule la première sur mobile (comme les visuels desktop /
 * mobile séparés de la référence).
 */
function Banner({
  images,
  eyebrow,
  title,
  href,
  cta = "Découvrir",
  tall,
  preload,
}: {
  images: { src: string; alt: string }[];
  eyebrow: string;
  title: string;
  href: string;
  cta?: string;
  tall?: boolean;
  preload?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-neutral-900",
        tall ? "h-[82svh] max-h-[56rem] min-h-[28rem]" : "aspect-4/5 md:aspect-16/7",
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
              preload={preload && i === 0}
              sizes={images.length > 1 ? "(min-width: 768px) 50vw, 100vw" : "100vw"}
              className="object-cover"
            />
          </div>
        ))}
      </Link>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-12 text-center text-white md:pb-16">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-white/85">{eyebrow}</p>
        <h2 className="mt-3 font-serif text-4xl leading-none font-medium tracking-tight text-balance sm:text-5xl md:text-7xl">
          {title}
        </h2>
        <div className="pointer-events-auto mt-6">
          <DiscoverLink href={href} light>
            {cta}
          </DiscoverLink>
        </div>
      </div>
    </section>
  );
}

/** Carte produit sobre : image 4/5, nom puis précision, sans cadre. */
function GarmentCard({ tile }: { tile: CollectionTile }) {
  return (
    <Link href={tile.href} className="group block">
      <div className="bg-muted relative aspect-4/5 overflow-hidden">
        <Image
          src={tile.src}
          alt={tile.alt}
          fill
          sizes="18rem"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className="mt-3 text-sm font-medium">{tile.name}</h3>
      <p className="text-muted-foreground text-xs">Sur mesure</p>
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
            sizes="18rem"
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
function Grid({
  label,
  href,
  children,
}: {
  label?: string;
  href: string;
  children: React.ReactNode;
}) {
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
        <DiscoverLink href={href}>Tout voir</DiscoverLink>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const fabrics = (await getFabrics()).slice(0, 8);

  return (
    <div>
      <Banner
        tall
        preload
        images={[{ src: "/look/1.png", alt: "Créatrice dessinant une tenue sur mesure" }]}
        eyebrow="Sur mesure · Sénégal"
        title="Créer ma tenue"
        href="/modeles"
      />

      <Banner
        images={[
          { src: HOMME[0].src, alt: HOMME[0].alt },
          { src: HOMME[2].src, alt: HOMME[2].alt },
        ]}
        eyebrow="Collection"
        title="Homme"
        href="/modeles?category=homme"
      />
      <Grid label="Grand boubou, kaftan, costume" href="/modeles?category=homme">
        {HOMME.slice(0, 8).map((tile) => (
          <GarmentCard key={tile.name} tile={tile} />
        ))}
      </Grid>

      <Banner
        images={[
          { src: FEMME[0].src, alt: FEMME[0].alt },
          { src: FEMME[1].src, alt: FEMME[1].alt },
        ]}
        eyebrow="Collection"
        title="Femme"
        href="/modeles?category=femme"
      />
      <Grid label="Robe, boubou, cérémonie" href="/modeles?category=femme">
        {FEMME.slice(0, 8).map((tile) => (
          <GarmentCard key={tile.name} tile={tile} />
        ))}
      </Grid>

      {fabrics.length > 0 && (
        <>
          <Banner
            images={[{ src: "/look/choisir_tissu.png", alt: "Choix d'un tissu brodé" }]}
            eyebrow="Wax, bazin, broderie"
            title="Tissus"
            href="/tissus"
          />
          <Grid label="Choisissez votre étoffe" href="/tissus">
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </Grid>
        </>
      )}

      <Banner
        images={ENFANT.map((t) => ({ src: t.src, alt: t.alt }))}
        eyebrow="Collection"
        title="Enfant"
        href="/modeles?category=enfant"
      />

      <Banner
        images={[{ src: "/look/2.png", alt: "Tailleur présentant le catalogue de tissus" }]}
        eyebrow="Nos artisans"
        title="Tailleurs"
        href="/tailleurs"
        cta="Trouver mon tailleur"
      />
    </div>
  );
}
