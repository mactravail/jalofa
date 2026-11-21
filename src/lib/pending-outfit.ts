/**
 * « Tenue en cours » : le client a choisi un tissu pour s'en faire coudre un
 * habit, puis a quitté le parcours. On s'en souvient (localStorage, 7 jours)
 * pour lui rappeler, ailleurs sur le site, d'acheter ce tissu ou de reprendre
 * son sur-mesure là où il l'avait laissé.
 *
 * Navigateur uniquement ; toute lecture / écriture est protégée (mode privé…).
 */

const KEY = "jalofa:pending-outfit";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Clé du brouillon du configurateur (cf. `configurator-context`). */
export const CONFIGURATOR_DRAFT_KEY = "nataal:configurator-draft";
const EVENT = "jalofa:pending-outfit";

export type PendingOutfit = {
  fabricId: string;
  fabricName: string;
  fabricImage: string | null;
  modelId: string | null;
  modelName: string | null;
  modelImage: string | null;
  /** Étape du configurateur où reprendre (slug d'URL), null = choix de la tenue. */
  stepUrl: string | null;
  /** Brouillon du configurateur (sans photos ni mot de passe) pour tout reprendre. */
  draft: Record<string, unknown> | null;
  at: number;
};

export function readPendingOutfit(): PendingOutfit | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingOutfit;
    if (!p?.fabricId || Date.now() - p.at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function savePendingOutfit(p: Omit<PendingOutfit, "at">) {
  try {
    const prev = readPendingOutfit();
    // On garde l'avancée déjà faite (tenue, étape) si l'on revient au même tissu
    // sans encore avoir choisi de tenue.
    const merged =
      prev && prev.fabricId === p.fabricId && !p.modelId
        ? { ...prev, fabricName: p.fabricName, fabricImage: p.fabricImage }
        : p;
    localStorage.setItem(KEY, JSON.stringify({ ...merged, at: Date.now() }));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Stockage indisponible : pas de rappel, rien de grave.
  }
}

export function clearPendingOutfit() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Idem.
  }
}

export function onPendingOutfitChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
