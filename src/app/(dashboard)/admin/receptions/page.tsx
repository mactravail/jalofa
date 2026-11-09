import type { Metadata } from "next";
import { MessageCircle, PackageCheck } from "lucide-react";

import { MarkFabricReceivedButton } from "@/components/admin/after-sale-buttons";
import { AdminPage } from "@/components/admin/admin-page";
import { RECEIPT_CONFIRM_HOURS, formatDeadline, whatsappHref } from "@/lib/after-sale";
import { getFabricsAwaitingReceipt } from "@/lib/admin-data";
import { clientNameOf } from "@/lib/clients";

export const metadata: Metadata = { title: "Tissus à confirmer" };

/** Passé ce moment, le client n'a pas répondu : le tissu est considéré comme reçu. */
function confirmDeadline(shippedAt: string | null): number | null {
  if (!shippedAt) return null;
  return new Date(shippedAt).getTime() + RECEIPT_CONFIRM_HOURS * 3_600_000;
}

function isPast(ms: number): boolean {
  return Date.now() >= ms;
}

export default async function AdminFabricReceiptsPage() {
  const rows = await getFabricsAwaitingReceipt();

  return (
    <AdminPage
      title="Tissus à confirmer"
      subtitle={`Le vendeur a envoyé le tissu. Écrivez au client sur WhatsApp. S'il ne répond pas après ${RECEIPT_CONFIRM_HOURS} h, considérez le tissu comme reçu.`}
    >
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <PackageCheck className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">Aucun tissu à confirmer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ order, shippedAt }) => {
            const fabric = order.fabric?.name ?? "votre tissu";
            const whatsapp = whatsappHref(
              order.contact_phone ?? order.client?.phone,
              `Bonjour, c'est JALOFA. Avez-vous bien reçu ${fabric} (commande ${order.order_number}) ?`,
            );
            const deadline = confirmDeadline(shippedAt);

            return (
              <div
                key={order.id}
                className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground font-mono text-xs">
                    {order.order_number}
                  </p>
                  <p className="mt-1 font-medium">{clientNameOf(order)}</p>
                  <p className="text-muted-foreground text-sm">
                    {fabric} · {order.vendor?.shop_name ?? "Vendeur"}
                  </p>
                  {deadline !== null && (
                    <p className="mt-1 text-sm font-medium">
                      {isPast(deadline)
                        ? `${RECEIPT_CONFIRM_HOURS} h passées : le tissu peut être considéré comme reçu`
                        : `Sans réponse le ${formatDeadline(deadline)} : tissu considéré comme reçu`}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="border-input hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">Numéro inutilisable</span>
                  )}
                  <MarkFabricReceivedButton orderId={order.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
