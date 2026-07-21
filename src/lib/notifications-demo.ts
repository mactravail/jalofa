import "server-only";

import type { FabricSale } from "@/lib/notifications-data";
import { DEMO_VENDOR_ORDERS } from "@/lib/orders-demo";

// Fabric-sale notifications for the vendor dashboard while Supabase is not
// provisioned. Without a database there is no trigger to raise them, so the
// checkout writes here instead and the dashboard reads back — enough for a
// purchase to reach the vendor within the same server process.
//
// They hang off `globalThis` so a dev HMR reload does not wipe them; a server
// restart does, which is all a demo needs.

type GlobalWithSales = typeof globalThis & {
  __nataalDemoFabricSales__?: FabricSale[];
};

/** What the checkout knows about a sale — the store stamps the rest. */
export type DemoFabricSale = Omit<FabricSale, "id" | "created_at" | "is_read">;

// Seeded from the demo orders board so the panel matches the orders already
// listed there, newest left unread to show both states.
function seed(): FabricSale[] {
  return DEMO_VENDOR_ORDERS.flatMap((o) =>
    o.fabric
      ? [
          {
            id: `demo-sale-${o.id}`,
            created_at: o.created_at,
            is_read: o.status !== "received",
            order_id: o.id,
            order_number: o.order_number,
            fabric_name: o.fabric.name,
            fabric_image: o.fabric.image_url,
            fabric_meters: o.fabric_meters,
            fabric_price: o.fabric_price,
            client_name: o.client?.full_name ?? null,
          },
        ]
      : [],
  ).slice(0, 3);
}

function store(): FabricSale[] {
  const g = globalThis as GlobalWithSales;
  g.__nataalDemoFabricSales__ ??= seed();
  return g.__nataalDemoFabricSales__;
}

export function listDemoFabricSales(): FabricSale[] {
  return store();
}

export function recordDemoFabricSales(sales: DemoFabricSale[]): void {
  const now = new Date().toISOString();
  const stamp = Date.now().toString(36);
  store().unshift(
    ...sales.map((sale, i) => ({
      ...sale,
      id: `demo-sale-${stamp}-${i}`,
      created_at: now,
      is_read: false,
    })),
  );
}

export function markDemoFabricSalesRead(): void {
  for (const sale of store()) sale.is_read = true;
}
