import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Statistiques de visite — reçoit les signaux de `<PageTracker />`.
 *
 * - `{ t: "view", id, vid, sid, path, ref }` : une page vient d'être ouverte ;
 * - `{ t: "leave", id, ms }` : le visiteur l'a quittée après `ms` millisecondes.
 *
 * Écrit avec la clé de service (la table n'a aucune policy). Toujours 204 :
 * une statistique ratée ne doit jamais gêner le visiteur.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|whatsapp|vercel|monitor/i;
/** Au-delà de 30 min sur une page, l'onglet est resté ouvert : on plafonne. */
const MAX_MS = 30 * 60 * 1000;

const noContent = () => new NextResponse(null, { status: 204 });

function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Le site d'où vient le visiteur (« google.com », « tiktok.com »…), jamais l'URL complète. */
function sourceOf(ref: unknown, ownHost: string | null): string | null {
  if (typeof ref !== "string" || !ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || host === ownHost?.replace(/^www\./, "").toLowerCase()) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return noContent();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return noContent();
  }
  if (typeof body.id !== "string" || !UUID.test(body.id)) return noContent();

  let db;
  try {
    db = createAdminClient();
  } catch {
    return noContent();
  }

  if (body.t === "view") {
    const { vid, sid, path } = body;
    if (
      typeof vid !== "string" || !UUID.test(vid) ||
      typeof sid !== "string" || !UUID.test(sid) ||
      typeof path !== "string" || !path.startsWith("/")
    ) {
      return noContent();
    }
    await db.from("page_views" as never).insert({
      id: body.id,
      visitor_id: vid,
      session_id: sid,
      path: path.slice(0, 200),
      referrer: sourceOf(body.ref, request.headers.get("host")),
      device: deviceOf(ua),
      country: request.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
    } as never);
  } else if (body.t === "leave") {
    const ms = Math.round(Number(body.ms));
    if (!Number.isFinite(ms) || ms <= 0) return noContent();
    await db
      .from("page_views" as never)
      .update({ duration_ms: Math.min(ms, MAX_MS) } as never)
      .eq("id", body.id);
  }

  return noContent();
}
