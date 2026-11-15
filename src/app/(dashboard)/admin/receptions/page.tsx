import type { Metadata } from "next";
import { AlertTriangle, MessageCircle, PackageCheck, Phone } from "lucide-react";

import { ReceiptAnswerButtons } from "@/components/admin/after-sale-buttons";
import { AdminPage } from "@/components/admin/admin-page";
import { PAYOUT_DELAY_HOURS, formatDeadline, whatsappHref } from "@/lib/after-sale";
import { getOrdersAwaitingReceipt } from "@/lib/admin-data";
import { clientNameOf } from "@/lib/clients";

export const metadata: Metadata = { title: "Colis à confirmer" };

const HOUR_MS = 3_600_000;

/**
 * La livraison = l'arrivée annoncée par le tailleur, sinon l'envoi. 24 h après,
 * sans « pas reçu » du client, le colis est considéré comme reçu.
 */
function answerDeadline(shippedAt: string | null, eta: string | null | undefined): number | null {
  const from = [shippedAt, eta]
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
    .reduce<number | null>((max, t) => (max === null || t > max ? t : max), null);
  return from === null ? null : from + PAYOUT_DELAY_HOURS * HOUR_MS;
}

function isPast(ms: number): boolean {
  return Date.now() >= ms;
}

export default async function AdminReceiptsPage() {
  const rows = await getOrdersAwaitingReceipt();


  return (
    <AdminPage
      title="Colis à confirmer"
      subtitle={`La commande est en route. Demandez au client s'il l'a reçue. Pas de réponse ${PAYOUT_DELAY_HOURS} h après la livraison : elle est considérée comme reçue et le pro peut être payé.`}
    >
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <PackageCheck className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">Aucun colis en route.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ order, shippedAt, clientPhone }) => {
            const isFabric = order.type === "fabric_only";
            const what = isFabric
              ? (order.fabric?.name ?? "votre tissu")
              : (order.model?.name ? `votre ${order.model.name}` : "votre tenue");
            const whatsapp = whatsappHref(
              clientPhone,
              `Bonjour, c'est JALOFA. Avez-vous bien reçu ${what} (commande ${order.order_number}) ? Répondez OUI ou NON.`,
            );
            const deadline = answerDeadline(shippedAt, order.courier_eta);
            const disputed = !!order.receipt_disputed_at;
            const pro = isFabric
              ? (order.vendor?.shop_name ?? "Vendeur")
              : (order.tailor?.shop_name ?? "Tailleur");

            return (
              <div
                key={order.id}
                className={`bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center ${disputed ? "border-red-500/50" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground font-mono text-xs">{order.order_number}</p>
                  <p className="mt-1 font-medium">{clientNameOf(order)}</p>
                  <p className="text-muted-foreground text-sm">
                    {isFabric ? "Tissu" : "Tenue"} · {isFabric ? (order.fabric?.name ?? "") : (order.model?.name ?? "")} · {pro}
                  </p>
                  {!isFabric && (order.courier_name || order.courier_phone) && (
                    <p className="text-muted-foreground text-sm">
                      Livreur : {[order.courier_name, order.courier_phone].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {disputed ? (
                    <p className="mt-2 flex items-start gap-2 text-sm font-medium text-red-400">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      Le client dit qu&apos;il n&apos;a pas reçu son colis. Personne n&apos;est payé :
                      appelez le {isFabric ? "vendeur" : "tailleur et le livreur"}. Jamais livré ?
                      Remboursez depuis « Annulations ».
                    </p>
                  ) : (
                    deadline !== null && (
                      <p className="mt-1 text-sm font-medium" suppressHydrationWarning>
                        {isPast(deadline)
                          ? `${PAYOUT_DELAY_HOURS} h passées sans réponse : considérez la commande comme reçue`
                          : `Sans réponse le ${formatDeadline(deadline)} : considérée comme reçue`}
                      </p>
                    )
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {whatsapp ? (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="border-input hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                      >
                        <MessageCircle className="size-4" /> Demander au client
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">Numéro inutilisable</span>
                    )}
                    {clientPhone && (
                      <a
                        href={`tel:${clientPhone.replace(/\s/g, "")}`}
                        className="border-input hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                      >
                        <Phone className="size-4" /> Appeler
                      </a>
                    )}
                  </div>
                  <ReceiptAnswerButtons orderId={order.id} disputed={disputed} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
