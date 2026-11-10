import type { Metadata } from "next";

import { ClientNotifications } from "@/components/account/client-notifications";
import { getMyNotifications } from "@/lib/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

/** La cloche du client : tout ce qui est arrivé à ses commandes, jour par jour. */
export default async function ClientNotificationsPage() {
  const notifications = await getMyNotifications(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
      <ClientNotifications notifications={notifications} />
    </div>
  );
}
