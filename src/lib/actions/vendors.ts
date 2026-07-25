"use server";

import { revalidatePath } from "next/cache";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type VendorProfileState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. L'édition du profil sera possible une fois Supabase configuré.";

const BUCKET = "vendor-images";

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/**
 * Enregistre le profil public de la boutique du vendeur connecté.
 *
 * La ligne `vendors` existe déjà (créée à l'inscription) ; on met simplement à
 * jour ses champs vitrine. La photo de profil arrive sous `photo` : un fichier
 * à téléverser, l'URL existante à conserver, ou rien pour la retirer.
 * Pendant du `saveTailorProfile`, sans prix ni délai (le vendeur vend au mètre).
 */
export async function saveVendorProfile(
  _prev: VendorProfileState,
  formData: FormData,
): Promise<VendorProfileState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const shop_name = text(formData.get("shop_name"));
  if (!shop_name) return { ok: false, error: "Le nom de la boutique est requis." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  // Photo actuelle, pour nettoyer l'objet de stockage remplacé ou retiré.
  const { data: prev } = await supabase
    .from("vendors")
    .select("cover_url")
    .eq("id", user.id)
    .single();
  const previousUrl = (prev as { cover_url: string | null } | null)?.cover_url ?? null;

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
    .from("vendors")
    .update({
      shop_name,
      bio: text(formData.get("bio")),
      city: text(formData.get("city")),
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

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath(`/vendeurs/${user.id}`);
  revalidatePath("/vendeurs");
  return { ok: true };
}
