"use client";

import { useEffect } from "react";

import {
  TimelineDays,
  notificationEvent,
} from "@/components/dashboard/notifications-timeline";
import { markMyNotificationsRead } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types";

/**
 * La chronologie du client : devis prêt, commande acceptée, couture, envoi,
 * livraison, tissu… Ouvrir la page = tout est lu, la pastille de la cloche
 * retombe (les points « nouveau » restent visibles pendant cette visite).
 */
export function ClientNotifications({
  notifications,
}: {
  notifications: Notification[];
}) {
  const hasUnread = notifications.some((n) => !n.is_read);

  useEffect(() => {
    if (hasUnread) void markMyNotificationsRead();
    // Une seule fois par visite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <TimelineDays events={notifications.map(notificationEvent)} />;
}
