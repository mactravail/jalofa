import type { Metadata } from "next";

import { ClientNotifications } from "@/components/account/client-notifications";
import { getMyNotifications } from "@/lib/notifications-data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Notifications") };
}

/** La cloche du client : tout ce qui est arrivé à ses commandes, jour par jour. */
export default async function ClientNotificationsPage() {
  const notifications = await getMyNotifications(50);
  const t = await getT();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("Notifications")}</h1>
      <ClientNotifications notifications={notifications} />
    </div>
  );
}
