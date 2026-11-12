/**
 * Modèles du catalogue RETIRÉS du site : ils n'apparaissent plus nulle part —
 * ni dans les collections (Femme, Homme, Afrique, le mix de la home), ni dans
 * « Tous les modèles », la recherche ou « Vous aimerez aussi », et leur fiche
 * renvoie une 404. Les lignes restent en base (anciennes commandes intactes).
 *
 * Clé : le `slug` stable (identique en démo et en prod). En démo, l'`id` est
 * `demo-<slug>`.
 */
export const RETIRED_MODEL_SLUGS = new Set<string>([
  // Thiaya femme
  "thiaya-femme",
  // « Robe » africaine (photo w.avif) : doublon de la « Robe » de JALOFA EUROPE
  "robe",
  // Boubou femme
  "boubou-femme",
  // Tenue de Cérémonie homme (photo diomaye.jpg)
  "tenue-ceremonie",
  // Chemise Africaine homme (photo chemise.avif)
  "chemise",
  // Costume africain homme (pas « europe-costume-homme », qui reste)
  "costume",
  // Veste Africaine homme (photo pantalon veste.avif)
  "veste-africaine",
  // Relax homme
  "relax",
  // Pantalon homme (photo pantalon.avif)
  "pantalon",
  // Thiaya homme (la Thiaya femme est déjà retirée plus haut)
  "thiaya",
  // Ensemble Bazin homme (photo grand boubou ghana.avif)
  "ensemble-bazin",
]);

/**
 * Modèles retirés qui n'ont PAS de slug en prod : on les vise par leur id.
 */
const RETIRED_MODEL_IDS = new Set<string>([
  // Tenue de Cérémonie homme (slug null en prod)
  "70554778-6e8e-41c9-b4d9-92458992d348",
  // Veste Africaine homme (slug null en prod)
  "c675f8a3-e7bd-4e26-b27f-d11bad4a1b76",
  // Pantalon homme (slug null en prod)
  "46bd4d32-00f5-43cb-8d26-bf9582d219c6",
  // Thiaya homme (slug null en prod)
  "4cc4ee1c-bec0-4a18-b25a-685f2fce3d86",
  // Ensemble Bazin homme (slug null en prod)
  "29a1184b-5818-4691-8633-d9c356aac719",
]);

export function isRetiredModel(model: { id: string; slug?: string | null }): boolean {
  if (RETIRED_MODEL_IDS.has(model.id)) return true;
  if (model.slug && RETIRED_MODEL_SLUGS.has(model.slug)) return true;
  return model.id.startsWith("demo-") && RETIRED_MODEL_SLUGS.has(model.id.slice(5));
}
