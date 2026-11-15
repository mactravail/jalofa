import "server-only";

import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export type MyCertificationRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  company_name: string;
  created_at: string;
  reviewed_at: string | null;
};

/**
 * La dernière demande de certification du pro connecté pour ce métier, ou null.
 * Retombe sur null si la table n'existe pas encore (migration non appliquée).
 */
export async function getMyCertificationRequest(
  kind: "tailor" | "vendor",
): Promise<MyCertificationRequest | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certification_requests")
    .select("id, status, admin_note, company_name, created_at, reviewed_at")
    .eq("pro_id", user.id)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return data[0] as unknown as MyCertificationRequest;
}
