import type { Metadata } from "next";

import { NewOrdersFeed } from "@/components/dashboard/new-orders-feed";
import { NotificationsTimeline } from "@/components/dashboard/notifications-timeline";
import { getMyNotifications } from "@/lib/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

/**
 * La cloche de la barre du bas : d'abord les commandes qui attendent une
 * réponse (Accepter / Refuser sur la carte), puis la chronologie de tout ce qui
 * est arrivé. Ouvrir cette page = notifications lues, la pastille retombe.
 */
export default async function TailorNotificationsPage() {
  const notifications = await getMyNotifications(50);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">À répondre</h2>
        <NewOrdersFeed />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Chronologie</h2>
        <NotificationsTimeline notifications={notifications} />
      </section>
    </div>
  );
}
