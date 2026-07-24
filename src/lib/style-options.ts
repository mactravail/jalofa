import type { BoubouDetailIconName } from "@/components/order/boubou-detail-icons";
import type { StyleIconName } from "@/components/order/style-icons";
import type { GarmentModel } from "@/lib/types";

// Garment personalisation shown in the configurator "Style" step, modelled on
// Hockerty's grouped, illustrated picker but adapted to Senegalese / African
// clothing. These groups are catalogue constants (client-side); the chosen
// occasion still lives in the `styles` table via `styleSlug`.
//
// Each garment gets ONLY its own cuts, and only the groups that apply to it: a
// robe is never offered a kaftan cut, and a jupe has no collar or sleeves at
// all. That is why the catalogue is keyed per garment rather than being one
// flat list — see STYLE_GROUPS_BY_SLUG below.
//
// Clé : le `slug` du modèle — stable en démo comme en base (cf.
// `garment-routes.ts`, `fabric-metrage.ts`), là où l'`id` est un UUID aléatoire
// en prod. Une création de tailleur que cette table ne connaît pas est ramenée
// par mots-clés (nom + slug) sur la pièce de référence la plus proche.

/**
 * Une option se montre de trois façons, jamais deux à la fois :
 *  · `icon`  — le dessin générique, composé par famille de vêtement
 *    (`style-icons.tsx` / `garment-detail-icons.tsx`) ;
 *  · `art`   — une planche dédiée, dessinée pour CE détail-là
 *    (`boubou-detail-icons.tsx`), quand le vêtement se choisit finition par
 *    finition et qu'aucune composition paramétrique ne suffit ;
 *  · `photo` — un visuel de planche fourni par l'atelier (`/public`), qui
 *    remplace le dessin quand il existe.
 */
export type StyleGroupOption =
  | { slug: string; name: string; icon: StyleIconName; art?: never; photo?: never }
  | { slug: string; name: string; art: BoubouDetailIconName; icon?: never; photo?: never }
  // `photo` est un chemin absolu dans `/public` — le type le dit, ce qui permet
  // aussi de distinguer les trois variantes par simple test de vérité.
  | { slug: string; name: string; photo: `/${string}`; icon?: never; art?: never };

export type StyleGroup = {
  slug: string;
  name: string;
  options: StyleGroupOption[];
};

// ---------------------------------------------------------------------------
// Reusable groups — collars, embroidery, sleeves and lengths recur across
// garments, so they are composed into each garment's list below.
// ---------------------------------------------------------------------------

const COL_HOMME: StyleGroup = {
  slug: "col",
  name: "Col",
  options: [
    { slug: "rond", name: "Col rond brodé", icon: "col-rond" },
    { slug: "mao", name: "Col Mao", icon: "col-mao" },
    { slug: "v", name: "Col V", icon: "col-v" },
    { slug: "officier", name: "Col officier", icon: "col-officier" },
  ],
};

const COL_COSTUME: StyleGroup = {
  slug: "col",
  name: "Col",
  options: [
    { slug: "mao", name: "Col Mao", icon: "col-mao" },
    { slug: "chale", name: "Col châle", icon: "col-chale" },
    { slug: "v", name: "Col V", icon: "col-v" },
    { slug: "officier", name: "Col officier", icon: "col-officier" },
  ],
};

const COL_FEMME: StyleGroup = {
  slug: "col",
  name: "Col",
  options: [
    { slug: "rond", name: "Col rond", icon: "col-rond" },
    { slug: "v", name: "Col V", icon: "col-v" },
    { slug: "bateau", name: "Col bateau", icon: "col-bateau" },
    { slug: "chale", name: "Col châle", icon: "col-chale" },
  ],
};

const BRODERIE_COMPLETE: StyleGroup = {
  slug: "broderie",
  name: "Broderie",
  options: [
    { slug: "sans", name: "Sans broderie", icon: "brod-sans" },
    { slug: "simple", name: "Sfifa simple", icon: "brod-simple" },
    { slug: "riche", name: "Broderie riche", icon: "brod-riche" },
    { slug: "doree", name: "Fils dorés", icon: "brod-doree" },
  ],
};

