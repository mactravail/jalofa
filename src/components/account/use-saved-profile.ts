"use client";

import { useEffect, useState } from "react";

import { getMySavedProfile } from "@/lib/actions/saved-profile";
import type { SavedProfile } from "@/lib/saved-profile";

// Une lecture par page : la caisse, le configurateur et le choix de taille
// interrogent le même compte. Remise à zéro après un enregistrement.
let pending: Promise<SavedProfile | null> | null = null;

export function refreshSavedProfile() {
  pending = null;
}

/**
 * Les mesures, téléphone et adresse enregistrés du client connecté.
 * `undefined` tant que la lecture est en cours, `null` sans compte.
 */
export function useSavedProfile(): SavedProfile | null | undefined {
  const [profile, setProfile] = useState<SavedProfile | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    pending ??= getMySavedProfile().catch(() => null);
    pending.then((p) => alive && setProfile(p));
    return () => {
      alive = false;
    };
  }, []);
  return profile;
}
