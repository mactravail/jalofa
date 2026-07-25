import "server-only";

import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { InspirationPost } from "@/lib/types";

/**
 * Une publication « Inspiration » prête à l'affichage : la ligne
 * {@link InspirationPost}, ses photos (URLs publiques, triées) et le tissu du
 * catalogue éventuellement lié.
 */
export type InspirationPostView = InspirationPost & {
  photos: string[];
  fabric: { id: string; name: string; image_url: string | null } | null;
};

// Ce que Supabase renvoie avec les jointures, avant mise à plat.
type PostRow = InspirationPost & {
  inspiration_photos: { image_url: string; sort_order: number }[] | null;
  fabric: { id: string; name: string; image_url: string | null } | null;
};

const SELECT =
  "*, inspiration_photos(image_url, sort_order), fabric:fabrics(id, name, image_url)";

function toView(row: PostRow): InspirationPostView {
  const photos = (row.inspiration_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.image_url);
  return { ...row, photos, fabric: row.fabric ?? null };
}

// --- Données de démonstration (Supabase non branché) -----------------------
// Quelques tenues fictives pour que la galerie ne soit pas vide avant que la
// base ne soit provisionnée — même repli que le reste du catalogue.

const demoImg = (seed: string) => `https://picsum.photos/seed/${seed}/700/900`;

const DEMO_POSTS: InspirationPostView[] = [
  {
    id: "demo-insp-1",
    author_id: "demo-user-1",
    author_name: "Awa",
    caption:
      "Mon grand boubou brodé pour la Tabaski, cousu par mon tailleur à Grand-Yoff. Tombé impeccable.",
    garment_label: "Grand boubou",
    maker_kind: "tailleur_quartier",
    maker_name: "Atelier Mbaye, Grand-Yoff",
    fabric_note: "Bazin riche acheté au marché HLM",
    fabric_id: null,
    is_published: true,
    created_at: new Date(Date.now() - 2 * 864e5).toISOString(),
    photos: [demoImg("jalofa-boubou-a"), demoImg("jalofa-boubou-b")],
    fabric: null,
  },
  {
    id: "demo-insp-2",
    author_id: "demo-user-2",
    author_name: "Fatou",
    caption: "Robe wax portée à un mariage. Le tissu vient d'une boutique à Sandaga.",
    garment_label: "Robe",
    maker_kind: "boutique",
    maker_name: "Boutique Sokhna, Sandaga",
    fabric_note: "Wax Vlisco, boutique Sandaga",
    fabric_id: null,
    is_published: true,
    created_at: new Date(Date.now() - 6 * 864e5).toISOString(),
    photos: [demoImg("jalofa-robe-a")],
    fabric: null,
  },
  {
    id: "demo-insp-3",
    author_id: "demo-user-3",
    author_name: "Cheikh",
    caption: "Ensemble en lin pour tous les jours, acheté tel quel au marché.",
    garment_label: "Ensemble",
    maker_kind: "marche",
    maker_name: "Marché Colobane",
    fabric_note: null,
    fabric_id: null,
    is_published: true,
    created_at: new Date(Date.now() - 10 * 864e5).toISOString(),
    photos: [demoImg("jalofa-lin-a")],
    fabric: null,
  },
];

/** La galerie publique : toutes les publications visibles, les plus récentes d'abord. */
export async function getPublishedInspiration(): Promise<InspirationPostView[]> {
  if (!isSupabaseConfigured()) return DEMO_POSTS;
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspiration_posts")
    .select(SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return ((data as PostRow[] | null) ?? []).map(toView);
}

/** Une publication par son id. `null` si introuvable (ou masquée pour ce visiteur). */
export async function getInspirationPost(
  id: string,
): Promise<InspirationPostView | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_POSTS.find((p) => p.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspiration_posts")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toView(data as PostRow) : null;
}

/** Les publications de l'utilisateur connecté — y compris celles masquées. */
export async function getMyInspiration(): Promise<InspirationPostView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("inspiration_posts")
    .select(SELECT)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });
  return ((data as PostRow[] | null) ?? []).map(toView);
}
