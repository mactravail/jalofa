"use server";

import { revalidatePath } from "next/cache";

import { markDemoFabricSalesRead } from "@/lib/notifications-demo";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/** Clears the unread badges on the vendor's fabric-sale notifications. */
export async function markFabricSalesRead() {
  if (!isSupabaseConfigured()) {
    markDemoFabricSalesRead();
    revalidatePath("/vendeur/espace", "layout");
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("type", "fabric_sale")
    .eq("is_read", false);
  if (error) throw new Error(error.message);

  revalidatePath("/vendeur/espace", "layout");
}

/**
 * Marque comme lues les notifications de l'utilisateur (hors ventes de tissu,
 * qui ont leur propre panneau). Appelée quand le client ouvre son espace : la
 * pastille « non lu » retombe une fois qu'il a vu ses notifications.
 */
export async function markMyNotificationsRead() {
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .neq("type", "fabric_sale")
    .eq("is_read", false);
  if (error) throw new Error(error.message);

  revalidatePath("/compte", "layout");
}
