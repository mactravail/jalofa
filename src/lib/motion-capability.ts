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

/**
 * La vidéo du hero de la home, elle, tourne aussi sur téléphone (fichier dédié,
 * plus léger) : seuls l'économiseur de données, une connexion lente,
 * reduced-motion et les appareils très modestes restent sur l'image fixe, sans
 * télécharger un octet de vidéo.
 */
export function canPlayHeroVideo(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  // 2,6 Mo de vidéo sur de la 3G : autant de données en moins pour les pages suivantes.
  if (["slow-2g", "2g", "3g"].includes(nav.connection?.effectiveType ?? "")) return false;
  if ((nav.deviceMemory ?? 8) < 2) return false;
  return true;
}
