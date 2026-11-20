import type { Metadata } from "next";
import { MessageCircle, PackageCheck } from "lucide-react";

import { VendorShipmentButtons } from "@/components/admin/after-sale-buttons";
import { AdminPage } from "@/components/admin/admin-page";
import { formatDeadline, whatsappHref } from "@/lib/after-sale";
import { getVendorShipmentChecks } from "@/lib/admin-data";
import { formatPrice } from "@/lib/constants";

export const metadata: Metadata = { title: "Envois à vérifier" };

export default async function AdminVendorShipmentChecksPage() {
  const rows = await getVendorShipmentChecks();

  return (
    <AdminPage
      title="Envois à vérifier"
      subtitle="Le tailleur a dit « J'ai reçu le tissu », mais la boutique JALOFA n'avait pas dit « Tissu envoyé ». Vérifiez l'envoi : s'il est confirmé, la commande continue."
    >
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <PackageCheck className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">Aucun envoi à vérifier.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ order, vendorPhone }) => {
            const fabric = order.fabric?.name ?? "le tissu";
            const atelier = order.tailor?.shop_name ?? "le tailleur";
            const denied = order.fabric_vendor_check === "denied";
            const whatsapp = whatsappHref(
              vendorPhone,
              `Bonjour, c'est JALOFA. Avez-vous bien envoyé ${fabric} à ${atelier} (commande ${order.order_number}) ?`,
            );
            const receivedAt = order.fabric_received_at
              ? formatDeadline(new Date(order.fabric_received_at).getTime())
              : null;

            return (
              <div
                key={order.id}
                className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground font-mono text-xs">{order.order_number}</p>
                  <p className="mt-1 font-medium">{order.vendor?.shop_name ?? "Vendeur"}</p>
                  <p className="text-muted-foreground text-sm">
                    {fabric} · {formatPrice(Number(order.fabric_price ?? 0))} → {atelier}
                  </p>
                  {receivedAt && (
                    <p className="mt-1 text-sm">Reçu par le tailleur le {receivedAt}</p>
                  )}
                  {denied && (
                    <p className="mt-1 text-sm font-semibold text-red-500">
                      Envoi démenti : le tissu n&apos;est pas parti de la boutique JALOFA.
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
                      <MessageCircle className="size-4" /> WhatsApp vendeur
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {vendorPhone ? `Tél. ${vendorPhone}` : "Pas de numéro"}
                    </span>
                  )}
                  <VendorShipmentButtons orderId={order.id} denied={denied} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
