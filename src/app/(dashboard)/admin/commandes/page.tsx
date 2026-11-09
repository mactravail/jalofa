import { Search } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { OrderRow } from "@/components/admin/order-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllOrders, gmvOf } from "@/lib/admin-data";
import { clientNameOf } from "@/lib/clients";
import { formatPrice } from "@/lib/constants";
import type { OrderListItem } from "@/lib/orders-data";
import { isTerminal } from "@/lib/pipeline";

/** Retrouver qui se cache derrière un code, ou le code d'un client. */
function matches(order: OrderListItem, query: string): boolean {
  return [
    order.order_number,
    clientNameOf(order),
    order.contact_phone,
    order.client?.phone,
    order.contact_email,
  ].some((value) => value?.toLowerCase().includes(query));
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const orders = await getAllOrders();
  const shown = query ? orders.filter((o) => matches(o, query)) : orders;

  const pending = orders.filter((o) => o.status === "received").length;
  const ongoing = orders.filter(
    (o) => o.status !== "received" && !isTerminal(o.status),
  ).length;
  const done = orders.filter((o) => isTerminal(o.status)).length;

  return (
    <AdminPage
      title="Commandes"
      subtitle="Toutes les commandes, de la plus récente. Pendant le devis, vous seul voyez à qui appartient chaque code."
    >
      <form method="get" className="mb-4 flex max-w-md gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Code, nom, téléphone ou e-mail"
          aria-label="Chercher une commande"
        />
        <Button type="submit">
          <Search className="size-4" /> Chercher
        </Button>
      </form>

      <div className="text-muted-foreground mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <strong className="text-foreground">{orders.length}</strong> au total
        </span>
        <span>
          <strong className="text-foreground">{pending}</strong> en attente
        </span>
        <span>
          <strong className="text-foreground">{ongoing}</strong> en cours
        </span>
        <span>
          <strong className="text-foreground">{done}</strong> terminées
        </span>
        <span>
          <strong className="text-foreground">{formatPrice(gmvOf(orders))}</strong>{" "}
          encaissés
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucune commande.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {shown.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}
