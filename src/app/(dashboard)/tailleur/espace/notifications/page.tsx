import type { Metadata } from "next";

import { NewOrdersFeed } from "@/components/dashboard/new-orders-feed";
import { NotificationsTimeline } from "@/components/dashboard/notifications-timeline";
import { getMyNotifications } from "@/lib/notifications-data";
import { getT } from "@/lib/i18n/server";
import { T } from "@/components/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Notifications") };
}

/**
 * La cloche de la barre du bas : d'abord les commandes qui attendent une
 * réponse (Accepter / Refuser sur la carte), puis la chronologie de tout ce qui
 * est arrivé. Ouvrir cette page = notifications lues, la pastille retombe.
 */
export default async function TailorNotificationsPage() {
  const notifications = await getMyNotifications(50);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight"><T>Notifications</T></h1>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold"><T>À répondre</T></h2>
        <NewOrdersFeed />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold"><T>Chronologie</T></h2>
        <NotificationsTimeline notifications={notifications} />
      </section>
    </div>
  );
}
