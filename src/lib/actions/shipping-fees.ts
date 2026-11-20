"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type ShippingFeesState = { ok: true } | { ok: false; error: string } | null;

/** Champ vide = option non proposée ; 0 = livraison offerte. */
function parseFee(raw: FormDataEntryValue | null): number | null | "invalid" {
  const text = String(raw ?? "").replace(/\s/g, "");
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 500_000) return "invalid";
  return Math.round(n);
}

/**
 * Le pro fixe ses prix de livraison (décision du 2026-11-13 : chaque pro, sur
 * son profil). Vendeur : envoi du tissu (à l'atelier, ou au client pour un tissu
 * seul). Tailleur : livraison du vêtement fini. Affichés au client avant le
 * paiement, recalculés par le serveur à la caisse (`quoteLines`).
 */
export async function saveShippingFees(
  _prev: ShippingFeesState,
  formData: FormData,
): Promise<ShippingFeesState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "La base de données n'est pas encore connectée." };
  }
  const role = String(formData.get("role"));
  if (role !== "tailor" && role !== "vendor") return { ok: false, error: "Métier inconnu." };

  const economy = parseFee(formData.get("economy"));
  const express = parseFee(formData.get("express"));
  if (economy === "invalid" || express === "invalid") {
    return { ok: false, error: "Indiquez un montant en FCFA (0 si la livraison est offerte)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { error } = await supabase
    .from(role === "tailor" ? "tailors" : "vendors")
    .update({ ship_fee_economy: economy, ship_fee_express: express } as never)
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(role === "tailor" ? "/tailleur/espace" : "/admin/boutique", "layout");
  return { ok: true };
}
