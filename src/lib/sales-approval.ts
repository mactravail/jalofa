import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ventes validées par JALOFA — garde anti-arnaque de la Sélection.
 *
 * L'accès PRO est offert : tout le monde peut s'inscrire et publier. Un pro
 * publie librement et reste visible, mais AUCUN client ne peut lui acheter
 * (tissu, prêt-à-porter, sur mesure, devis) tant que l'administration n'a pas
 * validé ses ventes (`sales_approved`, page admin « Validations »).
 *
 * Trois verrous : ce module côté serveur (message clair au client), les
 * boutons d'achat masqués côté interface, et le trigger SQL
 * `orders_guard_sellers_approved` (20260904000001) en dernier rempart.
 */

/** Une boutique peut-elle vendre ? Colonne absente (base pas à jour) = oui. */
export function canSell(shop: { sales_approved?: boolean | null } | null | undefined): boolean {
  return shop?.sales_approved !== false;
}

/** Le court texte montré au client à la place du bouton d'achat. */
export const SALES_PENDING_TITLE = "Bientôt disponible";
export const SALES_PENDING_TEXT =
  "Ce pro vient d'arriver sur JALOFA. Nous vérifions sa boutique : vous pourrez acheter dès qu'elle sera validée.";

/** Le message renvoyé par les actions quand un vendeur n'est pas validé. */
export function salesPendingError(name: string | null | undefined): string {
  const who = name?.trim() ? `« ${name.trim()} »` : "Ce pro";
  return `${who} est en cours de validation par JALOFA : ses articles ne sont pas encore en vente.`;
}

type ShopRow = { id: string; shop_name: string | null; sales_approved?: boolean | null };

/**
 * Le premier pro non validé parmi les tailleurs / vendeurs d'un achat, ou null
 * si tous peuvent vendre. Lit `*` pour rester valable avant la migration.
 */
export async function findUnapprovedSeller(
  supabase: SupabaseClient,
  sellers: { tailorIds?: (string | null | undefined)[]; vendorIds?: (string | null | undefined)[] },
): Promise<string | null> {
  const clean = (ids?: (string | null | undefined)[]) =>
    [...new Set((ids ?? []).filter((id): id is string => Boolean(id)))];
  const tailorIds = clean(sellers.tailorIds);
  const vendorIds = clean(sellers.vendorIds);

  const [tailors, vendors] = await Promise.all([
    tailorIds.length
      ? supabase.from("tailors").select("*").in("id", tailorIds)
      : Promise.resolve({ data: [] as ShopRow[] }),
    vendorIds.length
      ? supabase.from("vendors").select("*").in("id", vendorIds)
      : Promise.resolve({ data: [] as ShopRow[] }),
  ]);

  const blocked = [
    ...((tailors.data ?? []) as ShopRow[]),
    ...((vendors.data ?? []) as ShopRow[]),
  ].find((shop) => !canSell(shop));
  return blocked ? salesPendingError(blocked.shop_name) : null;
}

// --- Tissus pas encore en vente ---------------------------------------------

/**
 * La vente des tissus JALOFA est-elle ouverte ? Tant que c'est `false`, tous les
 * tissus restent visibles et s'essaient sur une tenue, mais AUCUN ne s'achète
 * (ni seul, ni dans une tenue sur mesure). Le site n'affiche pas « démo » :
 * le client lit « Bientôt en vente ». Passer à `true` pour ouvrir la vente.
 */
export const FABRIC_SALES_OPEN = false;

/**
 * Tissu qui ne s'achète pas : vente des tissus fermée (ci-dessus), ou tissu
 * sans boutique (`vendor_id` vide, mode démonstration sans Supabase).
 */
export function isDemoFabric(fabric: { vendor_id?: string | null } | null | undefined): boolean {
  if (!fabric) return false;
  return !FABRIC_SALES_OPEN || !fabric.vendor_id;
}

export const DEMO_FABRIC_TITLE = "Bientôt en vente";
export const DEMO_FABRIC_TEXT =
  "Ce tissu n'est pas encore en vente. Vous pouvez déjà l'essayer sur une tenue : la vente ouvre très bientôt.";

/** Le message renvoyé par les actions quand un tissu de démo est commandé. */
export function demoFabricError(name: string | null | undefined): string {
  const what = name?.trim() ? `Le tissu « ${name.trim()} »` : "Ce tissu";
  return `${what} n'est pas encore en vente : la vente des tissus JALOFA ouvre très bientôt.`;
}
