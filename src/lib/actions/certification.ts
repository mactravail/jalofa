"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Demande de certification d'un pro (tailleur ou vendeur de tissus).
 *
 * Le pro envoie son vrai nom, son téléphone, son adresse, le nom de son
 * entreprise, une photocopie de sa carte d'identité, et en option son logo, son
 * NINEA et son registre de commerce. Les pièces vont dans le bucket PRIVÉ
 * `certification-docs`, sous son uid (c'est ce préfixe que la policy vérifie).
 *
 * L'administration accepte (le pro reçoit le badge « Certifié ») ou refuse avec
 * un motif — cf. `reviewCertificationRequest`.
 */

export type CertificationKind = "tailor" | "vendor";
export type CertificationFormState = { ok: true } | { ok: false; error: string } | null;

const NOT_CONNECTED =
  "Mode démonstration — votre demande pourra être envoyée une fois la base de données connectée.";

const BUCKET = "certification-docs";
/** Le bucket refuse au-delà de 2 Mo ; on le dit avant qu'il ne réponde. */
const MAX_DOC_BYTES = 2 * 1024 * 1024;
const DOC_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function toFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function field(formData: FormData, name: string, max = 200): string {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

type Db = Awaited<ReturnType<typeof createClient>>;

async function uploadDoc(
  supabase: Db,
  ownerId: string,
  file: File,
  label: string,
  imagesOnly = false,
): Promise<{ path: string } | { error: string }> {
  const ext = DOC_TYPES[file.type];
  if (!ext || (imagesOnly && !LOGO_TYPES.has(file.type))) {
    return {
      error: imagesOnly
        ? `${label} : envoyez une photo (JPEG, PNG ou WebP).`
        : `${label} : envoyez une photo ou un PDF.`,
    };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { error: `${label} : le fichier ne doit pas dépasser 2 Mo.` };
  }
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: `${label} : l'envoi a échoué (${error.message}).` };
  return { path };
}

/** Envoyer une demande de certification depuis l'espace tailleur ou vendeur. */
export async function submitCertificationRequest(
  _prev: CertificationFormState,
  formData: FormData,
): Promise<CertificationFormState> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const kindRaw = field(formData, "kind");
  if (kindRaw !== "tailor" && kindRaw !== "vendor") {
    return { ok: false, error: "Espace inconnu." };
  }
  const kind: CertificationKind = kindRaw;

  const legalName = field(formData, "legal_name", 120);
  const phone = field(formData, "phone", 40);
  const address = field(formData, "address", 300);
  const companyName = field(formData, "company_name", 120);
  const ninea = field(formData, "ninea", 40) || null;
  const idCard = toFile(formData.get("id_card"));
  const logo = toFile(formData.get("logo"));
  const tradeRegister = toFile(formData.get("trade_register"));

  if (legalName.length < 3) return { ok: false, error: "Écrivez votre vrai nom (prénom et nom)." };
  if (phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "Écrivez un numéro de téléphone valide." };
  }
  if (address.length < 5) return { ok: false, error: "Écrivez votre adresse." };
  if (companyName.length < 2) return { ok: false, error: "Écrivez le nom de votre entreprise." };
  if (!idCard) return { ok: false, error: "Ajoutez la photo de votre carte d'identité." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour envoyer votre demande." };

  // Seul un pro qui tient bien ce métier peut demander sa certification.
  const { data: shop } = await supabase
    .from(kind === "tailor" ? "tailors" : "vendors")
    .select("id, is_certified")
    .eq("id", user.id)
    .maybeSingle();
  const s = shop as { id: string; is_certified: boolean } | null;
  if (!s) return { ok: false, error: "Action réservée aux tailleurs et vendeurs." };
  if (s.is_certified) return { ok: false, error: "Vous êtes déjà certifié." };

  const { data: pending } = await supabase
    .from("certification_requests")
    .select("id")
    .eq("pro_id", user.id)
    .eq("kind", kind)
    .eq("status", "pending")
    .limit(1);
  if (pending && pending.length > 0) {
    return { ok: false, error: "Votre demande est déjà en cours d'examen." };
  }

  const idUp = await uploadDoc(supabase, user.id, idCard, "Carte d'identité");
  if ("error" in idUp) return { ok: false, error: idUp.error };

  let logoPath: string | null = null;
  if (logo) {
    const up = await uploadDoc(supabase, user.id, logo, "Logo", true);
    if ("error" in up) return { ok: false, error: up.error };
    logoPath = up.path;
  }

  let registerPath: string | null = null;
  if (tradeRegister) {
    const up = await uploadDoc(supabase, user.id, tradeRegister, "Registre de commerce");
    if ("error" in up) return { ok: false, error: up.error };
    registerPath = up.path;
  }

  const { error } = await supabase.from("certification_requests").insert({
    pro_id: user.id,
    kind,
    legal_name: legalName,
    phone,
    address,
    company_name: companyName,
    ninea,
    id_card_path: idUp.path,
    logo_path: logoPath,
    trade_register_path: registerPath,
  });
  if (error) return { ok: false, error: error.message };

  // Prévenir l'administration (cloche admin). Un échec ne bloque pas la demande.
  try {
    const db = createAdminClient();
    const { data: admins } = await db.from("profiles").select("id").eq("role", "admin");
    if (admins?.length) {
      await db.from("notifications").insert(
        (admins as { id: string }[]).map((a) => ({
          user_id: a.id,
          type: "certification_request",
          title: "Nouvelle demande de certification",
          body: `${companyName} (${kind === "tailor" ? "tailleur" : "vendeur"}) demande à être certifié.`,
          link: "/admin/certifications",
        })),
      );
    }
  } catch {
    // Clé de service absente : la demande reste visible dans /admin/certifications.
  }

  revalidatePath(kind === "tailor" ? "/tailleur/espace/certification" : "/admin/boutique/certification");
  revalidatePath("/admin/certifications");
  return { ok: true };
}

