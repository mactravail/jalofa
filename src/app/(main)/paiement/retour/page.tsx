import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentReturnStatus } from "@/components/cart/payment-return-status";
import { reconcilePayment } from "@/lib/bictorys-settle";
import { getT } from "@/lib/i18n/server";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Paiement") };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bictorys renvoie ici le client après la page de paiement. On ne croit pas
 * l'URL : l'état vient de `payments`, écrit par le webhook vérifié. La RLS ne
 * montre au client que ses propres paiements.
 */
export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  if (!isSupabaseConfigured() || !p || !UUID.test(p)) notFound();

  const user = await getAuthUser();
  if (!user) notFound();
  const supabase = await createClient();

  // Le paiement est-il bien à ce client ? (RLS : on ne lit que les siens.)
  const { data: mine } = await supabase.from("payments" as never).select("status").eq("id", p).maybeSingle();
  if (!mine) notFound();
  // En attente : on relit la transaction chez Bictorys sans attendre le webhook.
  if ((mine as { status: string }).status === "pending") {
    try {
      await reconcilePayment(p);
    } catch (e) {
      console.error("[bictorys reconcile]", e);
    }
  }

  const [{ data: payment }, { data: orders }] = await Promise.all([
    supabase.from("payments" as never).select("status").eq("id", p).maybeSingle(),
    supabase.from("orders").select("order_number, is_quote").eq("payment_id" as never, p),
  ]);
  const pay = payment as { status: string } | null;
  const list = (orders ?? []) as { order_number: string; is_quote: boolean }[];
  // Devis dont le paiement a échoué : il n'est plus rattaché au paiement.
  if (!pay) notFound();

  const status = pay.status === "paid" ? "paid" : pay.status === "pending" ? "pending" : "failed";
  return (
    <PaymentReturnStatus
      status={status}
      orderNumbers={list.map((o) => o.order_number)}
      isQuote={list.length === 0 || list.some((o) => o.is_quote)}
    />
  );
}
