import type { Metadata } from "next";
import { MessageCircle, Undo2 } from "lucide-react";

import { MarkRefundedButton } from "@/components/admin/after-sale-buttons";
import { AdminPage } from "@/components/admin/admin-page";
import { whatsappHref } from "@/lib/after-sale";
import { getRefundsDue } from "@/lib/admin-data";
import { clientNameOf } from "@/lib/clients";
import { PAYMENT_METHOD_LABELS, formatPrice } from "@/lib/constants";

export const metadata: Metadata = { title: "Remboursements" };

export default async function AdminRefundsPage() {
  const refunds = await getRefundsDue();

  return (
    <AdminPage
      title="Remboursements"
      subtitle="Les clients à rembourser : commandes annulées et tissus retournés reçus par le vendeur."
    >
      {refunds.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Undo2 className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">Aucun remboursement à faire.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map(({ order, amount, reason }) => {
            const whatsapp = whatsappHref(
              order.contact_phone ?? order.client?.phone,
              `Bonjour, c'est JALOFA, au sujet du remboursement de votre commande ${order.order_number}.`,
            );
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
                    {reason}
                    {order.payment_method &&
                      ` · payé par ${PAYMENT_METHOD_LABELS[order.payment_method]}`}
                  </p>
                  <p className="text-primary mt-1 text-lg font-bold whitespace-nowrap">
                    {formatPrice(amount)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="border-input hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  )}
                  <MarkRefundedButton orderId={order.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
