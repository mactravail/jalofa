const MAX_DIMENSION = 1600; // px, longest edge
const QUALITY = 0.85;

/**
 * Ceiling for what a Server Action will accept, mirroring
 * `serverActions.bodySizeLimit` in `next.config.ts`. A resized swatch lands far
 * under it; this only catches the fallback path below.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Downscale a photo in the browser before it is submitted.
 *
 * Swatches are shot on phones and routinely weigh 3–8 Mo, which a Server Action
 * refuses long before Supabase ever sees them (1 Mo body limit by default, and
 * a hard ~4,5 Mo cap on Vercel). The catalogue never renders a swatch above
 * ~800px, so the pixels are no loss.
 *
 * Falls back to the original file on any failure — the server re-checks type
 * and size regardless.
 */
export async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    // `from-image` so portrait phone shots don't land on their side.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    if (!blob) return file;

    const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
