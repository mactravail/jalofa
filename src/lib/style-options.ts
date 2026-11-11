import type { BoubouDetailIconName } from "@/components/order/boubou-detail-icons";
import type { ShirtDetailIconName } from "@/components/order/shirt-detail-icons";
import type { GownDetailIconName } from "@/components/order/gown-detail-icons";
import type { WomensSuitDetailIconName } from "@/components/order/womens-suit-detail-icons";
import type { LoungeDetailIconName } from "@/components/order/lounge-detail-icons";
import type { StyleIconName } from "@/components/order/style-icons";
import type { TuxedoDetailIconName } from "@/components/order/tuxedo-detail-icons";
import { formatPrice } from "@/lib/constants";
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
 *  · `photo` — une vraie photo : la planche d'un modèle JALOFA (`/public`), ou
 *    celle qu'un tailleur a publiée avec son modèle (avec son éventuel `extra`).
 */
/** « Seulement si le groupe `group` a l'un des choix `in` ». */
export type StyleCondition = { group: string; in: string[] };

export type StyleGroupOption = (
  | { slug: string; name: string; icon: StyleIconName; art?: never; photo?: never; extra?: never }
  | {
      slug: string;
      name: string;
      art:
        | BoubouDetailIconName
        | ShirtDetailIconName
        | TuxedoDetailIconName
        | GownDetailIconName
        | WomensSuitDetailIconName
        | LoungeDetailIconName;
      icon?: never;
      photo?: never;
      extra?: never;
    }
  // Un chemin ou une URL n'est jamais vide — le type le dit, ce qui permet de
  // distinguer les trois variantes par simple test de vérité.
  | { slug: string; name: string; photo: `${string}/${string}`; extra?: number; icon?: never; art?: never }
) & {
  /**
   * Option proposée seulement si un autre groupe a l'un de ces choix — un
   * bustier sans bretelles n'existe que sur une robe sans manches.
   */
  showIf?: StyleCondition;
};

export type StyleGroup = {
  slug: string;
  name: string;
  options: StyleGroupOption[];
  /**
   * Groupe montré seulement si un autre groupe a l'un de ces choix — un
   * poignet n'existe que sur une manche longue ou trois-quarts.
   */
  showIf?: StyleCondition;
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
// Chemise JALOFA EUROPE — planches façon Sumissura : une chemise entière dessinée
// où un seul détail change d'une case à l'autre, plus des vues rapprochées du
// col et du poignet (`shirt-detail-icons.tsx`). Rien d'africain ici : pas de
// dashiki, pas de broderie.
// ---------------------------------------------------------------------------

const MODELE_CHEMISE_FEMME: StyleGroup = {
  slug: "modele",
  name: "Modèle",
  options: [
    { slug: "chemise", name: "Chemise", art: "sh-modele-chemise" },
    { slug: "blouse", name: "Blouse", art: "sh-modele-blouse" },
  ],
};

const MANCHES_CHEMISE_FEMME: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "longues", name: "Longues", art: "sh-manche-longues" },
    { slug: "trois-quarts", name: "Trois-quarts", art: "sh-manche-trois-quarts" },
    { slug: "courtes", name: "Courtes", art: "sh-manche-courtes" },
    { slug: "sans", name: "Sans manches", art: "sh-manche-sans" },
  ],
};

const COL_CHEMISE_FEMME: StyleGroup = {
  slug: "col",
  name: "Col",
  options: [
    { slug: "classique", name: "Classique", art: "sh-col-classique" },
    { slug: "classique-2", name: "Classique 2 boutons", art: "sh-col-classique-2" },
    { slug: "pointes-courtes", name: "Pointes courtes", art: "sh-col-pointes-courtes" },
    { slug: "boutonne", name: "Boutonné", art: "sh-col-boutonne" },
    { slug: "rond", name: "Col Claudine", art: "sh-col-rond" },
    { slug: "mao", name: "Col Mao", art: "sh-col-mao" },
    { slug: "lavalliere", name: "Lavallière (nœud)", art: "sh-col-lavalliere" },
  ],
};

const POIGNETS_CHEMISE: StyleGroup = {
  slug: "poignets",
  name: "Poignets",
  showIf: { group: "manches", in: ["longues", "trois-quarts"] },
  options: [
    { slug: "un-bouton", name: "1 bouton", art: "sh-poignet-un-bouton" },
    { slug: "deux-boutons", name: "2 boutons", art: "sh-poignet-deux-boutons" },
    { slug: "mousquetaire", name: "Mousquetaire", art: "sh-poignet-mousquetaire" },
    { slug: "arrondi", name: "Arrondi", art: "sh-poignet-arrondi" },
  ],
};

const BOUTONNAGE_CHEMISE: StyleGroup = {
  slug: "boutonnage",
  name: "Boutonnage",
  options: [
    { slug: "classique", name: "Patte classique", art: "sh-patte-classique" },
    { slug: "cachee", name: "Patte cachée", art: "sh-patte-cachee" },
    { slug: "sans-patte", name: "Sans patte", art: "sh-patte-sans" },
  ],
};

const POCHE_CHEMISE: StyleGroup = {
  slug: "poche",
  name: "Poche",
  options: [
    { slug: "sans", name: "Sans poche", art: "sh-poche-sans" },
    { slug: "une", name: "Une poche", art: "sh-poche-une" },
    { slug: "deux", name: "Deux poches", art: "sh-poche-deux" },
  ],
};

