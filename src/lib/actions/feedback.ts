"use server";

import { revalidatePath } from "next/cache";

import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FeedbackFormState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const NOT_CONNECTED =
  "Mode démonstration — votre retour nous parviendra une fois la base de données connectée.";

/** Bornes du message : assez pour être utile, plafonné pour rester lisible. */
const MIN_MESSAGE = 3;
const MAX_MESSAGE = 2000;

const SPACES = ["client", "tailor", "vendor"] as const;
type FeedbackSpace = (typeof SPACES)[number];

/**
 * Envoyer un retour à l'administration depuis un espace.
 *
 * L'utilisateur choisit une catégorie (amélioration / problème / autre) et écrit
 * un message libre. L'identité (nom + rôle) est figée sur la ligne : la RLS de
 * `profiles` interdit à l'admin de lire tous les noms, un join ne rendrait donc
 * rien côté modération.
 */
export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < MIN_MESSAGE) {
    return { ok: false, error: "Écrivez quelques mots avant d'envoyer." };
  }

  const categoryRaw = String(formData.get("category") ?? "").trim();
  const category = (FEEDBACK_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as FeedbackCategory)
    : "amelioration";

  const spaceRaw = String(formData.get("space") ?? "").trim();
  const space = (SPACES as readonly string[]).includes(spaceRaw)
    ? (spaceRaw as FeedbackSpace)
    : "client";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour envoyer un retour." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  const p = profile as { full_name: string | null; role: string | null } | null;

  const { error } = await supabase.from("feedback").insert({
    author_id: user.id,
    author_name: p?.full_name ?? null,
    author_role: p?.role ?? null,
    space,
    category,
    message: message.slice(0, MAX_MESSAGE),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  return { ok: true };
}

type MutationResult = { ok: true } | { ok: false; error: string };

/**
 * Le client service-role, TOUJOURS derrière un contrôle de rôle admin (cf.
 * `deleteInspirationPost`). Sert au triage et à la suppression des retours, que
 * la RLS ne laisse pas à un non-auteur.
 */
async function adminClientOrError(): Promise<
  { db: ReturnType<typeof createAdminClient> } | { error: string }
> {
  const rls = await createClient();
  const {
    data: { user },
  } = await rls.auth.getUser();
  if (!user) return { error: "Connectez-vous." };

  const { data: profile } = await rls
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    return { error: "Action non autorisée." };
  }

  try {
    return { db: createAdminClient() };
  } catch {
    return { error: "Clé de service manquante : l'action est indisponible." };
  }
}

/** Marquer un retour comme traité (ou le rouvrir) — administration uniquement. */
export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<MutationResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const guard = await adminClientOrError();
  if ("error" in guard) return { ok: false, error: guard.error };

  const { error } = await guard.db
    .from("feedback")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  return { ok: true };
}

/** Supprimer un retour — administration uniquement. */
export async function deleteFeedback(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const guard = await adminClientOrError();
  if ("error" in guard) return { ok: false, error: guard.error };

  const { error } = await guard.db.from("feedback").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  return { ok: true };
}
