/**
 * Une note est lue par le tailleur : un numéro ou un e-mail qui s'y glisse ferait
 * sortir la commande de la plateforme. Masqués plutôt que refusés, pour ne pas
 * bloquer le client sur une simple note.
 */
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// Mobile ou fixe sénégalais (77 123 45 67, +221 33 123 45 67), ou 9 chiffres et
// plus d'affilée. Pas « 8 chiffres avec espaces » : ce serait des mesures.
const SENEGAL_PHONE =
  /(?:\+?\s?221[\s.-]?)?(?:7[05678]|3[03])[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g;
const LONG_NUMBER = /\+?\d{9,}/g;

const HIDDEN = "[masqué]";

export function stripContactInfo(text: string): string {
  return text
    .replace(EMAIL, HIDDEN)
    .replace(SENEGAL_PHONE, HIDDEN)
    .replace(LONG_NUMBER, HIDDEN);
}
