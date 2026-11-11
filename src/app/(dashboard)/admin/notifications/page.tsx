import type { Metadata } from "next";

import { ClientNotifications } from "@/components/account/client-notifications";
import { AdminPage } from "@/components/admin/admin-page";
import { getMyNotifications } from "@/lib/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

/**
 * La cloche de l'administration : les alertes de la place de marché, jour par
 * jour (ex. un tailleur a masqué un modèle déjà commandé). Ouvrir la page = tout
 * est lu, la pastille retombe.
 */
export default async function AdminNotificationsPage() {
  const notifications = await getMyNotifications(50);

  return (
    <AdminPage
      title="Notifications"
      subtitle="Les alertes de la place de marché, de la plus récente à la plus ancienne."
    >
      <ClientNotifications notifications={notifications} />
    </AdminPage>
  );
}