const BRODERIE_SOBRE: StyleGroup = {
  slug: "broderie",
  name: "Broderie",
  options: [
    { slug: "sans", name: "Sans broderie", icon: "brod-sans" },
    { slug: "simple", name: "Sfifa simple", icon: "brod-simple" },
    { slug: "riche", name: "Broderie riche", icon: "brod-riche" },
  ],
};

const BRODERIE_MINIMALE: StyleGroup = {
  slug: "broderie",
  name: "Broderie",
  options: [
    { slug: "sans", name: "Sans broderie", icon: "brod-sans" },
    { slug: "simple", name: "Sfifa simple", icon: "brod-simple" },
  ],
};

const MANCHES_AMPLES: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "amples", name: "Manches amples", icon: "manche-ample" },
    { slug: "longues", name: "Manches longues", icon: "manche-longue" },
  ],
};

const MANCHES_STANDARD: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "longues", name: "Manches longues", icon: "manche-longue" },
    { slug: "courtes", name: "Manches courtes", icon: "manche-courte" },
    { slug: "amples", name: "Manches amples", icon: "manche-ample" },
  ],
};

const MANCHES_COURTES_LONGUES: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "longues", name: "Manches longues", icon: "manche-longue" },
    { slug: "courtes", name: "Manches courtes", icon: "manche-courte" },
  ],
};

const MANCHES_FEMME: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "longues", name: "Manches longues", icon: "manche-longue" },
    { slug: "courtes", name: "Manches courtes", icon: "manche-courte" },
    { slug: "amples", name: "Manches amples", icon: "manche-ample" },
    { slug: "sans", name: "Sans manches", icon: "manche-sans" },
  ],
};

const LONGUEUR_COMPLETE: StyleGroup = {
  slug: "longueur",
  name: "Longueur",
  options: [
    { slug: "courte", name: "Au genou", icon: "long-courte" },
    { slug: "midi", name: "Mi-mollet", icon: "long-midi" },
    { slug: "longue", name: "Longue", icon: "long-longue" },
  ],
};

const LONGUEUR_LONGUE: StyleGroup = {
  slug: "longueur",
  name: "Longueur",
  options: [
    { slug: "midi", name: "Mi-mollet", icon: "long-midi" },
    { slug: "longue", name: "Longue", icon: "long-longue" },
  ],
};

// ---------------------------------------------------------------------------
// Grand boubou — le vêtement se choisit finition par finition, comme chez un
// tailleur (planche de cols, planche de manches…). Les groupes ci-dessous sont
// donc bien plus fournis que les groupes génériques, et chaque option a sa
// propre planche dessinée (`boubou-detail-icons.tsx`) : un « motif Ségou » ou
// une « manche cape » ne se déduisent d'aucun dessin composé.
//
// Partagés par les pièces d'apparat de la même coupe — grand boubou, baye
// lahat, agbada, tenue de cérémonie —, qui sont le même vêtement à la façon
// près. Les autres vêtements gardent les groupes génériques du dessus.
// ---------------------------------------------------------------------------

// Planches photographiques de l'atelier (`public/coupe/`) au lieu des dessins
// `bb-coupe-*` : une vraie planche de tailleur vaut mieux qu'un pictogramme.
// Le cadrage de la vignette rogne la légende incrustée en bas de chaque visuel
// (cf. l'étape « Style »), le nom de l'option étant déjà écrit sous la case.
const COUPE_BOUBOU: StyleGroup = {
  slug: "coupe",
  name: "Coupe",
  options: [
    { slug: "classique", name: "Classique (Mbubb)", photo: "/coupe/pl.jpg" },
    { slug: "royal", name: "Royal, très ample", photo: "/coupe/d.jpg" },
    { slug: "moderne", name: "Moderne ajusté", photo: "/coupe/a.jpg" },
    { slug: "trois-pieces", name: "Trois pièces", photo: "/coupe/e.jpg" },
    { slug: "court", name: "Court (3/4)", photo: "/coupe/b.jpg" },
  ],
};

