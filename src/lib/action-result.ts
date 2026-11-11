import { unstable_rethrow } from "next/navigation";

/**
 * Résultat d'une server action qui peut échouer avec un message pour l'utilisateur.
 *
 * Pourquoi pas un simple `throw` : en production, Next masque le message de toute
 * erreur levée par une server action (le client ne reçoit que « Minified React
 * error #441 »). Le message doit donc voyager comme une valeur de retour.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Côté serveur : exécute `fn` et transforme une erreur levée en `{ ok: false }`. */
export async function runAction(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    // redirect() / notFound() doivent continuer leur chemin.
    unstable_rethrow(e);
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Erreur, réessayez." };
  }
}

/** Côté client : relève l'erreur avec son vrai message, pour les try/catch existants. */
export function unwrap(result: ActionResult): void {
  if (!result.ok) throw new Error(result.error);
}
