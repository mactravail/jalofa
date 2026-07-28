/**
 * Destination de redirection sûre après connexion ou inscription.
 *
 * Les écrans d'auth transportent la page d'origine dans `?redirect=...` — c'est
 * le middleware qui la pose quand il intercepte une page protégée. Mais l'URL
 * est publique : rien n'empêche d'envoyer à quelqu'un un lien
 * `.../connexion?redirect=https://jalofa-connexion.example/` et de le déposer,
 * une fois connecté pour de vrai, sur un site qui imite le nôtre. C'est le
 * schéma classique de l'hameçonnage par redirection ouverte : la victime a vu le
 * vrai domaine et la vraie page de connexion, elle n'a aucune raison de se
 * méfier de l'écran suivant.
 *
 * On n'accepte donc qu'un chemin interne à l'application. Sont refusés :
 *   - les URLs absolues (`https://...`, `//evil.tld` — le double slash est
 *     interprété par le navigateur comme un lien vers un autre domaine) ;
 *   - les schémas exotiques (`javascript:`, `data:`) ;
 *   - les caractères de contrôle et espaces, avec lesquels on maquille les deux
 *     cas ci-dessus.
 */

/** Vrai si la chaîne contient un caractère de contrôle ou une espace. */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

/** Le chemin demandé s'il est interne, sinon `fallback`. */
export function safeRedirect(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;

  // Les octets de contrôle (tabulation, saut de ligne, NUL...) servent à couper
  // l'analyse d'URL des navigateurs : on écarte avant de regarder la forme,
  // sinon une tabulation suivie de « //evil.tld » passerait le test du double
  // slash.
  if (hasControlChar(value)) return fallback;

  // Un chemin interne, et un seul : commence par « / », jamais par « // » ni
  // « /\ » — les deux formes d'un lien protocol-relative vers un autre domaine.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  return value;
}