const BAS_CHEMISE: StyleGroup = {
  slug: "bas",
  name: "Bas",
  options: [
    { slug: "arrondi", name: "Arrondi", art: "sh-bas-arrondi" },
    { slug: "droit", name: "Droit", art: "sh-bas-droit" },
  ],
};

const CHEMISE_FEMME_GROUPS: StyleGroup[] = [
  MODELE_CHEMISE_FEMME,
  MANCHES_CHEMISE_FEMME,
  COL_CHEMISE_FEMME,
  POIGNETS_CHEMISE,
  BOUTONNAGE_CHEMISE,
  POCHE_CHEMISE,
  BAS_CHEMISE,
];

// Chemise HOMME — ses propres planches, inspirées de Hockerty / Sumissura
// homme : pas de Blouse ni de lavallière, mais « Comment la porterez-vous ? »
// et la poche en gros plan.

const MANCHES_CHEMISE_HOMME: StyleGroup = {
  slug: "manches",
  name: "Manches",
  options: [
    { slug: "longues", name: "Longues", art: "sh-manche-longues" },
    { slug: "courtes", name: "Courtes", art: "sh-manche-courtes" },
  ],
};

const PORTER_CHEMISE_HOMME: StyleGroup = {
  slug: "porter",
  name: "Comment la porterez-vous ?",
  options: [
    { slug: "dedans", name: "Dans le pantalon", art: "sh-porter-dedans" },
    { slug: "dehors", name: "Par-dessus le pantalon", art: "sh-porter-dehors" },
  ],
};

const COL_CHEMISE_HOMME: StyleGroup = {
  slug: "col",
  name: "Col",
  options: [
    { slug: "classique", name: "Classique", art: "sh-col-classique" },
    { slug: "italien", name: "Col italien", art: "sh-col-italien" },
    { slug: "classique-2", name: "Classique 2 boutons", art: "sh-col-classique-2" },
    { slug: "pointes-courtes", name: "Pointes courtes", art: "sh-col-pointes-courtes" },
    { slug: "boutonne", name: "Boutonné", art: "sh-col-boutonne" },
    { slug: "mao", name: "Col Mao", art: "sh-col-mao" },
  ],
};

const POIGNETS_CHEMISE_HOMME: StyleGroup = {
  slug: "poignets",
  name: "Poignets",
  showIf: { group: "manches", in: ["longues"] },
  options: [
    { slug: "un-bouton", name: "1 bouton", art: "sh-poignet-un-bouton" },
    { slug: "deux-boutons", name: "2 boutons", art: "sh-poignet-deux-boutons" },
    { slug: "mousquetaire", name: "Mousquetaire", art: "sh-poignet-mousquetaire" },
    { slug: "arrondi", name: "Arrondi", art: "sh-poignet-arrondi" },
  ],
};

const POCHE_CHEMISE_HOMME: StyleGroup = {
  slug: "poche",
  name: "Poche",
  options: [
    { slug: "sans", name: "Sans poche", art: "sh-pochette-sans" },
    { slug: "simple", name: "Sans rabat", art: "sh-pochette-simple" },
    { slug: "rabat", name: "Avec rabat", art: "sh-pochette-rabat" },
  ],
};

const CHEMISE_HOMME_GROUPS: StyleGroup[] = [
  MANCHES_CHEMISE_HOMME,
  PORTER_CHEMISE_HOMME,
  COL_CHEMISE_HOMME,
  POIGNETS_CHEMISE_HOMME,
  BOUTONNAGE_CHEMISE,
  POCHE_CHEMISE_HOMME,
  BAS_CHEMISE,
];

// ---------------------------------------------------------------------------
// Smoking HOMME (JALOFA EUROPE) — planches inspirées de Hockerty : la veste
// (style, tissus, revers, poches) puis le pantalon (bandes de satin, longueur,
// pinces, réglage de la taille). Dessins : `tuxedo-detail-icons.tsx`.
// ---------------------------------------------------------------------------

