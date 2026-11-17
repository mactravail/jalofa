"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Brouillon d'un formulaire (espace pro ou client), gardé dans le navigateur : la
 * page rechargée ou quittée par erreur, on reprend là où on en était. Les champs
 * nommés du formulaire sont relus tels quels (photos exceptées : un fichier ne
 * se garde pas), `extra` porte l'état React qui n'est pas dans le formulaire.
 */
export type FormDraft<E> = { fields: Record<string, string[]>; extra: E; savedAt: number };

const PREFIX = "jalofa:draft:";
/** Un brouillon plus vieux est oublié : il ne correspond plus à rien. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function readDraft<E>(key: string): FormDraft<E> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as FormDraft<E>;
    if (!draft?.fields || Date.now() - (draft.savedAt ?? 0) > MAX_AGE_MS) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* stockage indisponible : rien à effacer */
  }
}

/** Le brouillon enregistré, lu une fois au montage : il pré-remplit l'état. */
export function useSavedDraft<E>(key: string, enabled = true): FormDraft<E> | null {
  const [draft] = useState(() => (enabled ? readDraft<E>(key) : null));
  return draft;
}

/**
 * Enregistre le formulaire (`formRef` à poser sur la balise <form>) et `extra`
 * à chaque saisie. `draft` vient de `useSavedDraft` avec la même clé.
 */
export function useFormDraft<E>(key: string, draft: FormDraft<E> | null, extra: E) {
  // Ref par rappel : le formulaire vit dans un portail monté après coup.
  const [form, formRef] = useState<HTMLFormElement | null>(null);
  const extraRef = useRef(extra);
  // L'état du formulaire juste ouvert : tant qu'on y revient, aucun brouillon
  // (ouvrir puis fermer ne doit pas en laisser un faux).
  const baseline = useRef<string | null>(null);
  // Un brouillon repris s'écrit toujours (il diffère déjà de la fiche vierge).
  const draftActive = useRef(Boolean(draft));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshot = useCallback(() => {
    const fields: Record<string, string[]> = {};
    if (form) {
      for (const [name, value] of new FormData(form)) {
        if (typeof value !== "string") continue;
        (fields[name] ??= []).push(value);
      }
    }
    return { fields, extra: extraRef.current };
  }, [form]);

  const save = useCallback(() => {
    if (!form || baseline.current === null) return;
    const snap = snapshot();
    if (!draftActive.current && JSON.stringify(snap) === baseline.current) {
      removeDraft(key);
      return;
    }
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify({ ...snap, savedAt: Date.now() }));
    } catch {
      /* stockage plein ou bloqué : le brouillon reste seulement en mémoire */
    }
  }, [form, key, snapshot]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    // Après le rendu : les champs cachés pilotés par React sont à jour.
    timer.current = setTimeout(save, 300);
  }, [save]);

  useEffect(() => {
    extraRef.current = extra;
    schedule();
  }, [extra, schedule]);

  useEffect(() => {
    if (!form) return;
    const first = setTimeout(() => {
      baseline.current = JSON.stringify(snapshot());
    }, 0);
    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    form.addEventListener("click", schedule);
    return () => {
      clearTimeout(first);
      form.removeEventListener("input", schedule);
      form.removeEventListener("change", schedule);
      form.removeEventListener("click", schedule);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, schedule, snapshot]);

  /** Après l'envoi réussi, ou « Recommencer à zéro ». */
  // Le formulaire peut resservir (une 2e tenue publiée) : son état d'après
  // l'envoi devient la nouvelle fiche vierge.
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    removeDraft(key);
    draftActive.current = false;
    baseline.current = null;
    setTimeout(() => {
      baseline.current = JSON.stringify(snapshot());
    }, 0);
  }, [key, snapshot]);

  /** Première valeur d'un champ du brouillon, sinon `undefined`. */
  const field = useCallback(
    (name: string): string | undefined => draft?.fields[name]?.[0],
    [draft],
  );
  /** Toutes les valeurs d'un champ (cases multiples). */
  const fieldAll = useCallback(
    (name: string): string[] | undefined => (draft ? (draft.fields[name] ?? []) : undefined),
    [draft],
  );

  return { formRef, field, fieldAll, clear };
}

/**
 * Pour un formulaire rendu sur le serveur (pas dans une fenêtre) : le serveur
 * ne voit pas le navigateur, donc le brouillon n'est repris qu'une fois la page
 * affichée. `restore` passe à vrai une seule fois, juste après le montage, s'il
 * y a un brouillon : le formulaire, remonté avec cette clé, le relit alors.
 */
export function useRestoreAfterMount(key: string): boolean {
  const [restore, setRestore] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (readDraft(key)) setRestore(true);
  }, [key]);
  return restore;
}

/**
 * Brouillon d'un état React (sans balise <form>) : caisse, mesures. Relu juste
 * après le montage — le serveur ne voit pas le navigateur — puis enregistré à
 * chaque changement. Rien n'est écrit tant que `value` reste l'état de départ.
 */
export function useStateDraft<T>(key: string, value: T, restore: (saved: T) => void) {
  const [restored, setRestored] = useState(false);
  const pristine = useRef(JSON.stringify(value));
  // L'état vierge du tout début : y revenir (formulaire remis à zéro) efface aussi.
  const [initialJson] = useState(() => JSON.stringify(value));
  const ready = useRef(false);
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  });

  useEffect(() => {
    const draft = readDraft<T>(key);
    if (draft) {
      restoreRef.current(draft.extra);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRestored(true);
    }
    ready.current = true;
  }, [key]);

  const json = JSON.stringify(value);
  const jsonRef = useRef(json);
  useEffect(() => {
    jsonRef.current = json;
    if (!ready.current) return;
    const timer = setTimeout(() => {
      if (json === pristine.current || json === initialJson) {
        removeDraft(key);
        return;
      }
      try {
        window.localStorage.setItem(
          PREFIX + key,
          JSON.stringify({ fields: {}, extra: JSON.parse(json), savedAt: Date.now() }),
        );
      } catch {
        /* stockage plein ou bloqué */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [key, json, initialJson]);

  /** Après l'envoi réussi : l'état courant devient l'état de départ. */
  const clear = useCallback(() => {
    removeDraft(key);
    pristine.current = jsonRef.current;
  }, [key]);

  return { restored, clear };
}