type MutationResult = { ok: true } | { ok: false; error: string };

/**
 * Accepter ou refuser une demande — administration uniquement. Accepter pose le
 * badge `is_certified` sur la boutique (la clé de service passe le garde-fou des
 * colonnes privilégiées) et prévient le pro ; refuser exige un motif.
 */
export async function reviewCertificationRequest(
  id: string,
  decision: "approved" | "rejected",
  note: string | null,
): Promise<MutationResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONNECTED };

  const rls = await createClient();
  const {
    data: { user },
  } = await rls.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous." };
  const { data: profile } = await rls.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    return { ok: false, error: "Action réservée à l'administration." };
  }

  const reason = (note ?? "").trim().slice(0, 500);
  if (decision === "rejected" && reason.length < 3) {
    return { ok: false, error: "Écrivez le motif du refus : le pro le lira." };
  }

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "Clé de service manquante : l'action est indisponible." };
  }

  const { data: row, error: readError } = await db
    .from("certification_requests")
    .select("id, pro_id, kind, status")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  const req = row as { id: string; pro_id: string; kind: CertificationKind; status: string } | null;
  if (!req) return { ok: false, error: "Demande introuvable." };
  if (req.status !== "pending") return { ok: false, error: "Cette demande a déjà été traitée." };

  const table = req.kind === "tailor" ? "tailors" : "vendors";
  if (decision === "approved") {
    const { error } = await db.from(table).update({ is_certified: true }).eq("id", req.pro_id);
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await db
    .from("certification_requests")
    .update({
      status: decision,
      admin_note: decision === "rejected" ? reason : reason || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  const root = req.kind === "tailor" ? "/tailleur/espace" : "/admin/boutique";
  await db.from("notifications").insert({
    user_id: req.pro_id,
    type: decision === "approved" ? "certification_approved" : "certification_rejected",
    title: decision === "approved" ? "Vous êtes certifié !" : "Demande de certification refusée",
    body:
      decision === "approved"
        ? "Le badge « Certifié » apparaît maintenant sur votre page publique."
        : `Motif : ${reason}. Corrigez et renvoyez votre demande.`,
    link: `${root}/certification`,
  });

  revalidatePath("/admin/certifications");
  revalidatePath(`${root}/certification`);
  revalidatePath(req.kind === "tailor" ? "/admin/tailleurs" : "/admin/vendeurs");
  revalidatePath(req.kind === "tailor" ? `/tailleurs/${req.pro_id}` : `/vendeurs/${req.pro_id}`);
  revalidatePath(req.kind === "tailor" ? "/tailleurs" : "/vendeurs");
  return { ok: true };
}
