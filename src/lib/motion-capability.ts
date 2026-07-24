/**
 * Un film Remotion ne se charge et ne tourne que si l'appareil peut se le
 * permettre sans nuire à l'expérience — sinon (mobile, économiseur de données,
 * reduced-motion, machine modeste) on s'en tient à l'image fixe : zéro octet de
 * moteur téléchargé, zéro boucle 30 fps à faire tourner.
 *
 * Cible assumée : les téléphones d'entrée de gamme (marché sénégalais) ne
 * paient jamais pour la décoration. Partagé par la home (`atelier-hero`) et la
 * fiche tissu (`fabric-showcase`) pour que la règle reste la même partout.
 */
export function canPlayFilm(): boolean {
  if (typeof window === "undefined") return false;

  const desktopSteady = window.matchMedia(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  ).matches;
  if (!desktopSteady) return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  return true;
}
