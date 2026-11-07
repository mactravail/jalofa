import type { Metadata } from "next";

import { NotificationsCard } from "@/components/account/notifications-card";
import { NewOrdersFeed } from "@/components/dashboard/new-orders-feed";
import { getMyNotifications } from "@/lib/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

/**
 * La cloche de la barre du bas : d'abord les nouvelles commandes (avec
 * Accepter / Refuser sur la carte), puis les messages de la plateforme.
 */
export default async function TailorNotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nouvelles commandes</h2>
        <NewOrdersFeed />
      </section>
      <NotificationsCard notifications={notifications} />
    </div>
  );
}
