"use server";

import { revalidatePath } from "next/cache";

import { MEASUREMENT_FIELDS, STANDARD_SIZES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/queries";
import { SAVED_MEASUREMENT_LABEL, type SavedMeasurement, type SavedProfile } from "@/lib/saved-profile";
import {
  cleanValues,
  readSavedProfile,
  writeSavedContact,
  type SaveResult,
  type SavedContactInput,
} from "@/lib/saved-profile-db";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const NOT_CONNECTED = "Connectez-vous pour enregistrer vos informations.";

async function currentUser(supabase: ServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && !user.is_anonymous ? user : null;
}

/**
 * Les informations enregistrées du client connecté, ou `null` sans compte.
 * Lu par la caisse, le configurateur et la taille du prêt-à-porter, qui
 * demandent ensuite au client s'il veut les réutiliser.
 */
export async function getMySavedProfile(): Promise<SavedProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) return null;
  return readSavedProfile(supabase, user.id);
}

/** Enregistre (ou remplace) les mesures du client. */
export async function saveMyMeasurements(input: SavedMeasurement): Promise<SaveResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) return { ok: false, error: NOT_CONNECTED };

  const mode = input?.mode === "manual" ? "manual" : "standard";
  const size = STANDARD_SIZES.find((s) => s === input?.standard_size) ?? null;
  const values = mode === "manual" ? cleanValues(input?.values) : {};
  if (mode === "standard" && !size) return { ok: false, error: "Choisissez votre taille." };
  if (mode === "manual" && Object.keys(values).length === 0) {
    return { ok: false, error: "Renseignez au moins une mesure." };
  }

  // Une seule ligne « Mes mesures » : l'ancienne est remplacée. Les lignes des
  // commandes, sans libellé, ne sont jamais touchées.
  const { error: delErr } = await supabase
    .from("measurements")
    .delete()
    .eq("user_id", user.id)
    .eq("label", SAVED_MEASUREMENT_LABEL);
  if (delErr) return { ok: false, error: delErr.message };

  const columns = Object.fromEntries(
    MEASUREMENT_FIELDS.map(({ key }) => [key, values[key] ?? null]),
  );
  const { error } = await supabase.from("measurements").insert({
    user_id: user.id,
    label: SAVED_MEASUREMENT_LABEL,
    mode,
    standard_size: mode === "standard" ? size : null,
    ...columns,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/compte/mesures");
  return { ok: true };
}

/** Oublie les mesures enregistrées. */
export async function deleteMyMeasurements(): Promise<SaveResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) return { ok: false, error: NOT_CONNECTED };
  const { error } = await supabase
    .from("measurements")
    .delete()
    .eq("user_id", user.id)
    .eq("label", SAVED_MEASUREMENT_LABEL);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/compte/mesures");
  return { ok: true };
}

/**
 * Enregistre le téléphone et l'adresse du client (page « Mes coordonnées »).
 * La caisse passe par `writeSavedContact` directement, après la commande.
 */
export async function saveMyContact(input: SavedContactInput): Promise<SaveResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) return { ok: false, error: NOT_CONNECTED };
  const res = await writeSavedContact(supabase, user.id, input);
  if (res.ok) revalidatePath("/compte/adresses");
  return res;
}
