import type { StyleIconName } from "@/components/order/style-icons";
import { metrageForSlug } from "@/lib/fabric-metrage";
import type { Fabric } from "@/lib/types";

// « Et j'en fais quoi ? » — devant un rouleau, un client ne sait pas si le
// tissu est fait pour un grand boubou, une robe de cérémonie ou un pantalon.
// Le vendeur du marché HLM, lui, le dit en trois secondes. Cette table porte
// ce conseil : matière → pièces qu'elle sert, pour qui, et en combien de mètres
// (le métrage vient de `fabric-metrage.ts`, une seule source de vérité).

export type Audience = "homme" | "femme" | "mixte" | "enfant";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  homme: "Homme",
  femme: "Femme",
  mixte: "Homme & femme",
  enfant: "Enfant",
};

export type FabricUse = {
  /** Slug du type de vêtement — sert le métrage et le lien vers le catalogue. */
  slug: string;
  label: string;
  audience: Audience;
  icon: StyleIconName;
};

/** Le portrait complet d'une matière : ce qu'elle est, ce qu'elle devient. */
export type FabricProfile = {
  /** Famille lisible : « Bazin riche », « Coton léger »… */
  family: string;
  /** Une phrase de vendeur : le toucher, la tombée, l'occasion. */
  pitch: string;
  /** Saison / climat où la matière est juste. */
  season: string;
  /** Entretien, en une ligne. */
  care: string;
  /** Les pièces que ce tissu sert le mieux, la plus évidente en premier. */
  uses: FabricUse[];
};

// --- Pièces réutilisées d'un profil à l'autre --------------------------------

const GRAND_BOUBOU: FabricUse = {
  slug: "grand-boubou",
  label: "Grand boubou",
  audience: "homme",
  icon: "boubou",
};
const ENSEMBLE_BAZIN: FabricUse = {
  slug: "ensemble-bazin",
  label: "Ensemble bazin",
  audience: "homme",
  icon: "boubou-3pieces",
};
const KAFTAN: FabricUse = {
  slug: "kaftan",
  label: "Kaftan",
  audience: "homme",
  icon: "kaftan-droit",
};
const CHEMISE: FabricUse = {
  slug: "chemise",
  label: "Chemise",
  audience: "mixte",
  icon: "chemise-droite",
};
const DASHIKI: FabricUse = {
  slug: "dashiki",
  label: "Dashiki",
  audience: "homme",
  icon: "dashiki",
};
const COSTUME: FabricUse = {
  slug: "costume",
  label: "Costume",
  audience: "homme",
  icon: "costume-classique",
};
const VESTE: FabricUse = {
  slug: "veste-africaine",
  label: "Veste",
  audience: "mixte",
  icon: "senghor",
};
const PANTALON: FabricUse = {
  slug: "pantalon",
  label: "Pantalon",
  audience: "mixte",
  icon: "ensemble-droit",
};
const BOUBOU_FEMME: FabricUse = {
  slug: "boubou-femme",
  label: "Boubou femme",
  audience: "femme",
  icon: "robe-evasee",
};
const GRANDE_ROBE: FabricUse = {
  slug: "grande-robe",
  label: "Grande robe",
  audience: "femme",
  icon: "robe-evasee",
};
const ROBE: FabricUse = {
  slug: "robe",
  label: "Robe",
  audience: "femme",
  icon: "robe-droite",
};
const ROBE_SOIREE: FabricUse = {
  slug: "robe-soiree",
  label: "Robe de soirée",
  audience: "femme",
  icon: "robe-sirene",
};
const JUPE: FabricUse = {
  slug: "jupe",
  label: "Jupe",
  audience: "femme",
  icon: "jupe-evasee",
};
const TAILLEUR: FabricUse = {
  slug: "tailleur-pantalon",
  label: "Tailleur",
  audience: "femme",
  icon: "costume-classique",
};
const ENSEMBLE_FEMME: FabricUse = {
  slug: "ensemble",
  label: "Ensemble",
  audience: "femme",
  icon: "ensemble-droit",
};
const BOUBOU_ENFANT: FabricUse = {
  slug: "boubou-enfant",
  label: "Tenue enfant",
  audience: "enfant",
  icon: "boubou-court",
};

// --- Profils par matière -----------------------------------------------------
//
// Testés dans l'ordre : la première expression qui reconnaît la matière (nom +
// matière + catégorie) gagne. Les tissus de cérémonie passent avant les
// génériques, sans quoi « Bazin riche coton » tomberait dans le coton ordinaire.

