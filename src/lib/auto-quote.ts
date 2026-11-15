import type { GarmentModel, QuoteMode } from "@/lib/types";

/**
 * Devis automatique d'un modèle : le tailleur fixe une fois pour toutes son prix,
 * sa livraison et son délai. Chaque demande de devis sur ce modèle reçoit alors
 * ce devis tout de suite, sans attendre le tailleur.
 */
export type AutoQuote = {
  price: number;
  deliveryFee: number;
  readyDays: number;
};

/** Les réglages saisis dans le formulaire du modèle. */
export type ModelQuoteSettings = {
  quote_mode: QuoteMode;
  quote_price: number | null;
  quote_delivery_fee: number;
  quote_ready_days: number | null;
};

function int(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Math.round(Number(s));
  return Number.isFinite(n) ? n : null;
}

/**
 * Lit et contrôle les réglages de devis du formulaire. En manuel, les montants
 * saisis sont gardés (le tailleur peut rebasculer sans tout retaper) mais ne
 * servent à rien.
 */
export function parseModelQuoteSettings(
  formData: FormData,
): { ok: true; settings: ModelQuoteSettings } | { ok: false; error: string } {
  const mode: QuoteMode = formData.get("quote_mode") === "auto" ? "auto" : "manual";
  const price = int(formData.get("quote_price"));
  const fee = int(formData.get("quote_delivery_fee"));
  const days = int(formData.get("quote_ready_days"));

  const validPrice = price != null && price > 0 ? price : null;
  const validFee = fee != null && fee >= 0 ? fee : 0;
  const validDays = days != null && days >= 1 && days <= 120 ? days : null;

  if (mode === "auto") {
    if (!validPrice) return { ok: false, error: "Devis automatique : indiquez votre prix fixe." };
    if (fee != null && fee < 0) {
      return { ok: false, error: "Devis automatique : indiquez un prix de livraison valide." };
    }
    if (!validDays) {
      return {
        ok: false,
        error: "Devis automatique : indiquez en combien de jours la tenue sera prête (1 à 120).",
      };
    }
  }

  return {
    ok: true,
    settings: {
      quote_mode: mode,
      quote_price: validPrice,
      quote_delivery_fee: validFee,
      quote_ready_days: validDays,
    },
  };
}

/** Le devis automatique du modèle, ou `null` s'il se chiffre à la main. */
export function modelAutoQuote(
  model: Pick<GarmentModel, "quote_mode" | "quote_price" | "quote_delivery_fee" | "quote_ready_days"> | null | undefined,
): AutoQuote | null {
  if (!model || model.quote_mode !== "auto") return null;
  const price = Number(model.quote_price ?? 0);
  const readyDays = Number(model.quote_ready_days ?? 0);
  if (!(price > 0) || !(readyDays >= 1)) return null;
  return {
    price: Math.round(price),
    deliveryFee: Math.max(0, Math.round(Number(model.quote_delivery_fee ?? 0))),
    readyDays: Math.round(readyDays),
  };
}
