import { parseTailorBodyFits, type TailorBodyFits } from "@/lib/model-body-fit";
import type { createClient } from "@/lib/supabase/server";

// Lecture du tableau « Mes métrages » des tailleurs. Tant que la migration
// `20260823000001_tailor_body_fits` n'est pas passée, la table manque : on rend
// un tableau vide et chaque modèle garde son propre métrage.

type Db = Awaited<ReturnType<typeof createClient>>;

export async function loadTailorBodyFits(
  supabase: Db,
  tailorIds: (string | null | undefined)[],
): Promise<Map<string, TailorBodyFits>> {
  const ids = [...new Set(tailorIds.filter((id): id is string => Boolean(id)))];
  const out = new Map<string, TailorBodyFits>();
  if (ids.length === 0) return out;
  const { data, error } = await supabase
    .from("tailor_body_fits")
    .select("tailor_id, fits")
    .in("tailor_id", ids);
  if (error) return out;
  for (const row of (data ?? []) as { tailor_id: string; fits: unknown }[]) {
    out.set(row.tailor_id, parseTailorBodyFits(row.fits));
  }
  return out;
}

export async function loadOneTailorBodyFits(
  supabase: Db,
  tailorId: string,
): Promise<TailorBodyFits> {
  return (await loadTailorBodyFits(supabase, [tailorId])).get(tailorId) ?? {};
}
