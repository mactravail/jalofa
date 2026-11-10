import Image from "next/image";
import Link from "@/components/i18n/link";

// Bandeau défilant « Nos collections » — Homme, Femme et Enfant réunis, au même
// format que le bandeau des tissus (<FabricMarquee />) : deux pistes identiques
// translatées en boucle via `animate-marquee` (globals.css), pause au survol,
// figées si `prefers-reduced-motion`. Sans JS.
//
// Chaque tuile mène à SA destination (page dédiée ou fiche modèle). On lie par
// `slug` stable — jamais par l'`id` démo, absent en base (404 en prod). Les
// modèles enfant n'ont pas encore de slug en prod → ils mènent au catalogue
// filtré sur la catégorie « enfant ».

type Audience = "Homme" | "Femme" | "Enfant";

export type CollectionTile = {
  name: string;
  audience: Audience;
  src: string;
  href: string;
  alt: string;
};

export const HOMME: CollectionTile[] = [
  {
    name: "Grand boubou",
    audience: "Homme",
    src: "/collection%20homme/style/grand%20boubou.jpg",
    href: "/homme/grand-boubou-sur-mesure",
    alt: "Homme en grand boubou traditionnel sur mesure",
  },
  {
    name: "Kaftan",
    audience: "Homme",
    src: "/collection%20homme/style/kaftan.avif",
    href: "/modeles/kaftan",
    alt: "Homme en kaftan sur mesure",
  },
  {
    name: "Agbada",
    audience: "Homme",
    src: "/collection%20homme/style/agbada.jpg",
    href: "/homme/grand-boubou-sur-mesure?type=agbada",
    alt: "Homme en agbada brodé d'apparat",
  },
  {
    name: "Chemise",
    audience: "Homme",
    src: "/collection%20homme/style/chemise.avif",
    href: "/modeles/chemise",
    alt: "Homme en chemise africaine sur mesure",
  },
  {
    name: "Costume",
    audience: "Homme",
    src: "/collection%20homme/style/costume%20crois%C3%A9.jpg",
    href: "/modeles/costume",
    alt: "Homme en costume sur mesure",
  },
  {
    name: "Relax",
    audience: "Homme",
    src: "/collection%20homme/e.jpg",
    href: "/modeles/relax",
    alt: "Homme en tenue décontractée sur mesure",
  },
];

export const FEMME: CollectionTile[] = [
  {
    name: "Robe",
    audience: "Femme",
    src: "/collection%20femme/robe/w.avif",
    href: "/femme/robe-sur-mesure",
    alt: "Femme en robe sur mesure",
  },
  {
    name: "Boubou femme",
    audience: "Femme",
    src: "/collection%20femme/ceremonie/k.avif",
    href: "/femme/robe-sur-mesure?type=boubou-femme",
    alt: "Femme en boubou brodé sur mesure",
  },
  {
    name: "Cérémonie",
    audience: "Femme",
    src: "/collection%20femme/ceremonie/f.avif",
    href: "/modeles/ceremonie-femme",
    alt: "Femme en tenue de cérémonie brodée",
  },
  {
    name: "Tailleur pantalon",
    audience: "Femme",
    src: "/collection%20femme/pantalon/v.avif",
    href: "/modeles/tailleur-pantalon",
    alt: "Femme en tailleur pantalon sur mesure",
  },
  {
    name: "Ensemble",
    audience: "Femme",
    src: "/collection%20femme/robe/o.avif",
    href: "/modeles/ensemble",
    alt: "Femme en ensemble coordonné sur mesure",
  },
  {
    name: "Thiaya",
    audience: "Femme",
    src: "/collection%20femme/thiaya/thiaya%20femme.jpg",
    href: "/modeles/thiaya-femme",
    alt: "Femme en thiaya traditionnel deux-pièces",
  },
];

export const ENFANT: CollectionTile[] = [
  {
    name: "Boubou enfant",
    audience: "Enfant",
    src: "/models/boubou-enfant.jpg",
    href: "/modeles?category=enfant",
    alt: "Enfant en boubou sur mesure",
  },
  {
    name: "Ensemble enfant",
    audience: "Enfant",
    src: "/models/ensemble-enfant.jpg",
    href: "/modeles?category=enfant",
    alt: "Enfant en ensemble assorti sur mesure",
  },
];

// Homme et Femme alternés, les tenues enfant glissées à intervalles réguliers :
// les trois collections apparaissent vite à l'écran.
function interleave(): CollectionTile[] {
  const out: CollectionTile[] = [];
  const max = Math.max(HOMME.length, FEMME.length);
  for (let i = 0; i < max; i++) {
    if (HOMME[i]) out.push(HOMME[i]);
    if (FEMME[i]) out.push(FEMME[i]);
    if (i % 3 === 1 && ENFANT[(i - 1) / 3]) out.push(ENFANT[(i - 1) / 3]);
  }
  return out;
}

const TILES = interleave();

function TileChip({ tile }: { tile: CollectionTile }) {
  return (
    <Link
      href={tile.href}
      className="group relative block w-44 shrink-0 sm:w-52"
      aria-label={`${tile.name} — collection ${tile.audience}`}
    >
      <div className="bg-muted relative aspect-4/5 overflow-hidden rounded-2xl border">
        <Image
          src={tile.src}
          alt={tile.alt}
          fill
          sizes="13rem"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="truncate text-sm font-semibold tracking-tight">{tile.name}</p>
          <p className="text-[0.7rem] text-white/80">{tile.audience}</p>
        </div>
      </div>
    </Link>
  );
}

export function CollectionMarquee() {
  return (
    <div
      className="group relative flex overflow-hidden py-2 [--marquee:60s]"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
      }}
    >
      {[0, 1].map((track) => (
        <div
          key={track}
          aria-hidden={track === 1}
          className="animate-marquee flex shrink-0 gap-4 pr-4 group-hover:[animation-play-state:paused]"
        >
          {TILES.map((tile) => (
            <TileChip key={`${track}-${tile.name}`} tile={tile} />
          ))}
        </div>
      ))}
    </div>
  );
}