const COL_BOUBOU: StyleGroup = {
  slug: "col",
  name: "Col",
  options: [
    { slug: "rond", name: "Col rond brodé simple", art: "bb-col-rond" },
    { slug: "mao", name: "Col Mao sans broderie", art: "bb-col-mao" },
    { slug: "encolure-brodee", name: "Encolure brodée complexe", art: "bb-col-encolure-brodee" },
    { slug: "fente", name: "Fente simple avec broderie discrète", art: "bb-col-fente" },
    { slug: "croise-plastron", name: "Col croisé avec plastron", art: "bb-col-croise-plastron" },
    { slug: "v", name: "Col en V avec motifs", art: "bb-col-v" },
    { slug: "mao-brode", name: "Col Mao brodé court", art: "bb-col-mao-brode" },
    { slug: "chemise", name: "Col chemise avec boutons dissimulés", art: "bb-col-chemise" },
    { slug: "croise", name: "Col croisé sans plastron", art: "bb-col-croise" },
  ],
};

const BRODERIE_BOUBOU: StyleGroup = {
  slug: "broderie",
  name: "Broderie",
  options: [
    { slug: "etoile", name: "Broderie « étoile »", art: "bb-brod-etoile" },
    { slug: "maillee", name: "Broderie maillée", art: "bb-brod-maillee" },
    { slug: "geometrique", name: "Géométrique large", art: "bb-brod-geometrique" },
    { slug: "croix", name: "Broderie « croix »", art: "bb-brod-croix" },
    { slug: "plastron-reduit", name: "Plastron réduit brodé", art: "bb-brod-plastron-reduit" },
    { slug: "segou", name: "Motif « Ségou » complexe", art: "bb-brod-segou" },
    { slug: "diamant", name: "« Diamant » minimaliste", art: "bb-brod-diamant" },
    { slug: "fente-plastron", name: "Fente brodée et plastron", art: "bb-brod-fente-plastron" },
    { slug: "doree", name: "Broderie fil d'or", art: "bb-brod-doree" },
    { slug: "sans", name: "Sans broderie", art: "bb-brod-sans" },
  ],
};

const POCHES_BOUBOU: StyleGroup = {
  slug: "poches",
  name: "Poches",
  options: [
    { slug: "poitrine", name: "Poche poitrine", art: "bb-poche-poitrine" },
    { slug: "poitrine-brodee", name: "Poche poitrine brodée", art: "bb-poche-poitrine-brodee" },
    { slug: "laterales", name: "Poches latérales", art: "bb-poche-laterales" },
    {
      slug: "poitrine-laterales",
      name: "Poitrine + latérales",
      art: "bb-poche-poitrine-laterales",
    },
    { slug: "sans", name: "Sans poche", art: "bb-poche-sans" },
  ],
};

const MANCHES_BOUBOU: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "evasee", name: "Classique évasée", art: "bb-manche-evasee" },
    { slug: "tres-large", name: "Très large", art: "bb-manche-tres-large" },
    { slug: "cape", name: "« Cape » traditionnelle", art: "bb-manche-cape" },
    { slug: "evasee-brodee", name: "Évasée brodée", art: "bb-manche-evasee-brodee" },
    { slug: "evasee-motif", name: "Évasée à grand motif", art: "bb-manche-evasee-motif" },
    { slug: "ajustee", name: "Ajustée à poignet", art: "bb-manche-ajustee" },
    { slug: "ajustee-brodee", name: "Ajustée brodée", art: "bb-manche-ajustee-brodee" },
    { slug: "ajustee-bord", name: "Ajustée à bord brodé", art: "bb-manche-ajustee-bord" },
    { slug: "fente-boutons", name: "À fente et boutons", art: "bb-manche-fente-boutons" },
    { slug: "rabat", name: "Moderne à rabat", art: "bb-manche-rabat" },
  ],
};

