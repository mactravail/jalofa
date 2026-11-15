import type { Metadata } from "next";

import { ClientCancelledList } from "@/components/account/client-orders-board";
import { getT } from "@/lib/i18n/server";
import { getMyOrders } from "@/lib/orders-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Annulées") };
}

/** Les commandes et demandes de devis que le client (ou JALOFA) a annulées. */
export default async function AccountCancelledPage() {
  const [orders, t] = await Promise.all([getMyOrders(), getT()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">{t("Annulées")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Les commandes et les demandes de devis annulées.")}
        </p>
      </header>
      <ClientCancelledList orders={orders} />
    </div>
  );
}
