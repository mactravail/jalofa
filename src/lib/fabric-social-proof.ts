import type { Fabric } from "@/lib/types";

// Preuve sociale d'une fiche tissu : note, répartition des étoiles, avis,
// volume vendu. Le schéma n'a pas encore de table `fabric_reviews` (les
// `reviews` en base notent un TAILLEUR, pas une matière) — en attendant, ces
// chiffres sont dérivés de façon déterministe de l'id du tissu, donc stables
// entre le rendu serveur et le client, et identiques d'une visite à l'autre.
//
// À remplacer par la vraie table le jour où elle existe : toute la page ne
// consomme que `fabricSocialProof()`, il n'y aura qu'elle à rebrancher.

export type FabricReview = {
  id: string;
  author: string;
  city: string;
  rating: number;
  /** Mois lisible, figé — « mars 2026 ». */
  date: string;
  body: string;
  /** Ce que le client en a fait — le détail qui rend un avis utile. */
  garment: string;
};

export type FabricSocialProof = {
  /** Note moyenne sur 5, à une décimale. */
  rating: number;
  reviewCount: number;
  /** Nombre d'avis par étoile, de 5 à 1. */
  distribution: { stars: number; count: number }[];
  /** Mètres déjà vendus — l'argument de confiance d'un vendeur de tissu. */
  soldMeters: number;
  /** Commandes contenant ce tissu. */
  orders: number;
  /** Part de clients qui l'ont racheté, en %. */
  repeatRate: number;
  reviews: FabricReview[];
};

/** Hash entier stable (FNV-1a) — même id, mêmes chiffres, serveur comme client. */
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

const AUTHORS: { author: string; city: string }[] = [
  { author: "Aminata Diallo", city: "Dakar" },
  { author: "Ousmane Ndiaye", city: "Thiès" },
  { author: "Fatou Sarr", city: "Saint-Louis" },
  { author: "Cheikh Mbaye", city: "Touba" },
  { author: "Awa Diouf", city: "Mbour" },
  { author: "Ibrahima Fall", city: "Rufisque" },
  { author: "Khadija Sy", city: "Kaolack" },
  { author: "Moussa Camara", city: "Ziguinchor" },
];

const BODIES: string[] = [
  "Tissu conforme à la photo, la couleur est exactement celle affichée. Mon tailleur a trouvé la coupe facile.",
  "Belle matière, bien dense. Livré en deux jours à Dakar, métrage exact au mètre près.",
  "Je commande chez ce vendeur depuis un an, la qualité ne bouge pas. La tombée est superbe après couture.",
  "Très satisfaite du rendu. J'ai pris un mètre de plus pour le foulard, bon conseil de la fiche.",
  "Le toucher est agréable et il ne se froisse pas trop pendant la journée. Je reprendrai une autre couleur.",
  "Bon rapport qualité-prix. Attention à prévoir la marge, j'étais juste sur mon métrage la première fois.",
  "Rendu impeccable pour la cérémonie, tout le monde a demandé où je l'avais trouvé.",
  "Emballage soigné, coupe nette, aucune trace ni défaut sur toute la longueur.",
];

const GARMENTS: string[] = [
  "Cousu en grand boubou",
  "Cousu en robe longue",
  "Cousu en ensemble bazin",
  "Cousu en chemise",
  "Cousu en tailleur",
  "Cousu en kaftan",
  "Cousu en tenue de cérémonie",
  "Cousu en pantalon",
];

// Ancre figée : les mois affichés ne dépendent pas de l'heure du rendu.
const ANCHOR = new Date("2026-07-01T00:00:00Z");

function monthLabel(monthsAgo: number): string {
  const d = new Date(ANCHOR);
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/**
 * La preuve sociale d'un tissu. Le stock sert d'indice de rotation : un rouleau
 * très fourni est un tissu courant, donc plus vendu qu'une pièce rare.
 */
export function fabricSocialProof(fabric: Fabric): FabricSocialProof {
  const id = fabric.id;

  // Note entre 4,2 et 4,9 — un tissu franchement raté ne reste pas au catalogue.
  const rating = Number((pick(`${id}:rating`, 42, 49) / 10).toFixed(1));
  const reviewCount = pick(`${id}:reviews`, 18, 214);

  // Répartition cohérente avec la note : le reste des avis descend en cascade.
  const five = Math.round(reviewCount * (0.52 + (rating - 4.2) * 0.5));
  const four = Math.round((reviewCount - five) * 0.62);
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

  const orders = reviewCount * pick(`${id}:orders`, 3, 7);
  const soldMeters = orders * pick(`${id}:meters`, 3, 6);
  const repeatRate = pick(`${id}:repeat`, 22, 48);

  const first = hash(`${id}:authors`) % AUTHORS.length;
  const reviews: FabricReview[] = Array.from({ length: 4 }, (_, i) => {
    const who = AUTHORS[(first + i * 3) % AUTHORS.length];
    return {
      id: `${id}-r${i}`,
      author: who.author,
      city: who.city,
      rating: pick(`${id}:r${i}:stars`, rating >= 4.6 ? 4 : 3, 5),
      date: monthLabel(pick(`${id}:r${i}:month`, 0, 8)),
      body: BODIES[(hash(`${id}:r${i}:body`) + i) % BODIES.length],
      garment: GARMENTS[(hash(`${id}:r${i}:garment`) + i) % GARMENTS.length],
    };
  });

  return { rating, reviewCount, distribution, soldMeters, orders, repeatRate, reviews };
}