/** Les cinq planches d'un grand boubou, dans l'ordre où on les choisit. */
const BOUBOU_GROUPS: StyleGroup[] = [
  COUPE_BOUBOU,
  COL_BOUBOU,
  BRODERIE_BOUBOU,
  POCHES_BOUBOU,
  MANCHES_BOUBOU,
];

// ---------------------------------------------------------------------------
// Per-garment catalogue, keyed by model slug (see `src/lib/fixtures.ts`).
// ---------------------------------------------------------------------------

export const STYLE_GROUPS_BY_SLUG: Record<string, StyleGroup[]> = {
  "grand-boubou": BOUBOU_GROUPS,

  "kaftan": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Kaftan droit", icon: "kaftan-droit" },
        { slug: "cintre", name: "Kaftan cintré", icon: "kaftan-cintre" },
        { slug: "long", name: "Kaftan long", icon: "kaftan-long" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_STANDARD,
  ],

  "chemise": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droite", name: "Coupe droite", icon: "chemise-droite" },
        { slug: "cintree", name: "Coupe cintrée", icon: "chemise-cintree" },
        { slug: "dashiki", name: "Dashiki", icon: "dashiki" },
      ],
    },
    COL_HOMME,
    BRODERIE_SOBRE,
    MANCHES_COURTES_LONGUES,
  ],

  "costume": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "mao", name: "Costume col Mao", icon: "costume-mao" },
        { slug: "senghor", name: "Veste Senghor", icon: "senghor" },
        { slug: "classique", name: "Costume classique", icon: "costume-classique" },
      ],
    },
    COL_COSTUME,
    BRODERIE_MINIMALE,
  ],

  "ensemble-bazin": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Ensemble droit", icon: "ensemble-droit" },
        { slug: "ample", name: "Ensemble ample", icon: "ensemble-ample" },
        { slug: "trois-pieces", name: "Trois pièces", icon: "boubou-3pieces" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  // Agbada et baye lahat sont des grands boubous : mêmes planches.
  "agbada": BOUBOU_GROUPS,

  "kaftan-brode": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Kaftan droit", icon: "kaftan-droit" },
        { slug: "cintre", name: "Kaftan cintré", icon: "kaftan-cintre" },
        { slug: "long", name: "Kaftan long", icon: "kaftan-long" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_STANDARD,
  ],

  "tenue-ceremonie": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "trois-pieces", name: "Grand boubou 3 pièces", icon: "boubou-3pieces" },
        { slug: "boubou", name: "Boubou classique", icon: "boubou" },
        { slug: "senghor", name: "Veste Senghor", icon: "senghor" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  "costume-africain": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "mao", name: "Costume col Mao", icon: "costume-mao" },
        { slug: "senghor", name: "Veste Senghor", icon: "senghor" },
        { slug: "classique", name: "Costume classique", icon: "costume-classique" },
      ],
    },
    COL_COSTUME,
    BRODERIE_MINIMALE,
  ],

  // Une veste-blazer a des manches, mais pas de longueur à choisir.
  "veste-africaine": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "senghor", name: "Veste Senghor", icon: "senghor" },
        { slug: "mao", name: "Col Mao", icon: "costume-mao" },
        { slug: "classique", name: "Blazer classique", icon: "costume-classique" },
      ],
    },
    COL_COSTUME,
    BRODERIE_MINIMALE,
    MANCHES_COURTES_LONGUES,
  ],

  // Un gilet n'a pas de manches — le groupe n'existe pas ici.
  "gilet": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Gilet droit", icon: "costume-classique" },
        { slug: "cintre", name: "Gilet cintré", icon: "chemise-cintree" },
      ],
    },
    COL_COSTUME,
    BRODERIE_SOBRE,
  ],

  // Un pantalon n'a ni col ni manches — comme la jupe.
  "pantalon": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Pantalon droit", icon: "ensemble-droit" },
        { slug: "cintre", name: "Pantalon cintré", icon: "kaftan-cintre" },
        { slug: "saroual", name: "Large / saroual", icon: "ensemble-ample" },
      ],
    },
    BRODERIE_MINIMALE,
  ],

  "dashiki": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Dashiki classique", icon: "dashiki" },
        { slug: "droite", name: "Coupe droite", icon: "chemise-droite" },
        { slug: "cintree", name: "Coupe cintrée", icon: "chemise-cintree" },
      ],
    },
    COL_HOMME,
    BRODERIE_SOBRE,
    MANCHES_STANDARD,
  ],

  "baye-lahat": BOUBOU_GROUPS,

  // Un thiaya est un pantalon : ni col ni manches, comme la jupe.
  "thiaya": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Coupe droite", icon: "ensemble-droit" },
        { slug: "saroual", name: "Large / saroual", icon: "ensemble-ample" },
        { slug: "cintre", name: "Coupe cintrée", icon: "kaftan-cintre" },
      ],
    },
    BRODERIE_MINIMALE,
  ],

  "robe": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droite", name: "Robe droite", icon: "robe-droite" },
        { slug: "evasee", name: "Robe évasée", icon: "robe-evasee" },
        { slug: "sirene", name: "Robe sirène", icon: "robe-sirene" },
        { slug: "empire", name: "Taille empire", icon: "robe-empire" },
      ],
    },
    LONGUEUR_COMPLETE,
    COL_FEMME,
    BRODERIE_COMPLETE,
    MANCHES_FEMME,
  ],

  "boubou-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Boubou classique", icon: "boubou" },
        { slug: "droit", name: "Boubou droit", icon: "kaftan-droit" },
        { slug: "court", name: "Boubou court", icon: "boubou-court" },
      ],
    },
    LONGUEUR_LONGUE,
    COL_FEMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  "grande-robe": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "evasee", name: "Robe évasée", icon: "robe-evasee" },
        { slug: "droite", name: "Robe droite", icon: "robe-droite" },
        { slug: "empire", name: "Taille empire", icon: "robe-empire" },
      ],
    },
    LONGUEUR_LONGUE,
    COL_FEMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  // Un gilet femme n'a pas de manches — le groupe n'existe pas ici.
  "gilet-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "cintre", name: "Gilet cintré", icon: "chemise-cintree" },
        { slug: "droit", name: "Gilet droit", icon: "costume-classique" },
      ],
    },
    COL_FEMME,
    BRODERIE_SOBRE,
  ],

  "chemise-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "cintree", name: "Coupe cintrée", icon: "chemise-cintree" },
        { slug: "droite", name: "Coupe droite", icon: "chemise-droite" },
      ],
    },
    COL_FEMME,
    BRODERIE_SOBRE,
    MANCHES_FEMME,
  ],

  // Un pantalon n'a ni col ni manches.
  "pantalon-large": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "large", name: "Coupe large", icon: "ensemble-ample" },
        { slug: "droit", name: "Coupe droite", icon: "ensemble-droit" },
        { slug: "fluide", name: "Taille haute fluide", icon: "kaftan-cintre" },
      ],
    },
    BRODERIE_MINIMALE,
  ],

  "robe-soiree": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "sirene", name: "Robe sirène", icon: "robe-sirene" },
        { slug: "evasee", name: "Robe évasée", icon: "robe-evasee" },
        { slug: "droite", name: "Robe droite", icon: "robe-droite" },
        { slug: "empire", name: "Taille empire", icon: "robe-empire" },
      ],
    },
    LONGUEUR_LONGUE,
    COL_FEMME,
    BRODERIE_COMPLETE,
    MANCHES_FEMME,
  ],

  "robe-coupee": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droite", name: "Robe droite", icon: "robe-droite" },
        { slug: "evasee", name: "Robe évasée", icon: "robe-evasee" },
        { slug: "empire", name: "Taille empire", icon: "robe-empire" },
      ],
    },
    LONGUEUR_COMPLETE,
    COL_FEMME,
    BRODERIE_SOBRE,
    MANCHES_FEMME,
  ],

  "tailleur-pantalon": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Tailleur classique", icon: "costume-classique" },
        { slug: "cintre", name: "Veste cintrée", icon: "chemise-cintree" },
      ],
    },
    COL_FEMME,
    BRODERIE_MINIMALE,
    MANCHES_COURTES_LONGUES,
  ],

  "veste-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Blazer classique", icon: "costume-classique" },
        { slug: "cintre", name: "Veste cintrée", icon: "chemise-cintree" },
      ],
    },
    COL_FEMME,
    BRODERIE_MINIMALE,
    MANCHES_COURTES_LONGUES,
  ],

  "bureau-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Ensemble droit", icon: "ensemble-droit" },
        { slug: "tailleur", name: "Tailleur", icon: "costume-classique" },
        { slug: "ample", name: "Ensemble ample", icon: "ensemble-ample" },
      ],
    },
    COL_FEMME,
    BRODERIE_SOBRE,
    MANCHES_FEMME,
  ],

  "ceremonie-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "grande-robe", name: "Grande robe", icon: "boubou" },
        { slug: "trois-pieces", name: "Ensemble 3 pièces", icon: "boubou-3pieces" },
        { slug: "ample", name: "Ensemble ample", icon: "ensemble-ample" },
      ],
    },
    LONGUEUR_LONGUE,
    COL_FEMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  "thiaya-femme": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Taille basse droite", icon: "ensemble-droit" },
        { slug: "cintre", name: "Haut cintré", icon: "chemise-cintree" },
        { slug: "ample", name: "Coupe ample", icon: "ensemble-ample" },
      ],
    },
    LONGUEUR_LONGUE,
    COL_FEMME,
    BRODERIE_COMPLETE,
    MANCHES_FEMME,
  ],

  "ensemble": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Ensemble droit", icon: "ensemble-droit" },
        { slug: "ample", name: "Ensemble ample", icon: "ensemble-ample" },
      ],
    },
    COL_FEMME,
    BRODERIE_SOBRE,
    MANCHES_FEMME,
  ],

  // A skirt has no collar and no sleeves — those groups simply do not exist here.
  "jupe": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droite", name: "Jupe droite", icon: "jupe-droite" },
        { slug: "crayon", name: "Jupe crayon", icon: "jupe-crayon" },
        { slug: "plissee", name: "Jupe plissée", icon: "jupe-plissee" },
        { slug: "evasee", name: "Jupe évasée", icon: "jupe-evasee" },
      ],
    },
    LONGUEUR_COMPLETE,
    BRODERIE_SOBRE,
  ],

  "boubou-enfant": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Boubou classique", icon: "boubou" },
        { slug: "court", name: "Boubou court", icon: "boubou-court" },
      ],
    },
    BRODERIE_MINIMALE,
    MANCHES_COURTES_LONGUES,
  ],

  "ensemble-enfant": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "droit", name: "Ensemble droit", icon: "ensemble-droit" },
        { slug: "ample", name: "Ensemble ample", icon: "ensemble-ample" },
      ],
    },
    BRODERIE_MINIMALE,
    MANCHES_COURTES_LONGUES,
  ],
};

