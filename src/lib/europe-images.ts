import type { EuropeType } from "@/lib/europe";

/**
 * Les photos de JALOFA EUROPE, en un seul endroit : les remplacer ne touche
 * qu'à ce fichier. Elles vivent dans `public/europe collection/` (espace
 * encodé en %20 dans l'URL). Une catégorie sans photo (`null`) s'affiche en
 * tuile typographique, noire, sans image cassée.
 */
const DIR = "/europe%20collection";

export const EUROPE_HERO = {
  src: `${DIR}/heroE.jpg`,
  alt: "Un tailleur prend les mesures d'un client dans son atelier, entre costumes et rouleaux de tissu",
  // Paysage : sur mobile (portrait) on garde le client et le tailleur au centre.
  position: "object-[52%_45%]",
  // Photo très claire : on l'assombrit un peu pour que le titre ressorte.
  className: "brightness-75",
};

/** Le bloc « Votre atelier est en Europe ? » : la table de coupe. */
export const EUROPE_ATELIER_IMAGE = {
  src: `${DIR}/plani.jpg`,
  alt: "Patrons en papier posés sur un tissu de laine, ciseaux et poids de coupe",
};

export const EUROPE_TYPE_IMAGES: Record<EuropeType, string | null> = {
  "robe-mariage": `${DIR}/robe-mariee.jpg`,
  "costume-homme": `${DIR}/costume-h.jpg`,
  "costume-femme": `${DIR}/tay.jpg`,
  "chemise-homme": `${DIR}/chemise-h.jpg`,
  "chemise-femme": `${DIR}/chemise-f.jpg`,
  "smoking-homme": `${DIR}/smoking.jpg`,
  robe: `${DIR}/robe.jpg`,
  "robe-soiree": `${DIR}/abito-da-sera.jpg`,
  "costume-2p-homme": `${DIR}/2-pieces.jpg`,
  "detente-femme": `${DIR}/afterwork.jpg`,
};

/** Section « entrepreneurs » : la photo d'ouverture puis les trois moments. */
export const EUROPE_BUSINESS = {
  lead: {
    src: `${DIR}/wow.jpg`,
    alt: "Une femme en tailleur noir, assise sur un fauteuil design",
  },
  moments: [
    {
      src: `${DIR}/cole.jpg`,
      alt: "Un homme en costume croisé beige, cravate et pochette",
      title: "Le rendez-vous d'affaires",
      text: "Un costume coupé à vos mesures : l'assurance dès la poignée de main.",
    },
    {
      src: `${DIR}/business.jpg`,
      alt: "Une femme souriante en tailleur noir cintré",
      title: "Le conseil d'administration",
      text: "Un tailleur net et précis, pour les femmes qui dirigent.",
    },
    {
      src: `${DIR}/james.jpg`,
      alt: "Un homme en smoking noir et nœud papillon",
      title: "Le gala",
      text: "Le smoking des grandes soirées, taillé dans un atelier européen.",
    },
  ],
};
