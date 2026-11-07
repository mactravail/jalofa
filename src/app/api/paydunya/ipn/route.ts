import { NextResponse, type NextRequest } from "next/server";

import { settleProPayment } from "@/lib/pro-subscription";

/**
 * IPN PayDunya : appelé par PayDunya quand une facture change d'état. Le corps
 * (form-urlencoded `data[...]`, ou JSON) ne sert qu'à retrouver le token — l'état
 * réel est relu chez PayDunya par `settleProPayment`, donc un appel forgé ne peut
 * rien accorder.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const token = extractToken(raw);
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const status = await settleProPayment(token);
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("[paydunya ipn]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function extractToken(raw: string): string | null {
  // JSON : { data: { invoice: { token } } } ou { token }
  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    const data = (json.data ?? json) as Record<string, unknown>;
    const invoice = data.invoice as Record<string, unknown> | undefined;
    const token = invoice?.token ?? data.token;
    if (typeof token === "string" && token) return token;
  } catch {
    // pas du JSON : form-urlencoded
  }
  const params = new URLSearchParams(raw);
  for (const key of ["data[invoice][token]", "data[token]", "token"]) {
    const value = params.get(key);
    if (value) return value;
  }
  return null;
}