/**
 * Une création de tailleur absente de la table (« Boubou cérémonie de Fatou »,
 * un modèle ajouté en base) : on la ramène sur la pièce de référence la plus
 * proche, par mots-clés du slug et du nom. L'ordre compte — « Boubou enfant »
 * doit tomber sur la règle enfant, pas sur celle du grand boubou.
 *
 * On ne devine JAMAIS au-delà de ça : un vêtement qu'aucune règle ne reconnaît
 * garde les finitions génériques, sans « Coupe » — c'est comme ça qu'une robe
 * finirait par proposer des kaftans.
 */
const BY_KEYWORD: [RegExp, string][] = [
  // Enfant d'abord : « Boubou enfant » n'est pas un grand boubou.
  [/ensemble.*enfant|enfant.*ensemble/, "ensemble-enfant"],
  [/enfant|b[ée]b[ée]/, "boubou-enfant"],
  // Puis les pièces femme, avant les règles générales : une « robe de
  // cérémonie » reste une robe, elle ne devient pas un boubou d'homme.
  [/robe.*soir|soir.*robe/, "robe-soiree"],
  [/grande.?robe/, "grande-robe"],
  [/robe/, "robe"],
  [/jupe/, "jupe"],
  [/boubou.*femme|femme.*boubou/, "boubou-femme"],
  [/c[ée]r[ée]monie.*femme|femme.*c[ée]r[ée]monie/, "ceremonie-femme"],
  // Grandes tenues homme.
  [/agbada/, "agbada"],
  [/boubou|baye.?lahat/, "grand-boubou"],
  [/c[ée]r[ée]monie|mariage/, "tenue-ceremonie"],
  [/kaftan|caftan/, "kaftan"],
  [/dashiki/, "dashiki"],
  [/bazin/, "ensemble-bazin"],
  // Costumes, vestes, hauts et bas.
  [/tailleur.?pantalon/, "tailleur-pantalon"],
  [/costume/, "costume"],
  [/veste|blazer/, "veste-africaine"],
  [/gilet/, "gilet"],
  [/chemise|tunique/, "chemise"],
  [/pantalon|saroual|thiaya/, "pantalon"],
  [/ensemble|bureau/, "ensemble"],
];

