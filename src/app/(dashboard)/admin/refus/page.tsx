import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Phone, Scissors } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { clientNameOf } from "@/lib/clients";
import {
  ORDER_TYPE_LABELS,
  REJECTION_REASON_CLIENT_LABELS,
  formatReceivedAt,
} from "@/lib/constants";
import { getAllOrders } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Refus" };

/** Numéro tel:… normalisé, ou null s'il n'y a rien de composable. */
function telHref(phone: string | null | undefined): string | null {
  const raw = (phone ?? "").replace(/[^\d+]/g, "");
  return raw.length >= 6 ? `tel:${raw}` : null;
}

export default async function AdminRejectionsPage() {
  const orders = await getAllOrders();
  const rejected = orders.filter((o) => o.status === "rejected");

  return (
    <AdminPage
      title="Commandes refusées"
      subtitle="Les clients à rappeler : un tailleur a refusé, orientez-les vers un autre atelier. La commande quitte cette liste dès que le client relance."
    >
      {rejected.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Ban className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">
            Aucune commande refusée en attente. Tout roule 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rejected.map((order) => {
            const garment =
              order.model?.name ??
              order.fabric?.name ??
              ORDER_TYPE_LABELS[order.type];
            const phone = order.client?.phone ?? order.contact_phone ?? null;
            const tel = telHref(phone);

            return (
              <div
                key={order.id}
                className="border-destructive/30 bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">
                      {order.order_number}
                    </span>
                    <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                      <Ban className="size-3" /> Refusée
                    </span>
                  </div>

                  <p className="mt-1 font-medium">{clientNameOf(order)}</p>
                  <p className="text-muted-foreground text-sm">
                    {garment} · {ORDER_TYPE_LABELS[order.type]}
                  </p>

                  <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Scissors className="size-3" />
                      Refusée par {order.tailor?.shop_name ?? "un tailleur"}
                    </span>
                    <span suppressHydrationWarning>
                      {formatReceivedAt(order.updated_at)}
                    </span>
                  </p>

                  <p className="text-foreground/80 mt-2 text-sm">
                    Motif :{" "}
                    <span className="font-medium">
                      {order.rejection_reason
                        ? REJECTION_REASON_CLIENT_LABELS[order.rejection_reason]
                        : "non précisé"}
                    </span>
                  </p>
                </div>

                <div className="shrink-0">
                  {tel ? (
                    <a
                      href={tel}
                      className="border-input hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      <Phone className="size-4" /> {phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Téléphone non renseigné
                    </span>
                  )}
                  <Link
                    href={`/admin/commandes`}
                    className="text-muted-foreground hover:text-foreground mt-2 block text-center text-xs"
                  >
                    Voir les commandes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
