import type { GarmentModel } from "@/lib/types";

// On s'habille POUR quelque chose : les occasions servent de filtres dans la
// section « Choisissez votre habit » des collections Homme et Femme.
//
// Beaucoup de lignes de la base n'ont pas encore de `slug` : on classe sur le nom
// normalisé, identique en base et en démo. Seul le catalogue de la plateforme est
// classé ; les créations des tailleurs, et tout habit ajouté plus tard, restent
// visibles sous « Tout » au lieu de disparaître de la page.

export type CollectionOccasion = {
  id: string;
  title: string;
  intro: string;
  /** Noms normalisés, dans l'ordre d'affichage. */
  models: string[];
};

export const HOMME_OCCASIONS: CollectionOccasion[] = [
  {
    id: "ceremonie",
    title: "Cérémonie",
    intro: "Mariage, baptême, Tabaski, Korité. Le jour où tout le monde vous regarde.",
    models: ["baye-lahat", "grand-boubou", "agbada", "ensemble-bazin", "tenue-de-ceremonie"],
  },
  {
    id: "vendredi",
    title: "Vendredi",
    intro: "Pour la mosquée et la famille. Simple, propre, respecté.",
    models: ["kaftan-brode", "kaftan", "dashiki"],
  },
  {
    id: "bureau",
    title: "Bureau",
    intro: "Réunion, rendez-vous, signature. Sérieux dès le premier regard.",
    models: ["costume-africain", "chemise-africaine", "costume", "veste-africaine", "gilet"],
  },
  {
    id: "quotidien",
    title: "Tous les jours",
    intro: "Confortable. Et toujours bien habillé.",
    models: ["relax", "pantalon", "thiaya"],
  },
];

export const FEMME_OCCASIONS: CollectionOccasion[] = [
  {
    id: "ceremonie",
    title: "Cérémonie",
    intro: "Mariage, baptême, Tabaski, Korité. Le jour dont on parlera encore.",
    models: ["tenue-de-ceremonie", "boubou-femme", "grande-robe", "robe-de-soiree", "thiaya"],
  },
  {
    id: "bureau",
    title: "Bureau",
    intro: "Élégante dès le premier regard. Et respectée.",
    models: ["tailleur-pantalon", "tenue-de-bureau", "robe-coupee", "veste"],
  },
  {
    id: "quotidien",
    title: "Tous les jours",
    intro: "Belle, même un jour ordinaire.",
    models: ["robe", "ensemble", "jupe", "pantalon-large", "chemise", "gilet"],
  },
];

// Ces trois modèles ont une galerie dont la première photo est le vêtement posé à
// plat, et une `image_url` qui montre un AUTRE habit. On prend la vue portée de
// leur galerie : le client retrouve sur la fiche exactement ce qu'il a cliqué.
const WORN_COVER: Record<string, string> = {
  "chemise-africaine": "/collection%20homme/b.avif",
  costume: "/collection%20homme/k.avif",
  kaftan: "/collection%20homme/c.avif",
};

export function modelKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

/** La photo où l'habit est porté : c'est elle qui donne envie. */
export function wornCover(model: GarmentModel): string | null {
  const worn = WORN_COVER[modelKey(model.name)];
  if (worn && model.photos.includes(worn)) return worn;
  return model.image_url ?? model.photos[0] ?? null;
}

/**
 * Les habits dans leur ordre d'affichage, chacun avec son occasion : d'abord le
 * catalogue classé, puis tout le reste (`occasion: null`).
 */
export function orderForPicker(
  models: GarmentModel[],
  occasions: CollectionOccasion[],
): { model: GarmentModel; occasion: string | null }[] {
  const platform = new Map(
    models.filter((m) => m.tailor_id === null).map((m) => [modelKey(m.name), m]),
  );
  const placed = new Set<string>();

  const classified = occasions.flatMap((occasion) =>
    occasion.models.flatMap((key) => {
      const model = platform.get(key);
      if (!model) return [];
      placed.add(model.id);
      return [{ model, occasion: occasion.id as string | null }];
    }),
  );
  const rest = models
    .filter((m) => !placed.has(m.id))
    .map((model) => ({ model, occasion: null }));

  return [...classified, ...rest];
}