const PROFILES: [RegExp, FabricProfile][] = [
  [
    /bazin|brocart|getzner|damas/,
    {
      family: "Bazin riche",
      pitch:
        "Le tissu des grandes occasions : dense, lustré au battage, il tient le pli et prend la broderie comme aucun autre.",
      season: "Toute l'année · cérémonies",
      care: "Lavage à la main, séchage à l'ombre, battage pour raviver le lustre.",
      uses: [GRAND_BOUBOU, ENSEMBLE_BAZIN, BOUBOU_FEMME, GRANDE_ROBE, BOUBOU_ENFANT],
    },
  ],
  [
    /soie|satin|mousseline|dentelle|organza/,
    {
      family: "Soierie",
      pitch:
        "Tombée fluide et reflet changeant : la matière des robes du soir et des tenues de mariage.",
      season: "Soirées · saison sèche",
      care: "Nettoyage délicat, fer doux sur l'envers.",
      uses: [ROBE_SOIREE, GRANDE_ROBE, ROBE, JUPE],
    },
  ],
  [
    /wax|pagne|kente|imprim|batik/,
    {
      family: "Wax & imprimés",
      pitch:
        "L'imprimé qui se remarque, solide au lavage : le quotidien élégant, du bureau au baptême.",
      season: "Toute l'année",
      care: "Machine 30°, repassage sur l'envers pour garder l'éclat.",
      uses: [ROBE, ENSEMBLE_FEMME, JUPE, CHEMISE, DASHIKI, BOUBOU_ENFANT],
    },
  ],
  [
    /lin|ramie/,
    {
      family: "Lin",
      pitch:
        "Respirant et sec au toucher : la matière qui rend les grosses chaleurs supportables, avec un froissé assumé.",
      season: "Saison chaude · hivernage",
      care: "Machine 30°, sèche vite, repassage humide.",
      uses: [KAFTAN, CHEMISE, PANTALON, ROBE, ENSEMBLE_FEMME],
    },
  ],
  [
    /tweed|flanelle|laine|m[ée]rinos/,
    {
      family: "Laine",
      pitch:
        "Structurée, elle tient l'épaule et donne au costume sa ligne nette — la matière du sur-mesure habillé.",
      season: "Saison fraîche · bureaux climatisés",
      care: "Nettoyage à sec, brossage après portage.",
      uses: [COSTUME, VESTE, PANTALON, TAILLEUR, JUPE],
    },
  ],
  [
    /popeline|serg[ée]|coton|oxford|jean|denim/,
    {
      family: "Coton",
      pitch:
        "Le passe-partout qui se porte tous les jours : net, résistant, facile à entretenir.",
      season: "Toute l'année",
      care: "Machine 30-40°, repassage moyen.",
      uses: [CHEMISE, PANTALON, ROBE, JUPE, ENSEMBLE_FEMME, BOUBOU_ENFANT],
    },
  ],
];

const FALLBACK_PROFILE: FabricProfile = {
  family: "Tissu d'atelier",
  pitch:
    "Une matière du catalogue JALOFA, coupée au métrage et cousue par l'atelier de votre choix.",
  season: "Toute l'année",
  care: "Suivre les indications du vendeur.",
  uses: [CHEMISE, PANTALON, ROBE, ENSEMBLE_FEMME],
};

/** Le profil d'usage d'un tissu : famille, argumentaire, pièces conseillées. */
export function fabricProfile(fabric: Fabric): FabricProfile {
  const haystack = [fabric.name, fabric.material, fabric.category_slug]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return PROFILES.find(([re]) => re.test(haystack))?.[1] ?? FALLBACK_PROFILE;
}

/** Un usage chiffré : le métrage de la pièce et ce qu'elle coûte en tissu. */
export function pricedUse(
  use: FabricUse,
  fabric: Fabric,
): { use: FabricUse; meters: number; fabricPrice: number } {
  const meters = metrageForSlug(use.slug).recommended;
  return { use, meters, fabricPrice: meters * fabric.price_per_meter };
}

/** Les publics servis par un tissu, dédupliqués — « Homme · Femme · Enfant ». */
export function audiencesOf(profile: FabricProfile): Audience[] {
  const set = new Set<Audience>();
  for (const u of profile.uses) {
    if (u.audience === "mixte") {
      set.add("homme");
      set.add("femme");
    } else {
      set.add(u.audience);
    }
  }
  return (["homme", "femme", "enfant"] as Audience[]).filter((a) => set.has(a));
}
