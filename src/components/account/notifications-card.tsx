"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Bell } from "lucide-react";

import { markMyNotificationsRead } from "@/lib/actions/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/constants";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Le fil de notifications du client sur son espace : un refus de commande y
 * apparaît avec un lien direct vers la commande à relancer. Les notifications
 * passent « lues » dès que le client ouvre son espace — la pastille retombe.
 */
export function NotificationsCard({
  notifications,
}: {
  notifications: Notification[];
}) {
  const hasUnread = notifications.some((n) => !n.is_read);

  // Vues = lues. On efface la pastille côté serveur à l'ouverture de l'espace.
  useEffect(() => {
    if (hasUnread) void markMyNotificationsRead();
  }, [hasUnread]);

  if (notifications.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4" /> Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {notifications.map((n) => {
          const body = (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg p-3",
                n.link && "hover:bg-muted transition-colors",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                  n.type === "order_rejected"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {n.type === "order_rejected" ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Bell className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.is_read && (
                    <span className="bg-primary size-2 shrink-0 rounded-full" />
                  )}
                </div>
                {n.body && (
                  <p className="text-muted-foreground text-sm">{n.body}</p>
                )}
                <p
                  className="text-muted-foreground mt-0.5 text-xs"
                  suppressHydrationWarning
                >
                  {formatTimeAgo(n.created_at)}
                </p>
              </div>
            </div>
          );

          return n.link ? (
            <Link key={n.id} href={n.link} className="block">
              {body}
            </Link>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
      </CardContent>
    </Card>
  );
}
