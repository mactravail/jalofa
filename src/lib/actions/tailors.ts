"use server";

import { revalidatePath } from "next/cache";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type TailorProfileState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. L'édition du profil sera possible une fois Supabase configuré.";

const BUCKET = "tailor-images";

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/** Prix de confection de départ — colonne `not null default 0`. */
function price(value: FormDataEntryValue | null): number {
  const n = Math.round(Number(String(value ?? "").trim()));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 100_000_000) : 0;
}

/** Délai moyen en jours — colonne `not null default 7`. */
function avgDays(value: FormDataEntryValue | null): number {
  const n = Math.round(Number(String(value ?? "").trim()));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 7;
}

/**
 * Enregistre le profil public de la boutique du tailleur connecté.
 *
 * La ligne `tailors` existe déjà (créée à l'inscription) ; on met simplement à
 * jour ses champs vitrine. La photo de profil arrive sous `photo` : un fichier
 * à téléverser, l'URL existante à conserver, ou rien pour la retirer.
 */
export async function saveTailorProfile(
  _prev: TailorProfileState,
  formData: FormData,
): Promise<TailorProfileState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const shop_name = text(formData.get("shop_name"));
  if (!shop_name) return { ok: false, error: "Le nom de la boutique est requis." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  // Photo actuelle, pour nettoyer l'objet de stockage remplacé.
  const { data: prev } = await supabase
    .from("tailors")
    .select("cover_url")
    .eq("id", user.id)
    .single();
  const previous = prev as { cover_url: string | null } | null;
  const previousUrl = previous?.cover_url ?? null;

  // Résout la photo de profil : fichier neuf → téléversé ; chaîne → conservée ;
  // rien → retirée.
  const entry = formData.get("photo");
  const file = toFile(entry);
  let cover_url: string | null;
  if (file) {
    const upload = await uploadImage(supabase, BUCKET, user.id, file);
    if ("error" in upload) return { ok: false, error: upload.error };
    cover_url = upload.url;
  } else {
    cover_url = typeof entry === "string" && entry.trim() ? entry.trim() : null;
  }

  const { error } = await supabase
    .from("tailors")
    .update({
      shop_name,
      bio: text(formData.get("bio")),
      city: text(formData.get("city")),
      base_price: price(formData.get("base_price")),
      avg_delivery_days: avgDays(formData.get("avg_delivery_days")),
      free_delivery: formData.get("free_delivery") === "on",
      cover_url,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", user.id);
  if (error) {
    // La mise à jour a échoué : ne pas laisser traîner une photo orpheline.
    if (file && cover_url) await removeImage(supabase, BUCKET, cover_url);
    return { ok: false, error: error.message };
  }

  // Photo remplacée ou retirée : nettoyer l'ancienne (best-effort).
  if (previousUrl && previousUrl !== cover_url) {
    await removeImage(supabase, BUCKET, previousUrl);
  }

  revalidatePath("/tailleur/espace", "layout");
  revalidatePath(`/tailleurs/${user.id}`);
  revalidatePath("/tailleurs");
  return { ok: true };
}
