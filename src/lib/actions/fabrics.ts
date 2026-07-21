"use server";

import { revalidatePath } from "next/cache";

import { removeImage, toFile, uploadImage } from "@/lib/actions/storage";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type FabricFormState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "La base de données n'est pas encore connectée. La gestion des tissus sera possible une fois Supabase configuré.";

const BUCKET = "fabric-images";

/** Postgres `foreign_key_violation`. */
const FOREIGN_KEY_VIOLATION = "23503";

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/**
 * Make sure the seller has the `vendors` row that `fabrics.vendor_id` points at.
 *
 * Signup only creates one for role='vendor', so a tailor listing cloth has none.
 * The shop row is what carries the fabric, not the role — their profile stays
 * 'tailor'. A no-op once the row exists.
 */
async function ensureVendorShop(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ error: string } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  const profile = data as { full_name: string | null } | null;

  const { error } = await supabase
    .from("vendors")
    .upsert(
      { id: userId, shop_name: profile?.full_name ?? null },
      { onConflict: "id", ignoreDuplicates: true },
    );
  return error ? { error: error.message } : null;
}

/** Create a new fabric or update an existing one owned by the signed-in seller. */
export async function saveFabric(
  _prev: FabricFormState,
  formData: FormData,
): Promise<FabricFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const id = text(formData.get("id"));
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Le nom du tissu est requis." };

  const file = toFile(formData.get("image"));
  const previousUrl = text(formData.get("image_url"));
  if (!file && !previousUrl) {
    return { ok: false, error: "La photo du tissu est requise." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  let imageUrl = previousUrl;
  if (file) {
    const upload = await uploadImage(supabase, BUCKET, user.id, file);
    if ("error" in upload) return { ok: false, error: upload.error };
    imageUrl = upload.url;
  }

  const payload = {
    name,
    category_slug: text(formData.get("category_slug")),
    color: text(formData.get("color")),
    material: text(formData.get("material")),
    price_per_meter: toNumber(formData.get("price_per_meter")),
    stock_meters: toNumber(formData.get("stock_meters")),
    description: text(formData.get("description")),
    image_url: imageUrl,
    is_active: formData.get("is_active") === "on",
  };

  if (id) {
    // Update — RLS also enforces ownership, but scope the query explicitly.
    const { error } = await supabase
      .from("fabrics")
      .update(payload)
      .eq("id", id)
      .eq("vendor_id", user.id);
    if (error) {
      if (file) await removeImage(supabase, BUCKET, imageUrl); // Don't orphan the upload.
      return { ok: false, error: error.message };
    }
    if (file && previousUrl !== imageUrl) {
      await removeImage(supabase, BUCKET, previousUrl);
    }
  } else {
    const shop = await ensureVendorShop(supabase, user.id);
    if (shop) {
      if (file) await removeImage(supabase, BUCKET, imageUrl);
      return { ok: false, error: shop.error };
    }
    const { error } = await supabase
      .from("fabrics")
      .insert({ ...payload, vendor_id: user.id });
    if (error) {
      if (file) await removeImage(supabase, BUCKET, imageUrl);
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
  return { ok: true };
}

/** Delete a fabric owned by the signed-in seller. */
export async function deleteFabric(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONNECTED);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data } = await supabase
    .from("fabrics")
    .select("image_url")
    .eq("id", id)
    .eq("vendor_id", user.id)
    .single();
  const fabric = data as { image_url: string | null } | null;

  const { error } = await supabase
    .from("fabrics")
    .delete()
    .eq("id", id)
    .eq("vendor_id", user.id);
  // `orders.fabric_id` has no cascade — a fabric already ordered cannot leave,
  // or the client's order history would lose what it was made from.
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    throw new Error(
      "Ce tissu a déjà été commandé et ne peut pas être supprimé. Masquez-le pour le retirer de la boutique.",
    );
  }
  if (error) throw new Error(error.message);

  await removeImage(supabase, BUCKET, fabric?.image_url ?? null);

  revalidatePath("/vendeur/espace", "layout");
  revalidatePath("/tailleur/espace", "layout");
  revalidatePath("/tissus");
}
