"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  setProCertification,
  setProSuspension,
  type ProKind,
} from "@/lib/actions/moderation";
import type { SuspensionReason } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Modération de la place, côté administration
//
// Suspendre / réactiver / certifier un prestataire. En mode démo (Supabase pas
// encore branché), la décision n'a pas de base où s'écrire : elle est gardée
// dans le navigateur, ce qui permet de manipuler l'écran de bout en bout —
// suspendre puis réactiver, certifier puis retirer — comme le fait déjà le
// pipeline de l'espace pro. Une fois la base en place, ces surcharges locales
// ne sont plus lues et tout passe par les server actions de `@/lib/actions/moderation`.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "nataal.demo.moderation.v1";

/** Les trois champs de modération d'un prestataire. */
export type ModerationState = {
  is_suspended: boolean;
  suspension_reason: SuspensionReason | null;
  is_certified: boolean;
};

/** Surcharges de démo, par prestataire (`tailor:<id>` / `vendor:<id>`). */
type Overrides = Record<string, ModerationState>;

const keyOf = (kind: ProKind, id: string) => `${kind}:${id}`;

type ModerationValue = {
  demo: boolean;
  /** Surcharge locale d'un pro en mode démo, ou `undefined` s'il n'a pas été modéré ici. */
  get: (kind: ProKind, id: string) => ModerationState | undefined;
  /** Suspend ou réactive un pro (le champ `is_certified` de `next` est ignoré). */
  setSuspension: (kind: ProKind, id: string, next: ModerationState) => Promise<void>;
  /** Certifie ou décertifie un pro (les champs de suspension de `next` sont ignorés). */
  setCertification: (kind: ProKind, id: string, next: ModerationState) => Promise<void>;
};

const ModerationContext = createContext<ModerationValue | null>(null);

export function ModerationProvider({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [hydrated, setHydrated] = useState(false);

  // Lecture unique après le montage — même logique que le pipeline pro : le
  // premier rendu client part des valeurs du serveur (pas de décalage
  // d'hydratation), les surcharges gardées en mémoire arrivent juste après.
  useEffect(() => {
    if (!demo) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOverrides(parsed as Overrides);
      }
    } catch {
      // Stockage illisible ou corrompu — on repart des valeurs d'origine.
    }
    setHydrated(true);
  }, [demo]);

  useEffect(() => {
    if (!demo || !hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // Stockage plein ou désactivé — les surcharges tiennent la session.
    }
  }, [demo, hydrated, overrides]);

  const get = useCallback(
    (kind: ProKind, id: string) => overrides[keyOf(kind, id)],
    [overrides],
  );

  const applyDemo = useCallback(
    (kind: ProKind, id: string, next: ModerationState) => {
      setOverrides((prev) => ({ ...prev, [keyOf(kind, id)]: next }));
    },
    [],
  );

  const setSuspension = useCallback(
    async (kind: ProKind, id: string, next: ModerationState) => {
      if (demo) {
        applyDemo(kind, id, next);
        return;
      }
      const res = await setProSuspension(
        kind,
        id,
        next.is_suspended,
        next.suspension_reason,
      );
      if (!res.ok) throw new Error(res.error);
    },
    [demo, applyDemo],
  );

  const setCertification = useCallback(
    async (kind: ProKind, id: string, next: ModerationState) => {
      if (demo) {
        applyDemo(kind, id, next);
        return;
      }
      const res = await setProCertification(kind, id, next.is_certified);
      if (!res.ok) throw new Error(res.error);
    },
    [demo, applyDemo],
  );

  const value = useMemo<ModerationValue>(
    () => ({ demo, get, setSuspension, setCertification }),
    [demo, get, setSuspension, setCertification],
  );

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  );
}

export function useModeration() {
  const ctx = useContext(ModerationContext);
  if (!ctx) {
    throw new Error("useModeration must be used within a ModerationProvider");
  }
  return ctx;
}

/**
 * L'état de modération effectif d'un pro : la surcharge de démo si elle existe,
 * sinon les valeurs venues du serveur. Ce que l'UI (pastilles + menu) affiche.
 */
export function useProModeration(
  kind: ProKind,
  id: string,
  base: ModerationState,
): ModerationState {
  const { get } = useModeration();
  return get(kind, id) ?? base;
}
