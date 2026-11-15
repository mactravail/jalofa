import "server-only";

import { MEASUREMENT_FIELDS } from "@/lib/constants";
import {
  SAVED_ADDRESS_LABEL,
  SAVED_MEASUREMENT_LABEL,
  type SavedAddress,
  type SavedProfile,
} from "@/lib/saved-profile";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type SaveResult = { ok: true } | { ok: false; error: string };

export type SavedContactInput = {
  full_name?: string | null;
  phone: string;
  address: SavedAddress | null;
};

/** Seules les colonnes de mesures connues, en nombres finis et plausibles. */
export function cleanValues(values: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(
    MEASUREMENT_FIELDS.flatMap(({ key }) => {
      const v = Number(values?.[key]);
      return Number.isFinite(v) && v > 0 && v < 400 ? [[key, Math.round(v * 10) / 10]] : [];
    }),
  ) as Record<string, number>;
}

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Mesures, téléphone et adresse enregistrés d'un client. */
export async function readSavedProfile(
  supabase: ServerClient,
  userId: string,
): Promise<SavedProfile> {
  const [{ data: profile }, { data: m }, { data: a }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
    supabase
      .from("measurements")
      .select("*")
      .eq("user_id", userId)
      .eq("label", SAVED_MEASUREMENT_LABEL)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const p = profile as { full_name: string | null; phone: string | null } | null;
  const row = m as Record<string, unknown> | null;
  const addr = a as Record<string, unknown> | null;

  return {
    full_name: p?.full_name?.trim() || null,
    phone: p?.phone?.trim() || null,
    measurement: row
      ? {
          mode: row.mode === "manual" ? "manual" : "standard",
          standard_size: (row.standard_size as string | null) ?? null,
          values: cleanValues(row),
        }
      : null,
    address: addr
      ? {
          address_line: String(addr.address_line ?? ""),
          city: String(addr.city ?? ""),
          region: (addr.region as string | null) ?? null,
          country: String(addr.country ?? "") || "Sénégal",
        }
      : null,
  };
}

/**
 * Téléphone (et nom) sur le profil, adresse comme adresse par défaut
 * (`is_default`). Une seule adresse enregistrée : elle est mise à jour en place.
 */
export async function writeSavedContact(
  supabase: ServerClient,
  userId: string,
  input: SavedContactInput,
): Promise<SaveResult> {
  const phone = clip(input?.phone, 40);
  if (!phone) return { ok: false, error: "Indiquez votre numéro de téléphone." };
  const fullName = clip(input?.full_name, 120);

  const { error: pErr } = await supabase
    .from("profiles")
    .update(fullName ? { phone, full_name: fullName } : { phone })
    .eq("id", userId);
  if (pErr) return { ok: false, error: pErr.message };

  if (input?.address) {
    const address = {
      address_line: clip(input.address.address_line, 300),
      city: clip(input.address.city, 120),
      region: clip(input.address.region, 120) || null,
      country: clip(input.address.country, 80) || "Sénégal",
    };
    if (!address.address_line || !address.city) {
      return { ok: false, error: "Indiquez votre adresse et votre ville." };
    }
    const row = {
      ...address,
      label: SAVED_ADDRESS_LABEL,
      recipient_name: fullName || null,
      phone,
    };
    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();
    const { error } = existing
      ? await supabase.from("addresses").update(row).eq("id", (existing as { id: string }).id)
      : await supabase.from("addresses").insert({ ...row, user_id: userId, is_default: true });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}
