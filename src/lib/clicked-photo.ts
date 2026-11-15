/**
 * La photo sur laquelle on a cliqué pour arriver sur une fiche (tuiles de la
 * home) voyage dans `?photo=` : elle a sa propre carte dans la rangée du haut,
 * à côté du modèle JALOFA et des créations de la même catégorie. Sélectionnée,
 * c'est elle la grande photo ; une autre carte → la galerie de ce modèle
 * (devant, dos, profil…).
 * Seulement une image du site (chemin local) — jamais une URL externe.
 */
export function readClickedPhoto(photo: string | undefined): string | null {
  return photo && photo.startsWith("/") && !photo.startsWith("//") && !photo.includes("..")
    ? photo
    : null;
}

/** Id de la carte « photo cliquée » dans la rangée du haut. */
export const CLICKED_CARD_ID = "photo-cliquee";

/**
 * Ajoute `?photo=` à un lien de fiche. `modelView` : c'est la carte du modèle
 * qui est sélectionnée (`vue=modele`) — la photo cliquée reste dans la rangée.
 */
export function hrefWithPhoto(href: string, photo: string, modelView = false): string {
  const q = `photo=${encodeURIComponent(photo)}${modelView ? "&vue=modele" : ""}`;
  return `${href}${href.includes("?") ? "&" : "?"}${q}`;
}

/** La photo cliquée est-elle la carte sélectionnée (grande photo) ? */
export function isClickedPhotoActive(clicked: string | null, vue: string | undefined): boolean {
  return clicked !== null && vue !== "modele";
}
