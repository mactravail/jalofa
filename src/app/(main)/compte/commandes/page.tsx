import Link from "next/link";
import { Package } from "lucide-react";

import { OrderCard } from "@/components/order/order-card";
import { buttonVariants } from "@/components/ui/button";
import { getMyOrders } from "@/lib/orders-data";
import { isSupabaseConfigured } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default async function MyOrdersPage() {
  const orders = await getMyOrders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Package className="text-muted-foreground mx-auto size-8" />
          <p className="text-muted-foreground mt-3">
            {isSupabaseConfigured()
              ? "Vous n'avez pas encore de commande."
              : "Vos commandes s'afficheront ici une fois la base de données connectée."}
          </p>
          <Link href="/modeles" className={cn(buttonVariants(), "mt-4")}>
            Créer une tenue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              href={`/compte/commandes/${order.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
