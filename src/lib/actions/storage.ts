import "server-only";

import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Public buckets holding catalogue photos, one per kind of thing pictured. */
export type ImageBucket =
  | "fabric-images"
  | "model-images"
  | "tailor-images"
  | "vendor-images"
  | "review-photos"
  | "inspiration-photos";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function toFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

/** Upload a photo under the owner's own prefix and return its public URL. */
export async function uploadImage(
  supabase: SupabaseServerClient,
  bucket: ImageBucket,
  ownerId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) {
    return { error: "Format d'image non supporté (JPEG, PNG, WebP ou AVIF)." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "L'image ne doit pas dépasser 5 Mo." };
  }

  // The uid prefix is what the storage policy checks — it is not cosmetic.
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Storage path behind one of our own public URLs, or null for anything else. */
function storagePath(bucket: ImageBucket, url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const at = url.indexOf(marker);
  return at === -1 ? null : decodeURIComponent(url.slice(at + marker.length));
}

/** Best-effort cleanup of a replaced photo — never fails the save. */
export async function removeImage(
  supabase: SupabaseServerClient,
  bucket: ImageBucket,
  url: string | null,
) {
  const path = storagePath(bucket, url);
  if (path) await supabase.storage.from(bucket).remove([path]);
}
