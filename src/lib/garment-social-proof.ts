import type { GarmentModel, Tailor } from "@/lib/types";

/**
 * Preuve sociale d'un vêtement : ce qu'en disent les clients qui l'ont déjà
 * commandé — de la pièce elle-même comme de l'atelier qui l'a cousue.
 *
 * Le schéma ne sait pas encore noter un MODÈLE : `reviews` rattache un avis à
 * une commande et à son tailleur (cf. la migration init_schema). En attendant
 * une colonne `model_id`, ces avis sont dérivés de façon déterministe du slug
 * du modèle — stables entre le rendu serveur et le client, identiques d'une
 * visite à l'autre. Les avis déposés depuis la page s'y ajoutent côté
 * navigateur (cf. <GarmentReviews />).
 *
 * À remplacer par la vraie table le jour où elle existe : les pages vêtement ne
 * consomment que `garmentSocialProof()`, il n'y aura qu'elle à rebrancher.
 */

/** Ce dont parle un avis : la pièce reçue, ou l'atelier qui l'a cousue. */
export type GarmentReviewSubject = "garment" | "tailor";

export const REVIEW_SUBJECT_LABELS: Record<GarmentReviewSubject, string> = {
  garment: "Le vêtement",
  tailor: "Le tailleur",
};

export type GarmentReview = {
  id: string;
  author: string;
  city: string;
  /** Photo du client : sur une fiche vêtement, un avis se regarde autant qu'il se lit. */
  photo: string | null;
  rating: number;
  /** Mois lisible, figé — « mars 2026 ». */
  date: string;
  body: string;
  subject: GarmentReviewSubject;
  /** L'atelier qui a cousu la pièce, quand le client en a désigné un. */
  tailor: { id: string; name: string } | null;
  /** Ce qui a été commandé — « Pris tel quel · taille L ». */
  context: string;
  /** Avis déposé depuis cette page, donc pas encore vérifié par une commande. */
  own?: boolean;
};

export type GarmentSocialProof = {
  /** Note moyenne sur 5, à une décimale. */
  rating: number;
  reviewCount: number;
  /** Nombre d'avis par étoile, de 5 à 1. */
  distribution: { stars: number; count: number }[];
  /** Pièces déjà cousues sur ce modèle. */
  orders: number;
  /** Part de clients qui le recommandent, en %. */
  recommendRate: number;
  reviews: GarmentReview[];
};

/** Hash entier stable (FNV-1a) — même graine, mêmes chiffres, serveur comme client. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/** Tire un entier dans [min, max] à partir de la graine. */
function pick(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

type Person = { author: string; city: string };

const WOMEN: Person[] = [
  { author: "Aminata Diallo", city: "Dakar" },
  { author: "Fatou Sarr", city: "Saint-Louis" },
  { author: "Awa Diouf", city: "Mbour" },
  { author: "Khadija Sy", city: "Kaolack" },
  { author: "Ndeye Fall", city: "Rufisque" },
  { author: "Bineta Gueye", city: "Thiès" },
];

const MEN: Person[] = [
  { author: "Ousmane Ndiaye", city: "Thiès" },
  { author: "Cheikh Mbaye", city: "Touba" },
  { author: "Ibrahima Fall", city: "Rufisque" },
  { author: "Moussa Camara", city: "Ziguinchor" },
  { author: "Abdoulaye Sow", city: "Dakar" },
  { author: "Serigne Faye", city: "Diourbel" },
];

// Vraies photos de profil : des portraits carrés recadrés sur le visage à partir
// des séries photo du site (découpe faite une fois, résultat versionné dans
// public/avis). Une silhouette en pied du catalogue ne fait PAS un avatar — à
// 48 px on n'y voit qu'un bout de tissu.
const WOMEN_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/avis/femme-${n}.webp`);
const MEN_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/avis/homme-${n}.webp`);

/** Alterne les deux séries pour les modèles mixtes / enfant (avis des parents). */
function interleave<T>(a: T[], b: T[]): T[] {
  return a.flatMap((item, i) => (b[i] ? [item, b[i]] : [item]));
}

const BODIES: Record<GarmentReviewSubject, string[]> = {
  garment: [
    "La coupe tombe exactement comme sur la photo. J'ai pris ma taille habituelle, aucune retouche à faire.",
    "Encore plus beau en vrai. Les finitions à l'intérieur sont aussi soignées que dehors.",
    "Porté à un mariage : on m'a demandé toute la soirée d'où il venait.",
    "Très confortable, la matière ne gratte pas et garde sa forme après lavage.",
    "J'hésitais sur la longueur — les mesures annoncées sont justes, tout tombe au bon endroit.",
    "Deuxième pièce sur ce modèle : la première a deux ans et n'a pas bougé.",
    "La broderie est nette, régulière, pas un fil qui dépasse.",
    "Reçu avant la date annoncée, plié et emballé proprement.",
  ],
  tailor: [
    "Le tailleur m'a appelé pour revérifier deux mesures avant de couper — ça change tout.",
    "Atelier très à l'écoute : j'ai demandé les manches un peu plus courtes, c'était fait le lendemain.",
    "Travail impeccable et délai respecté au jour près. Je lui confierai ma prochaine tenue.",
    "Il m'a conseillé un autre tissu que celui que j'avais choisi — il avait raison.",
    "J'ai suivi chaque étape, il répondait aux messages le jour même.",
    "Une petite reprise à la taille, faite sans discuter et sans frais.",
  ],
};

