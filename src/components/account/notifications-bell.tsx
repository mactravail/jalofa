import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

/**
 * En tête de l'espace client, seulement s'il y a du nouveau : une grosse
 * cloche avec le nombre de notifications non lues, qui mène à la chronologie.
 */
export function NotificationsBell({ unread }: { unread: number }) {
  if (unread <= 0) return null;

  return (
    <Link
      href="/compte/notifications"
      className="hover:bg-muted flex items-center gap-3 rounded-xl border p-3 transition-colors"
    >
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-400">
        <Bell className="size-5" />
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] leading-5 font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold">
        {unread > 1 ? `${unread} nouvelles notifications` : "1 nouvelle notification"}
      </span>
      <ChevronRight className="text-muted-foreground size-5 shrink-0" />
    </Link>
  );
}
