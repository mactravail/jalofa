"use server";

import { revalidatePath } from "next/cache";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { parseCountry } from "@/lib/europe";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { TailorSpecialty } from "@/lib/types";

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
 * Enregistre l'adresse privée de l'atelier du tailleur connecté : c'est là que
 * les vendeurs envoient les tissus achetés par ses clients.
 */
export async function saveTailorAtelier(
  _prev: TailorProfileState,
  formData: FormData,
): Promise<TailorProfileState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const address = text(formData.get("atelier_address"));
  const phone = text(formData.get("atelier_phone"));
  if (!address) return { ok: false, error: "Indiquez l'adresse de votre atelier." };
  if (!phone) return { ok: false, error: "Indiquez le téléphone de votre atelier." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { error } = await supabase.from("tailor_ateliers").upsert({
    tailor_id: user.id,
    address,
    phone,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tailleur/espace", "layout");
  return { ok: true };
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

  const country = formData.has("country") ? parseCountry(formData.get("country")) : null;
  const { error } = await supabase
    .from("tailors")
    .update({
      shop_name,
      bio: text(formData.get("bio")),
      city: text(formData.get("city")),
      base_price: price(formData.get("base_price")),
      avg_delivery_days: avgDays(formData.get("avg_delivery_days")),
      cover_url,
    })
    .eq("id", user.id);
  if (error) {
    // La mise à jour a échoué : ne pas laisser traîner une photo orpheline.
    if (file && cover_url) await removeImage(supabase, BUCKET, cover_url);
    return { ok: false, error: error.message };
  }

  // JALOFA EUROPE : le pays, à part et sans bloquer le profil (si la migration
  // n'est pas encore passée, la colonne manque). Un compte pro = un atelier +
  // une boutique : même pays des deux côtés, pour que créations et tissus
  // rejoignent ensemble JALOFA EUROPE.
  if (country) {
    const results = await Promise.all(
      (["tailors", "vendors"] as const).map((table) =>
        supabase.from(table).update({ country }).eq("id", user.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) console.error("[country]", failed.error);
    revalidatePath("/europe");
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

/** Au plus autant d'habits que le catalogue en compte — garde-fou anti-abus. */
const MAX_SKILLS = 60;

/** Les habits écrits à la main : au plus 10, de 40 caractères chacun. */
const MAX_CUSTOM_SKILLS = 10;
const MAX_CUSTOM_SKILL_LENGTH = 40;

function cleanCustomSkills(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_CUSTOM_SKILL_LENGTH);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_CUSTOM_SKILLS) break;
  }
  return out;
}

const SPECIALTIES: readonly TailorSpecialty[] = ["homme", "femme", "both"];

/**
 * « Spécialisation » : le tailleur connecté dit s'il coud pour homme, femme ou
 * les deux, puis coche les habits du catalogue JALOFA qu'il sait coudre. Seuls
 * les habits réels du catalogue, et de sa spécialisation, sont gardés.
 */
export async function saveMySkills(
  specialty: TailorSpecialty,
  keys: string[],
  customNames: string[] = [],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };
  if (!SPECIALTIES.includes(specialty)) {
    return { ok: false, error: "Choisissez homme, femme ou les deux." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: catalog } = await supabase
    .from("models")
    .select("id, slug, category_slug")
    .is("tailor_id", null)
    .eq("is_active", true);
  const categories = specialty === "both" ? ["homme", "femme"] : [specialty];
  const valid = new Set(
    ((catalog as { id: string; slug: string | null; category_slug: string | null }[] | null) ?? [])
      .filter((m) => categories.includes(m.category_slug ?? ""))
      .map((m) => m.slug ?? m.id),
  );
  const skills = Array.from(new Set(keys.filter((k) => valid.has(k)))).slice(0, MAX_SKILLS);
  const custom_skills = cleanCustomSkills(customNames);

  const { error } = await supabase.from("tailors").update({ specialty, skills, custom_skills }).eq("id", user.id);
  if (error) {
    console.error("[saveMySkills]", error);
    return {
      ok: false,
      error:
        error.code === "42703" || error.code === "PGRST204"
          ? "Cette fonction arrive bientôt. Réessayez plus tard."
          : "Impossible d'enregistrer. Réessayez.",
    };
  }

  revalidatePath("/tailleurs");
  revalidatePath(`/tailleurs/${user.id}`);
  revalidatePath("/tailleur/espace/specialisation");
  return { ok: true };
}
