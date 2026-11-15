const MAX_DIMENSION = 1600; // px, longest edge

/**
 * Ceiling for what a Server Action will accept, mirroring
 * `serverActions.bodySizeLimit` in `next.config.ts`. A resized swatch lands far
 * under it; this only catches the fallback path below.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Target weight of one resized photo. Several photos travel in the same Server
 * Action (a fabric needs two, plus optional colour shots), so each must stay
 * well under the 4 Mo body limit on its own.
 */
const TARGET_BYTES = 900 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscale a photo in the browser before it is submitted.
 *
 * Swatches are shot on phones and routinely weigh 3–8 Mo, which a Server Action
 * refuses long before Supabase ever sees them (4 Mo body limit here, and a hard
 * ~4,5 Mo cap on Vercel). The catalogue never renders a swatch above ~800px, so
 * the pixels are no loss.
 *
 * Safari cannot encode WebP: `toBlob("image/webp")` silently hands back a PNG,
 * several Mo for a textured fabric. So the encoded type is checked, JPEG is the
 * fallback, and quality/size step down until the photo is light enough.
 *
 * Falls back to the original file on any failure — the server re-checks type
 * and size regardless.
 */
export async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && file.type !== "") return file;

  try {
    // `from-image` so portrait phone shots don't land on their side.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";

    let maxEdge = MAX_DIMENSION;
    let best: Blob | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.85, 0.72, 0.6]) {
        let blob = await toBlob(canvas, "image/webp", quality);
        if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
        if (!blob) continue;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= TARGET_BYTES) break;
      }
      if (best && best.size <= TARGET_BYTES) break;
      maxEdge = Math.round(maxEdge * 0.75);
    }
    bitmap.close();

    if (!best) return file;
    const ext = best.type === "image/webp" ? "webp" : "jpg";
    return new File([best], `${base}.${ext}`, { type: best.type });
  } catch {
    return file;
  }
}
