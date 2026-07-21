// Photos d'inspiration que le client joint à l'étape « Style » : un modèle vu
// dans la rue, un croquis, une tenue qu'il possède déjà. Elles ne remplacent pas
// les options du configurateur, elles donnent au tailleur le ton du vêtement.
//
// Tant que Supabase Storage n'est pas provisionné, une photo voyage en data URL
// dans le brouillon (sessionStorage) puis dans la ligne de panier (localStorage).
// Les deux quotas tournent autour de 5 Mo, d'où la compression agressive
// ci-dessous : à ~900 px / qualité 0,65 une photo pèse ~60–120 Ko, soit moins de
// 700 Ko pour cinq une fois encodée en base64.

export type StyleRef = {
  id: string;
  /** JPEG compressé, encodé en data URL. */
  dataUrl: string;
  /** Nom du fichier d'origine — repère pour le client, jamais pour le stockage. */
  name: string;
};

export const MAX_STYLE_REFS = 5;

/** Au-delà, on refuse avant même de décoder : ce n'est pas une photo de tenue. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const MAX_EDGE = 900;
const QUALITY = 0.65;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type StyleRefError =
  | "not-image"
  | "too-large"
  | "unreadable";

export type StyleRefResult =
  | { ok: true; ref: StyleRef }
  | { ok: false; error: StyleRefError; name: string };

type Decoded = { source: CanvasImageSource; width: number; height: number };

/**
 * `imageOrientation: "from-image"` applique l'EXIF : sans ça une photo prise au
 * téléphone arrive couchée. Repli par <img> pour les Safari trop anciens pour
 * `createImageBitmap` — le décodeur du système y accepte aussi le HEIC des
 * iPhone, que Chrome desktop, lui, refusera de toute façon.
 */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Redimensionne puis ré-encode en JPEG. */
async function compress(file: File): Promise<string> {
  const { source, width, height } = await decode(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    if (source instanceof ImageBitmap) source.close();
  }
}

export async function fileToStyleRef(file: File): Promise<StyleRefResult> {
  const name = file.name || "photo";
  if (!file.type.startsWith("image/")) return { ok: false, error: "not-image", name };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "too-large", name };
  try {
    return { ok: true, ref: { id: makeId(), dataUrl: await compress(file), name } };
  } catch {
    // Format que le navigateur ne sait pas décoder (HEIC sur desktop, fichier
    // corrompu) — on le signale au lieu de laisser une case vide.
    return { ok: false, error: "unreadable", name };
  }
}

export const STYLE_REF_ERROR_LABELS: Record<StyleRefError, string> = {
  "not-image": "n'est pas une image",
  "too-large": "dépasse 15 Mo",
  unreadable: "n'a pas pu être lu (essayez en JPG ou PNG)",
};
