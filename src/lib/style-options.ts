import type { StyleIconName } from "@/components/order/style-icons";

// Garment personalisation shown in the configurator "Style" step, modelled on
// Hockerty's grouped, illustrated picker but adapted to Senegalese / African
// clothing. These groups are catalogue constants (client-side); the chosen
// occasion still lives in the `styles` table via `styleSlug`.
//
// Each garment gets ONLY its own cuts, and only the groups that apply to it: a
// robe is never offered a kaftan cut, and a jupe has no collar or sleeves at
// all. That is why the catalogue is keyed by model id rather than being one
// flat list — see STYLE_GROUPS_BY_MODEL below.

export type StyleGroupOption = {
  slug: string;
  name: string;
  icon: StyleIconName;
};

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
// Per-garment catalogue, keyed by model id (see `src/lib/fixtures.ts`).
// ---------------------------------------------------------------------------

export const STYLE_GROUPS_BY_MODEL: Record<string, StyleGroup[]> = {
  "demo-grand-boubou": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Boubou classique", icon: "boubou" },
        { slug: "trois-pieces", name: "Trois pièces", icon: "boubou-3pieces" },
        { slug: "court", name: "Boubou court", icon: "boubou-court" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  "demo-kaftan": [
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

  "demo-chemise": [
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

  "demo-costume": [
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

  "demo-ensemble-bazin": [
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

  "demo-agbada": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Agbada classique", icon: "boubou" },
        { slug: "trois-pieces", name: "Trois pièces", icon: "boubou-3pieces" },
        { slug: "long", name: "Coupe longue", icon: "kaftan-long" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  "demo-kaftan-brode": [
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

  "demo-tenue-ceremonie": [
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

  "demo-costume-africain": [
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
  "demo-veste-africaine": [
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
  "demo-gilet": [
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
  "demo-pantalon": [
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

  "demo-dashiki": [
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

  "demo-baye-lahat": [
    {
      slug: "coupe",
      name: "Coupe",
      options: [
        { slug: "classique", name: "Boubou classique", icon: "boubou" },
        { slug: "trois-pieces", name: "Trois pièces", icon: "boubou-3pieces" },
        { slug: "court", name: "Boubou court", icon: "boubou-court" },
      ],
    },
    COL_HOMME,
    BRODERIE_COMPLETE,
    MANCHES_AMPLES,
  ],

  // Un thiaya est un pantalon : ni col ni manches, comme la jupe.
  "demo-thiaya": [
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

  "demo-robe": [
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

  "demo-boubou-femme": [
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

  "demo-grande-robe": [
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
  "demo-gilet-femme": [
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

  "demo-chemise-femme": [
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
  "demo-pantalon-large": [
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

  "demo-robe-soiree": [
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

  "demo-robe-coupee": [
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

  "demo-tailleur-pantalon": [
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

  "demo-veste-femme": [
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

  "demo-bureau-femme": [
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

  "demo-ceremonie-femme": [
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

  "demo-thiaya-femme": [
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

  "demo-ensemble": [
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
  "demo-jupe": [
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

  "demo-boubou-enfant": [
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

  "demo-ensemble-enfant": [
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
 * A garment with no entry above (a Supabase row the catalogue does not know
 * yet) gets the generic finishings — but never a "Coupe", because guessing the
 * cuts of an unknown garment is how a robe ends up offering kaftans.
 */
const FALLBACK_GROUPS: StyleGroup[] = [COL_HOMME, BRODERIE_COMPLETE, MANCHES_STANDARD];

/** The groups offered for one garment. Empty model → generic finishings. */
export function styleGroupsFor(modelId: string | null | undefined): StyleGroup[] {
  if (!modelId) return FALLBACK_GROUPS;
  return STYLE_GROUPS_BY_MODEL[modelId] ?? FALLBACK_GROUPS;
}

/** First option of each group — the pre-selected default (Hockerty-style). */
export function styleDetailDefaults(
  modelId: string | null | undefined,
): Record<string, string> {
  return Object.fromEntries(styleGroupsFor(modelId).map((g) => [g.slug, g.options[0].slug]));
}

/**
 * Human-readable "Coupe: Robe droite · Col: V · …" for recap / notes. Driven by
 * the garment's own groups, so a detail left over from a previously configured
 * garment is ignored rather than mislabelled.
 */
export function styleDetailSummary(
  modelId: string | null | undefined,
  details: Record<string, string>,
): { group: string; option: string }[] {
  return styleGroupsFor(modelId).flatMap((g) => {
    const opt = g.options.find((o) => o.slug === details[g.slug]);
    return opt ? [{ group: g.name, option: opt.name }] : [];
  });
}