const SMOKING_HOMME_GROUPS: StyleGroup[] = [
  {
    slug: "style",
    name: "Style de veste",
    options: [
      { slug: "droit-1", name: "Droit 1 bouton", art: "tx-veste-1" },
      { slug: "droit-2", name: "Droit 2 boutons", art: "tx-veste-2" },
      { slug: "croise-2", name: "Croisé 2 boutons", art: "tx-veste-db2" },
      { slug: "croise-4", name: "Croisé 4 boutons", art: "tx-veste-db4" },
      { slug: "croise-6", name: "Croisé 6 boutons", art: "tx-veste-db6" },
    ],
  },
  {
    slug: "tissus",
    name: "Combinaison de tissus",
    options: [
      { slug: "meme", name: "Même tissu", art: "tx-tissu-meme" },
      { slug: "different", name: "Tissu différent", art: "tx-tissu-different" },
    ],
  },
  {
    slug: "revers",
    name: "Revers",
    options: [
      { slug: "cran", name: "Crantés", art: "tx-revers-cran" },
      { slug: "pointe", name: "En pointe", art: "tx-revers-pointe" },
      { slug: "chale", name: "Châle", art: "tx-revers-chale" },
    ],
  },
  {
    slug: "largeur-revers",
    name: "Largeur du revers",
    options: [
      { slug: "etroit", name: "Étroits", art: "tx-largeur-etroit" },
      { slug: "moyen", name: "Moyens", art: "tx-largeur-moyen" },
      { slug: "large", name: "Larges", art: "tx-largeur-large" },
    ],
  },
  {
    slug: "poches",
    name: "Poches",
    options: [
      { slug: "rabat", name: "À rabat", art: "tx-poche-rabat" },
      { slug: "passepoil", name: "Passepoilées", art: "tx-poche-passepoil" },
      { slug: "ticket", name: "Passepoilées ×3", art: "tx-poche-ticket" },
    ],
  },
  {
    slug: "bandes",
    name: "Bandes latérales",
    options: [
      { slug: "sans", name: "Sans", art: "tx-bande-sans" },
      { slug: "avec", name: "Avec", art: "tx-bande-avec" },
    ],
  },
  {
    slug: "longueur",
    name: "Longueur du pantalon",
    options: [
      { slug: "long", name: "Long", art: "tx-longueur-long" },
      { slug: "bermuda", name: "Bermuda", art: "tx-longueur-bermuda" },
    ],
  },
  {
    slug: "pinces",
    name: "Pinces",
    options: [
      { slug: "sans", name: "Sans pinces", art: "tx-pinces-0" },
      { slug: "une", name: "Avec pinces", art: "tx-pinces-1" },
      { slug: "deux", name: "Doubles pinces", art: "tx-pinces-2" },
    ],
  },
  {
    slug: "taille",
    name: "Réglage de la taille",
    options: [
      { slug: "standard", name: "Standard", art: "tx-taille-standard" },
      { slug: "pattes", name: "Pattes de serrage", art: "tx-taille-pattes" },
      { slug: "active", name: "Taille élastique", art: "tx-taille-active" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Costume 3 pièces HOMME (JALOFA EUROPE) — planches inspirées de Hockerty :
// veste, puis pantalon, puis gilet. Dessins `cs-*` de `tuxedo-detail-icons.tsx`.
// ---------------------------------------------------------------------------

const COSTUME_HOMME_GROUPS: StyleGroup[] = [
  // --- Veste ---
  {
    slug: "style",
    name: "Style de veste",
    options: [
      { slug: "droit-1", name: "Droit 1 bouton", art: "cs-veste-1" },
      { slug: "droit-2", name: "Droit 2 boutons", art: "cs-veste-2" },
      { slug: "droit-3", name: "Droit 3 boutons", art: "cs-veste-3" },
    ],
  },
  {
    slug: "tissus",
    name: "Combinaison de tissus",
    options: [
      { slug: "meme", name: "Même tissu", art: "cs-tissu-meme" },
      { slug: "different", name: "Tissu différent", art: "cs-tissu-different" },
    ],
  },
  {
    slug: "revers",
    name: "Revers de la veste",
    options: [
      { slug: "cran", name: "Crantés", art: "cs-revers-cran" },
      { slug: "pointe", name: "En pointe", art: "cs-revers-pointe" },
      { slug: "chale", name: "Châle", art: "cs-revers-chale" },
    ],
  },
  {
    slug: "poches",
    name: "Poches",
    options: [
      { slug: "rabat", name: "À rabat", art: "tx-poche-rabat" },
      { slug: "passepoil", name: "Passepoilées", art: "tx-poche-passepoil" },
      { slug: "plaquees", name: "Plaquées", art: "cs-poche-plaquee" },
      { slug: "rabat-3", name: "À rabat ×3", art: "cs-poche-rabat3" },
      { slug: "passepoil-3", name: "Passepoilées ×3", art: "tx-poche-ticket" },
    ],
  },
  {
    slug: "fente",
    name: "Fente",
    options: [
      { slug: "sans", name: "Sans fente", art: "cs-fente-sans" },
      { slug: "centrale", name: "Centrale", art: "cs-fente-centrale" },
      { slug: "laterales", name: "Latérales", art: "cs-fente-laterales" },
    ],
  },
  // --- Pantalon ---
  {
    slug: "longueur",
    name: "Longueur du pantalon",
    options: [
      { slug: "long", name: "Long", art: "cs-longueur-long" },
      { slug: "bermuda", name: "Bermuda", art: "cs-longueur-bermuda" },
    ],
  },
  {
    slug: "pinces",
    name: "Pinces",
    options: [
      { slug: "sans", name: "Sans pinces", art: "cs-pinces-0" },
      { slug: "une", name: "Avec pinces", art: "cs-pinces-1" },
      { slug: "deux", name: "Doubles pinces", art: "cs-pinces-2" },
    ],
  },
  {
    slug: "bas-pantalon",
    name: "Bas du pantalon",
    // Un revers au bas d'un bermuda n'a pas de sens.
    showIf: { group: "longueur", in: ["long"] },
    options: [
      { slug: "sans-revers", name: "Sans revers", art: "cs-bas-sans-revers" },
      { slug: "revers", name: "Avec revers", art: "cs-bas-revers" },
    ],
  },
  {
    slug: "taille",
    name: "Réglage de la taille",
    options: [
      { slug: "standard", name: "Standard", art: "tx-taille-standard" },
      { slug: "pattes", name: "Pattes de serrage", art: "tx-taille-pattes" },
      { slug: "active", name: "Taille élastique", art: "tx-taille-active" },
    ],
  },
  // --- Gilet ---
  {
    slug: "gilet",
    name: "Style du gilet",
    options: [
      { slug: "droit-4", name: "Droit 4 boutons", art: "cs-gilet-4" },
      { slug: "droit-5", name: "Droit 5 boutons", art: "cs-gilet-5" },
      { slug: "croise-6", name: "Croisé 6 boutons", art: "cs-gilet-db6" },
    ],
  },
  {
    slug: "revers-gilet",
    name: "Revers du gilet",
    options: [
      { slug: "sans", name: "Sans revers", art: "cs-gilet-revers-sans" },
      { slug: "cran", name: "Crantés", art: "cs-gilet-revers-cran" },
      { slug: "pointe", name: "En pointe", art: "cs-gilet-revers-pointe" },
    ],
  },
];

// Costume 2 pièces HOMME (JALOFA EUROPE) : la veste et le pantalon du 3 pièces,
// mêmes planches et mêmes dessins, sans le gilet.
const COSTUME_2P_HOMME_GROUPS: StyleGroup[] = COSTUME_HOMME_GROUPS.filter(
  (group) => group.slug !== "gilet" && group.slug !== "revers-gilet",
);

// ---------------------------------------------------------------------------
// Robe de soirée (JALOFA EUROPE) — planches façon Sumissura : silhouette,
// décolleté (gros plan), manches, dos (vue de dos), longueur, fente, taille.
// Dessins `gw-*` de `gown-detail-icons.tsx`.
// ---------------------------------------------------------------------------

const ROBE_SOIREE_EUROPE_GROUPS: StyleGroup[] = [
  {
    slug: "silhouette",
    name: "Silhouette",
    options: [
      { slug: "trapeze", name: "Trapèze", art: "gw-silhouette-trapeze" },
      { slug: "fourreau", name: "Fourreau", art: "gw-silhouette-fourreau" },
      { slug: "sirene", name: "Sirène", art: "gw-silhouette-sirene" },
      { slug: "princesse", name: "Princesse", art: "gw-silhouette-princesse" },
      { slug: "empire", name: "Empire", art: "gw-silhouette-empire" },
    ],
  },
  {
    slug: "decollete",
    name: "Décolleté",
    options: [
      { slug: "v", name: "En V", art: "gw-col-v" },
      { slug: "rond", name: "Rond", art: "gw-col-rond" },
      { slug: "bateau", name: "Bateau", art: "gw-col-bateau" },
      { slug: "coeur", name: "Cœur", art: "gw-col-coeur" },
      { slug: "bustier", name: "Bustier droit", art: "gw-col-bustier" },
      { slug: "epaules", name: "Épaules dénudées", art: "gw-col-epaules" },
      { slug: "asymetrique", name: "Asymétrique", art: "gw-col-asymetrique" },
      { slug: "americain", name: "Américain", art: "gw-col-americain" },
    ],
  },
  {
    slug: "manches",
    name: "Manches",
    // Bustier, cœur, épaules dénudées… : le décolleté décide déjà des épaules.
    showIf: { group: "decollete", in: ["v", "rond", "bateau"] },
    options: [
      { slug: "sans", name: "Sans manches", art: "gw-manche-sans" },
      { slug: "mancherons", name: "Mancherons", art: "gw-manche-mancherons" },
      { slug: "courtes", name: "Courtes", art: "gw-manche-courtes" },
      { slug: "trois-quarts", name: "Trois-quarts", art: "gw-manche-trois-quarts" },
      { slug: "longues", name: "Longues", art: "gw-manche-longues" },
    ],
  },
  {
    slug: "dos",
    name: "Dos",
    options: [
      { slug: "ferme", name: "Fermé", art: "gw-dos-ferme" },
      { slug: "v", name: "Dos en V", art: "gw-dos-v" },
      { slug: "nu", name: "Dos nu", art: "gw-dos-nu" },
      { slug: "lace", name: "Lacé", art: "gw-dos-lace" },
    ],
  },
  {
    slug: "longueur",
    name: "Longueur",
    options: [
      { slug: "sol", name: "Au sol", art: "gw-longueur-sol" },
      { slug: "cheville", name: "Cheville", art: "gw-longueur-cheville" },
      { slug: "midi", name: "Mi-mollet", art: "gw-longueur-midi" },
      { slug: "traine", name: "Avec traîne", art: "gw-longueur-traine" },
    ],
  },
  {
    slug: "fente",
    name: "Fente",
    options: [
      { slug: "sans", name: "Sans fente", art: "gw-fente-sans" },
      { slug: "cuisse", name: "Fendue à la cuisse", art: "gw-fente-cuisse" },
    ],
  },
  {
    slug: "ceinture",
    name: "Ceinture",
    options: [
      { slug: "sans", name: "Sans ceinture", art: "gw-taille-sans" },
      { slug: "simple", name: "Ceinture simple", art: "gw-taille-ceinture" },
      { slug: "noeud", name: "Ceinture à nœud", art: "gw-taille-noeud" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Robe de cérémonie (JALOFA EUROPE, tuile « Robes ») — mêmes dessins que la
// robe de soirée, mais ses propres choix : décolletés de cérémonie (carré,
// bretelles fines, col montant) et la finition (perles, dentelle, drapé).
// ---------------------------------------------------------------------------

const ROBE_CEREMONIE_EUROPE_GROUPS: StyleGroup[] = [
  {
    slug: "silhouette",
    name: "Silhouette",
    options: [
      { slug: "sirene", name: "Sirène", art: "gw-silhouette-sirene" },
      { slug: "fourreau", name: "Fourreau", art: "gw-silhouette-fourreau" },
      { slug: "trapeze", name: "Trapèze", art: "gw-silhouette-trapeze" },
      { slug: "princesse", name: "Princesse", art: "gw-silhouette-princesse" },
      { slug: "empire", name: "Empire", art: "gw-silhouette-empire" },
    ],
  },
  {
    slug: "decollete",
    name: "Décolleté",
    options: [
      { slug: "bretelles", name: "Bretelles fines", art: "gw-col-bretelles" },
      { slug: "v", name: "En V", art: "gw-col-v" },
      { slug: "rond", name: "Rond", art: "gw-col-rond" },
      { slug: "carre", name: "Carré", art: "gw-col-carre" },
      { slug: "coeur", name: "Cœur", art: "gw-col-coeur" },
      { slug: "bustier", name: "Bustier droit", art: "gw-col-bustier" },
      { slug: "epaules", name: "Épaules dénudées", art: "gw-col-epaules" },
      { slug: "montant", name: "Col montant", art: "gw-col-montant" },
    ],
  },
  {
    slug: "manches",
    name: "Manches",
    // Bretelles, bustier, cœur, épaules dénudées : pas de manches à choisir.
    showIf: { group: "decollete", in: ["v", "rond", "carre", "montant"] },
    options: [
      { slug: "sans", name: "Sans manches", art: "gw-manche-sans" },
      { slug: "mancherons", name: "Mancherons", art: "gw-manche-mancherons" },
      { slug: "courtes", name: "Courtes", art: "gw-manche-courtes" },
      { slug: "trois-quarts", name: "Trois-quarts", art: "gw-manche-trois-quarts" },
      { slug: "longues", name: "Longues", art: "gw-manche-longues" },
    ],
  },
  {
    slug: "dos",
    name: "Dos",
    options: [
      { slug: "v", name: "Dos en V", art: "gw-dos-v" },
      { slug: "ferme", name: "Fermé", art: "gw-dos-ferme" },
      { slug: "nu", name: "Dos nu", art: "gw-dos-nu" },
      { slug: "lace", name: "Lacé", art: "gw-dos-lace" },
    ],
  },
  {
    slug: "finition",
    name: "Finition",
    options: [
      { slug: "perles", name: "Perles et strass", art: "gw-finition-perles" },
      { slug: "unie", name: "Unie", art: "gw-finition-unie" },
      { slug: "dentelle", name: "Dentelle", art: "gw-finition-dentelle" },
      { slug: "drape", name: "Drapé", art: "gw-finition-drape" },
    ],
  },
  {
    slug: "longueur",
    name: "Longueur",
    options: [
      { slug: "sol", name: "Au sol", art: "gw-longueur-sol" },
      { slug: "cheville", name: "Cheville", art: "gw-longueur-cheville" },
      { slug: "midi", name: "Mi-mollet", art: "gw-longueur-midi" },
      { slug: "traine", name: "Avec traîne", art: "gw-longueur-traine" },
    ],
  },
  {
    slug: "fente",
    name: "Fente",
    options: [
      { slug: "sans", name: "Sans fente", art: "gw-fente-sans" },
      { slug: "cuisse", name: "Fendue à la cuisse", art: "gw-fente-cuisse" },
    ],
  },
  {
    slug: "ceinture",
    name: "Ceinture",
    options: [
      { slug: "sans", name: "Sans ceinture", art: "gw-taille-sans" },
      { slug: "simple", name: "Ceinture simple", art: "gw-taille-ceinture" },
      { slug: "noeud", name: "Ceinture à nœud", art: "gw-taille-noeud" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ensemble tailleur FEMME (JALOFA EUROPE) — façon Sumissura : la veste, puis le
// bas AU CHOIX pantalon ou jupe (la ceinture et la longueur ne concernent que
// la jupe), puis le gilet. Dessins `tf-*` de `womens-suit-detail-icons.tsx`.
// ---------------------------------------------------------------------------

const JUPES = ["jupe-crayon", "jupe-evasee"];

const ENSEMBLE_TAILLEUR_FEMME_GROUPS: StyleGroup[] = [
  // --- Veste ---
  {
    slug: "veste",
    name: "Style de veste",
    options: [
      { slug: "essentielle", name: "Essentielle", art: "tf-veste-essentielle" },
      { slug: "croisee", name: "Croisée longue", art: "tf-veste-croisee" },
      { slug: "heritage", name: "Courte cintrée", art: "tf-veste-heritage" },
    ],
  },
  {
    slug: "boutons",
    name: "Boutons",
    // La croisée a ses boutons, la courte en a toujours deux.
    showIf: { group: "veste", in: ["essentielle"] },
    options: [
      { slug: "1", name: "1 bouton", art: "tf-boutons-1" },
      { slug: "2", name: "2 boutons", art: "tf-boutons-2" },
    ],
  },
  {
    slug: "fente",
    name: "Fente",
    options: [
      { slug: "centrale", name: "Centrale", art: "tf-fente-centrale" },
      { slug: "sans", name: "Sans fente", art: "tf-fente-sans" },
    ],
  },
  {
    slug: "bas-veste",
    name: "Bas de la veste",
    // Une veste croisée a toujours le bas droit.
    showIf: { group: "veste", in: ["essentielle", "heritage"] },
    options: [
      { slug: "arrondi", name: "Arrondi", art: "tf-bas-arrondi" },
      { slug: "carre", name: "Carré", art: "tf-bas-carre" },
      { slug: "biseaute", name: "Biseauté", art: "tf-bas-biseaute" },
    ],
  },
  // --- Bas : pantalon OU jupe ---
  {
    slug: "bas",
    name: "Pantalon ou jupe",
    options: [
      { slug: "pantalon-large", name: "Pantalon large", art: "tf-pantalon-large" },
      { slug: "pantalon-droit", name: "Pantalon droit", art: "tf-pantalon-droit" },
      { slug: "jupe-crayon", name: "Jupe crayon", art: "tf-jupe-crayon" },
      { slug: "jupe-evasee", name: "Jupe évasée", art: "tf-jupe-evasee" },
    ],
  },
  {
    slug: "ceinture-jupe",
    name: "Ceinture de la jupe",
    showIf: { group: "bas", in: JUPES },
    options: [
      { slug: "avec", name: "Avec ceinture", art: "tf-ceinture-avec" },
      { slug: "sans", name: "Sans ceinture", art: "tf-ceinture-sans" },
    ],
  },
  {
    slug: "longueur-jupe",
    name: "Longueur de la jupe",
    showIf: { group: "bas", in: JUPES },
    options: [
      { slug: "genou", name: "Au genou", art: "tf-longueur-genou" },
      { slug: "courte", name: "Courte", art: "tf-longueur-courte" },
      { slug: "midi", name: "Mi-mollet", art: "tf-longueur-midi" },
    ],
  },
  // --- Gilet ---
  {
    slug: "gilet",
    name: "Gilet",
    options: [
      { slug: "sans", name: "Sans gilet", art: "tf-gilet-sans" },
      { slug: "avec", name: "Avec gilet", art: "tf-gilet-avec" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Tenue détente FEMME (JALOFA EUROPE) — after-work et week-end : le haut
// (style, encolure, manches) puis le bas (style, taille). Dessins `dt-*` de
// `lounge-detail-icons.tsx`.
// ---------------------------------------------------------------------------

const TENUE_DETENTE_FEMME_GROUPS: StyleGroup[] = [
  // --- Le haut ---
  {
    slug: "haut",
    name: "Le haut",
    options: [
      { slug: "tshirt", name: "T-shirt ample", art: "dt-haut-tshirt" },
      { slug: "sweat", name: "Sweat", art: "dt-haut-sweat" },
      { slug: "chemise", name: "Chemise ample", art: "dt-haut-chemise" },
      { slug: "debardeur", name: "Débardeur", art: "dt-haut-debardeur" },
    ],
  },
  {
    slug: "encolure",
    name: "Encolure",
    // La chemise a son col.
    showIf: { group: "haut", in: ["tshirt", "sweat", "debardeur"] },
    options: [
      { slug: "rond", name: "Ronde", art: "dt-encolure-rond" },
      { slug: "v", name: "En V", art: "dt-encolure-v" },
      { slug: "bateau", name: "Bateau", art: "dt-encolure-bateau" },
    ],
  },
  {
    slug: "manches",
    name: "Manches",
    // Le sweat a toujours des manches longues, le débardeur n'en a pas.
    showIf: { group: "haut", in: ["tshirt", "chemise"] },
    options: [
      { slug: "courtes", name: "Courtes", art: "dt-manches-courtes" },
      { slug: "longues", name: "Longues", art: "dt-manches-longues" },
    ],
  },
  // --- Le bas ---
  {
    slug: "bas",
    name: "Le bas",
    options: [
      { slug: "large", name: "Pantalon large", art: "dt-bas-large" },
      { slug: "droit", name: "Pantalon droit", art: "dt-bas-droit" },
      { slug: "jogging", name: "Jogging", art: "dt-bas-jogging" },
      { slug: "short", name: "Short", art: "dt-bas-short" },
      { slug: "jupe", name: "Jupe longue", art: "dt-bas-jupe" },
    ],
  },
  {
    slug: "taille",
    name: "Ceinture",
    options: [
      { slug: "elastique", name: "Élastique", art: "dt-taille-elastique" },
      { slug: "cordon", name: "Cordon à serrer", art: "dt-taille-cordon" },
      { slug: "nouer", name: "Ceinture à nouer", art: "dt-taille-nouer" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Robe de MARIÉE (JALOFA EUROPE) — la planche la plus fournie : silhouette,
// décolleté (dont illusion et reine Anne), manches (bouffantes, dentelle),
// dos (boutonné), traîne (de profil), matière, voile, ceinture bijou.
// Dessins `gw-*` de `gown-detail-icons.tsx`.
// ---------------------------------------------------------------------------

const ROBE_MARIAGE_EUROPE_GROUPS: StyleGroup[] = [
  {
    slug: "silhouette",
    name: "Silhouette",
    options: [
      { slug: "sirene", name: "Sirène", art: "gw-silhouette-sirene" },
      { slug: "princesse", name: "Princesse", art: "gw-silhouette-princesse" },
      { slug: "trapeze", name: "Trapèze", art: "gw-silhouette-trapeze" },
      { slug: "trompette", name: "Trompette", art: "gw-silhouette-trompette" },
      { slug: "fourreau", name: "Fourreau", art: "gw-silhouette-fourreau" },
      { slug: "empire", name: "Empire", art: "gw-silhouette-empire" },
    ],
  },
  // Les bras d'abord : une mariée choisit des manches longues, courtes ou pas
  // de manches du tout, et le décolleté suit. Toujours affiché.
  {
    slug: "manches",
    name: "Manches",
    options: [
      { slug: "dentelle", name: "Longues en dentelle", art: "gw-manche-dentelle" },
      { slug: "longues", name: "Longues", art: "gw-manche-longues" },
      { slug: "bouffantes", name: "Longues bouffantes", art: "gw-manche-bouffantes" },
      { slug: "trois-quarts", name: "Trois-quarts", art: "gw-manche-trois-quarts" },
      { slug: "courtes", name: "Courtes", art: "gw-manche-courtes" },
      { slug: "mancherons", name: "Mancherons", art: "gw-manche-mancherons" },
      { slug: "sans", name: "Sans manches", art: "gw-manche-sans" },
    ],
  },
  {
    slug: "decollete",
    name: "Décolleté",
    options: [
      { slug: "montant", name: "Col montant", art: "gw-col-montant" },
      { slug: "illusion", name: "Illusion (tulle)", art: "gw-col-illusion" },
      { slug: "reine-anne", name: "Reine Anne", art: "gw-col-reine-anne" },
      { slug: "v", name: "En V", art: "gw-col-v" },
      { slug: "bateau", name: "Bateau", art: "gw-col-bateau" },
      { slug: "carre", name: "Carré", art: "gw-col-carre" },
      // Sans bretelles ni épaules : seulement sur une robe sans manches.
      ...(
        [
          { slug: "coeur", name: "Cœur", art: "gw-col-coeur" },
          { slug: "bustier", name: "Bustier droit", art: "gw-col-bustier" },
          { slug: "epaules", name: "Épaules dénudées", art: "gw-col-epaules" },
          { slug: "bretelles", name: "Bretelles fines", art: "gw-col-bretelles" },
        ] as const
      ).map((o) => ({ ...o, showIf: { group: "manches", in: ["sans"] } })),
    ],
  },
  {
    slug: "dos",
    name: "Dos",
    options: [
      { slug: "boutons", name: "Boutonné", art: "gw-dos-boutons" },
      { slug: "ferme", name: "Fermé", art: "gw-dos-ferme" },
      { slug: "v", name: "Dos en V", art: "gw-dos-v" },
      { slug: "nu", name: "Dos nu", art: "gw-dos-nu" },
      { slug: "lace", name: "Lacé (corset)", art: "gw-dos-lace" },
    ],
  },
  {
    slug: "traine",
    name: "Traîne",
    options: [
      { slug: "chapelle", name: "Chapelle", art: "gw-traine-chapelle" },
      { slug: "sans", name: "Sans traîne", art: "gw-traine-sans" },
      { slug: "balayeuse", name: "Balayeuse", art: "gw-traine-balayeuse" },
      { slug: "cathedrale", name: "Cathédrale", art: "gw-traine-cathedrale" },
    ],
  },
  {
    slug: "matiere",
    name: "Matière",
    options: [
      { slug: "dentelle", name: "Dentelle", art: "gw-finition-dentelle" },
      { slug: "satin", name: "Satin", art: "gw-matiere-satin" },
      { slug: "perles", name: "Perles et broderie", art: "gw-finition-perles" },
      { slug: "tulle", name: "Tulle", art: "gw-matiere-tulle" },
      { slug: "drape", name: "Mousseline drapée", art: "gw-finition-drape" },
    ],
  },
  {
    slug: "voile",
    name: "Voile",
    options: [
      { slug: "long", name: "Voile long", art: "gw-voile-long" },
      { slug: "court", name: "Voile court", art: "gw-voile-court" },
      { slug: "mantille", name: "Mantille", art: "gw-voile-mantille" },
      { slug: "sans", name: "Sans voile", art: "gw-voile-sans" },
    ],
  },
  {
    slug: "ceinture",
    name: "Ceinture",
    options: [
      { slug: "sans", name: "Sans ceinture", art: "gw-taille-sans" },
      { slug: "bijou", name: "Ceinture bijou", art: "gw-taille-bijou" },
      { slug: "simple", name: "Ceinture simple", art: "gw-taille-ceinture" },
      { slug: "noeud", name: "Ceinture à nœud", art: "gw-taille-noeud" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Per-garment catalogue, keyed by model slug (see `src/lib/fixtures.ts`).
// ---------------------------------------------------------------------------

export const STYLE_GROUPS_BY_SLUG: Record<string, StyleGroup[]> = {
  "grand-boubou": BOUBOU_GROUPS,

  // JALOFA EUROPE — chaque pièce a SES planches, rattachées à son slug exact :
  // aucune règle par mot-clé n'y mène, on n'y arrive qu'en personnalisant
  // cette pièce-là. Chemise FEMME : seulement depuis /modeles/europe-chemise-femme.
  "europe-chemise-femme": CHEMISE_FEMME_GROUPS,
  // Idem pour la chemise HOMME : seulement depuis /modeles/europe-chemise-homme.
  "europe-chemise-homme": CHEMISE_HOMME_GROUPS,
  // Smoking HOMME : seulement depuis /modeles/europe-smoking-homme.
  "europe-smoking-homme": SMOKING_HOMME_GROUPS,
  // Costume 3 pièces HOMME : seulement depuis /modeles/europe-costume-homme.
  "europe-costume-homme": COSTUME_HOMME_GROUPS,
  // Costume 2 pièces HOMME : seulement depuis /modeles/europe-costume-2p-homme.
  "europe-costume-2p-homme": COSTUME_2P_HOMME_GROUPS,
  // Robe de soirée EUROPE : seulement depuis /modeles/europe-robe-soiree (la
  // robe de soirée africaine « robe-soiree » garde ses planches).
  "europe-robe-soiree": ROBE_SOIREE_EUROPE_GROUPS,
  // Robe de cérémonie EUROPE : seulement depuis /modeles/europe-robe (la robe
  // africaine « robe » garde ses planches).
  "europe-robe": ROBE_CEREMONIE_EUROPE_GROUPS,
  // Ensemble tailleur FEMME : seulement depuis /modeles/europe-costume-femme.
  "europe-costume-femme": ENSEMBLE_TAILLEUR_FEMME_GROUPS,
  // Robe de MARIÉE : seulement depuis /modeles/europe-robe-mariage.
  "europe-robe-mariage": ROBE_MARIAGE_EUROPE_GROUPS,
  // Tenue détente FEMME : seulement depuis /modeles/europe-detente-femme.
  "europe-detente-femme": TENUE_DETENTE_FEMME_GROUPS,

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

/**
 * Les détails qu'un tailleur a publiés avec son modèle. Seuls les choix qui ont
 * leur photo sont proposés.
 */
function tailorStyleGroups(model: GarmentModel): StyleGroup[] {
  return (model.style_groups ?? []).flatMap((group) => {
    const options = group.options.flatMap((o): StyleGroupOption[] =>
      o.photo
        ? [{ slug: o.slug, name: o.name, photo: o.photo as `${string}/${string}`, extra: o.extra }]
        : [],
    );
    return options.length > 0 ? [{ slug: group.slug, name: group.name, options }] : [];
  });
}

/**
 * The groups offered for one garment. Un modèle de tailleur n'a que les détails
 * que son tailleur a publiés : on ne lui invente jamais de col ou de manches.
 * Catalogue JALOFA : unknown garment → generic finishings.
 */
export function styleGroupsFor(model: GarmentModel | null | undefined): StyleGroup[] {
  if (model?.tailor_id) return tailorStyleGroups(model);
  const key = garmentStyleKey(model);
  if (!key) return FALLBACK_GROUPS;
  return STYLE_GROUPS_BY_SLUG[key] ?? FALLBACK_GROUPS;
}

/**
 * Les groupes à montrer pour les choix en cours : un groupe conditionnel
 * (`showIf`) disparaît quand sa condition tombe — plus de poignets sur une
 * manche courte, ni à l'écran, ni dans le récap, ni dans le devis.
 */
export function visibleStyleGroups(
  model: GarmentModel | null | undefined,
  details: Record<string, string>,
): StyleGroup[] {
  const holds = (c: StyleCondition | undefined) => !c || c.in.includes(details[c.group]);
  // Même règle pour une option : un bustier n'est proposé que sans manches.
  return styleGroupsFor(model).flatMap((g) => {
    if (!holds(g.showIf)) return [];
    const options = g.options.filter((o) => holds(o.showIf));
    return options.length > 0 ? [{ ...g, options }] : [];
  });
}

/**
 * Remet d'aplomb les choix après un changement : un choix devenu impossible
 * (un bustier quand on vient de prendre des manches longues) passe sur la
 * première option encore proposée de son groupe. On répète, car un choix
 * corrigé peut à son tour changer ce qui est proposé ailleurs.
 */
export function normalizeStyleDetails(
  model: GarmentModel | null | undefined,
  details: Record<string, string>,
): Record<string, string> {
  let next = details;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const g of visibleStyleGroups(model, next)) {
      if (!g.options.some((o) => o.slug === next[g.slug])) {
        next = { ...next, [g.slug]: g.options[0].slug };
        changed = true;
      }
    }
    if (!changed) break;
  }
  return next;
}

/** First option of each group — the pre-selected default (Hockerty-style). */
export function styleDetailDefaults(
  model: GarmentModel | null | undefined,
): Record<string, string> {
  return normalizeStyleDetails(
    model,
    Object.fromEntries(styleGroupsFor(model).map((g) => [g.slug, g.options[0].slug])),
  );
}

/**
 * Human-readable "Coupe: Robe droite · Col: V · …" for recap / notes. Driven by
 * the garment's own groups, so a detail left over from a previously configured
 * garment is ignored rather than mislabelled.
 */
export function styleDetailSummary(
  model: GarmentModel | null | undefined,
  details: Record<string, string>,
): { group: string; option: string; photo?: string }[] {
  return visibleStyleGroups(model, details).flatMap((g) => {
    const opt = g.options.find((o) => o.slug === details[g.slug]);
    if (!opt) return [];
    // Le supplément reste dans le texte : c'est lui que lit le tailleur dans la
    // demande de devis.
    const option = opt.extra ? `${opt.name} (+${formatPrice(opt.extra)})` : opt.name;
    return [{ group: g.name, option, photo: opt.photo }];
  });
}

/** Le total des suppléments des choix retenus sur un modèle de tailleur. */
export function styleExtraTotal(
  model: GarmentModel | null | undefined,
  details: Record<string, string>,
): number {
  return visibleStyleGroups(model, details).reduce(
    (sum, g) => sum + (g.options.find((o) => o.slug === details[g.slug])?.extra ?? 0),
    0,
  );
}