const SIZES = ["S", "M", "L", "XL", "XXL"];

const CUSTOMISATIONS = [
  "broderie assortie",
  "manches ajustées",
  "longueur raccourcie",
  "col sur mesure",
  "doublure ajoutée",
];

// Ancre figée : les mois affichés ne dépendent pas de l'heure du rendu.
const ANCHOR = new Date("2026-07-01T00:00:00Z");

function monthLabel(monthsAgo: number): string {
  const d = new Date(ANCHOR);
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/**
 * Les avis d'un vêtement. La graine est le `slug` (stable en démo comme en
 * base) et non l'`id` UUID, pour que la même pièce garde ses avis en prod.
 */
export function garmentSocialProof(
  model: Pick<GarmentModel, "id" | "slug" | "category_slug">,
  tailors: Pick<Tailor, "id" | "shop_name">[] = [],
): GarmentSocialProof {
  const seed = model.slug ?? model.id;

  // Note entre 4,3 et 4,9 — un modèle franchement raté ne reste pas au catalogue.
  const rating = Number((pick(`${seed}:rating`, 43, 49) / 10).toFixed(1));
  const reviewCount = pick(`${seed}:reviews`, 12, 168);

  // Répartition cohérente avec la note : le reste des avis descend en cascade.
  const five = Math.round(reviewCount * (0.54 + (rating - 4.3) * 0.5));
  const four = Math.round((reviewCount - five) * 0.64);
  const three = Math.round((reviewCount - five - four) * 0.6);
  const two = Math.round((reviewCount - five - four - three) * 0.6);
  const one = Math.max(0, reviewCount - five - four - three - two);
  const distribution = [
    { stars: 5, count: five },
    { stars: 4, count: four },
    { stars: 3, count: three },
    { stars: 2, count: two },
    { stars: 1, count: one },
  ];

  const orders = reviewCount * pick(`${seed}:orders`, 3, 6);
  const recommendRate = pick(`${seed}:recommend`, 88, 99);

  const people =
    model.category_slug === "femme"
      ? WOMEN
      : model.category_slug === "homme"
        ? MEN
        : interleave(WOMEN, MEN);
  const photos =
    model.category_slug === "femme"
      ? WOMEN_PHOTOS
      : model.category_slug === "homme"
        ? MEN_PHOTOS
        : interleave(WOMEN_PHOTOS, MEN_PHOTOS);

  const first = hash(`${seed}:authors`);
  const named = tailors.filter((t) => t.shop_name);

  const reviews: GarmentReview[] = Array.from({ length: 6 }, (_, i) => {
    // Un avis sur deux parle de l'atelier : les deux angles sont toujours
    // représentés, quel que soit le modèle.
    const subject: GarmentReviewSubject = i % 2 === 0 ? "garment" : "tailor";
    const bodies = BODIES[subject];
    const asIs = hash(`${seed}:r${i}:context`) % 2 === 0;
    const shop = named.length ? named[(first + i) % named.length] : null;

    // Même index pour l'auteur et le portrait : dans la liste mixte (enfant),
    // les deux séries sont entrelacées, donc l'index seul garantit qu'un prénom
    // ne se retrouve pas avec le visage de l'autre série.
    const who = people[(first + i) % people.length];

    return {
      id: `${seed}-r${i}`,
      author: who.author,
      city: who.city,
      photo: photos[(first + i) % photos.length],
      rating: pick(`${seed}:r${i}:stars`, rating >= 4.6 ? 4 : 3, 5),
      date: monthLabel(pick(`${seed}:r${i}:month`, 0, 9)),
      body: bodies[(hash(`${seed}:r${i}:body`) + i) % bodies.length],
      subject,
      tailor: shop ? { id: shop.id, name: shop.shop_name! } : null,
      context: asIs
        ? `Pris tel quel · taille ${SIZES[hash(`${seed}:r${i}:size`) % SIZES.length]}`
        : `Personnalisé · ${CUSTOMISATIONS[hash(`${seed}:r${i}:custom`) % CUSTOMISATIONS.length]}`,
    };
  });

  return { rating, reviewCount, distribution, orders, recommendRate, reviews };
}
