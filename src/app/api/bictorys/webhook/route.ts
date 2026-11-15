import { NextResponse, type NextRequest } from "next/server";

import { verifyWebhook } from "@/lib/bictorys";
import { settleBictorysEvent } from "@/lib/bictorys-settle";

/**
 * Webhook Bictorys (à déclarer dans Dashboard → Développeurs → Webhooks, en
 * test ET en live : https://jalofa.com/api/bictorys/webhook).
 *
 * - Authentification : `X-Secret-Key` (ou signature HMAC), sinon 401.
 * - L'état réel est relu chez Bictorys (`settleBictorysEvent`) : un appel forgé
 *   ne peut rien payer.
 * - 200 dès que l'événement est traité ou ignoré ; 500 sur erreur interne, pour
 *   que Bictorys réessaie (il le fait trois fois).
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true, result: "ignored" });
  }
  // Certains envois enveloppent la transaction dans `data`.
  const event = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;

  try {
    const result = await settleBictorysEvent(event);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[bictorys webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
