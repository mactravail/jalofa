import { AdminPage } from "@/components/admin/admin-page";
import { OrderRow } from "@/components/admin/order-row";
import { getAllOrders, gmvOf } from "@/lib/admin-data";
import { formatPrice } from "@/lib/constants";
import { isTerminal } from "@/lib/pipeline";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  const pending = orders.filter((o) => o.status === "received").length;
  const ongoing = orders.filter(
    (o) => o.status !== "received" && !isTerminal(o.status),
  ).length;
  const done = orders.filter((o) => isTerminal(o.status)).length;

  return (
    <AdminPage
      title="Commandes"
      subtitle="Toutes les commandes de la place de marché, de la plus récente."
    >
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

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucune commande.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}