/**
 * A garment with no entry above (a Supabase row the catalogue does not know
 * yet) gets the generic finishings — but never a "Coupe", because guessing the
 * cuts of an unknown garment is how a robe ends up offering kaftans.
 */
const FALLBACK_GROUPS: StyleGroup[] = [COL_HOMME, BRODERIE_COMPLETE, MANCHES_STANDARD];

/**
 * La clé de catalogue d'un modèle : son slug s'il est connu, sinon la pièce de
 * référence la plus proche. Partagée par les groupes de style et par les
 * dessins de finitions (`garment-detail-icons.tsx`), pour qu'un même vêtement
 * ne soit jamais rangé dans deux familles différentes.
 */
export function garmentStyleKey(model: GarmentModel | null | undefined): string | null {
  if (!model) return null;
  if (model.slug && STYLE_GROUPS_BY_SLUG[model.slug]) return model.slug;

  const haystack = `${model.slug ?? ""} ${model.name}`.toLowerCase();
  return BY_KEYWORD.find(([re]) => re.test(haystack))?.[1] ?? null;
}

/** The groups offered for one garment. Unknown garment → generic finishings. */
export function styleGroupsFor(model: GarmentModel | null | undefined): StyleGroup[] {
  const key = garmentStyleKey(model);
  if (!key) return FALLBACK_GROUPS;
  return STYLE_GROUPS_BY_SLUG[key] ?? FALLBACK_GROUPS;
}

/** First option of each group — the pre-selected default (Hockerty-style). */
export function styleDetailDefaults(
  model: GarmentModel | null | undefined,
): Record<string, string> {
  return Object.fromEntries(styleGroupsFor(model).map((g) => [g.slug, g.options[0].slug]));
}

/**
 * Human-readable "Coupe: Robe droite · Col: V · …" for recap / notes. Driven by
 * the garment's own groups, so a detail left over from a previously configured
 * garment is ignored rather than mislabelled.
 */
export function styleDetailSummary(
  model: GarmentModel | null | undefined,
  details: Record<string, string>,
): { group: string; option: string }[] {
  return styleGroupsFor(model).flatMap((g) => {
    const opt = g.options.find((o) => o.slug === details[g.slug]);
    return opt ? [{ group: g.name, option: opt.name }] : [];
  });
}
