import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type OrderContact = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

/**
 * Les coordonnées d'une commande vont dans `order_contacts`, que les pros ne
 * peuvent pas lire : eux ne reçoivent que le code (`order_number`). JALOFA seul
 * relie le code au client.
 *
 * Sans coordonnées, JALOFA ne pourrait ni joindre ni livrer le client : la
 * commande est annulée pour que le client recommence. Il ne peut pas la supprimer
 * lui-même (RLS), d'où le client de service.
 */
export async function saveOrderContact(
  supabase: ServerClient,
  orderId: string,
  contact: OrderContact,
): Promise<boolean> {
  const { error } = await supabase
    .from("order_contacts")
    .insert({ order_id: orderId, ...contact });
  if (!error) return true;

  try {
    await createAdminClient().from("orders").delete().eq("id", orderId);
  } catch {
    // Clé de service absente : la commande reste, sans coordonnées.
  }
  return false;
}
