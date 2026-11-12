/**
 * Structure commune des pages légales (conditions, confidentialité, mentions
 * légales). Le français vit dans chaque page ; les autres langues dans
 * `src/lib/legal/<page>-<langue>.ts`, avec exactement la même forme. Toute
 * modification du texte français doit être reportée dans les traductions.
 */

export type LegalClause = {
  title: string;
  body: string;
  /** Puces optionnelles, affichées sous le paragraphe. */
  list?: string[];
};

export type LegalPart = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalClause[];
};

/** Les textes autour du contenu : titre, chapeau, date, liens de bas de page. */
export type LegalChrome = {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  /** « Dernière mise à jour : » — absent pour les mentions légales. */
  updatedLabel?: string;
  updated?: string;
  /** Sommaire (conditions seulement). */
  toc?: string;
  /** Bas de page : « Voir aussi nos … et nos … . » */
  seeAlso: string;
  and: string;
  links: Record<"conditions" | "confidentialite" | "mentions", string>;
};
