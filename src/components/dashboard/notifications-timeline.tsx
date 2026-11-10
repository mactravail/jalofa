"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  PackageCheck,
  Pencil,
  ShoppingBag,
  Tag,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  markNotificationsSeen,
  readSeen,
} from "@/components/dashboard/notifications-seen";
import { usePipeline } from "@/components/dashboard/pipeline-store";
import { markMyNotificationsRead } from "@/lib/actions/notifications";
import { ORDER_TYPE_LABELS } from "@/lib/constants";
import { DASHBOARD_ROOT } from "@/lib/dashboard-nav";
import { bucketOf, pipelineType, type OrderBucket } from "@/lib/pipeline";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  at: string;
  title: string;
  body: string | null;
  href: string | null;
  icon: LucideIcon;
  tone: string;
  /** Lu côté serveur (notification) — les commandes se jugent à la dernière visite. */
  read?: boolean;
};

const TONES: Record<string, { icon: LucideIcon; tone: string }> = {
  new_order: { icon: ShoppingBag, tone: "bg-sky-500/15 text-sky-400" },
  quote_request: { icon: Tag, tone: "bg-amber-500/15 text-amber-400" },
  quote_revised: { icon: Pencil, tone: "bg-amber-500/15 text-amber-400" },
  quote_paid: { icon: Wallet, tone: "bg-emerald-500/15 text-emerald-400" },
  fabric_shipped: { icon: Truck, tone: "bg-violet-500/15 text-violet-400" },
  fabric_received: { icon: PackageCheck, tone: "bg-emerald-500/15 text-emerald-400" },
  order_rejected: { icon: AlertTriangle, tone: "bg-rose-500/15 text-rose-400" },
};
const DEFAULT_TONE = { icon: Bell, tone: "bg-muted text-muted-foreground" };

const BUCKET_PATH: Record<OrderBucket, string> = {
  todo: "a-traiter",
  ongoing: "en-cours",
  done: "terminees",
};

const DAY_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const CLOCK = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  const label = DAY_LONG.format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * La chronologie de la cloche : tout ce qui est arrivé, du plus récent au plus
 * ancien, rangé par jour (« Aujourd'hui », « Hier », « lundi 8 novembre »…).
 * Mélange les notifications de la base (devis, tissu, paiement…) et l'arrivée
 * des commandes. Ouvrir la page = tout est lu : la pastille rouge retombe.
 */
export function NotificationsTimeline({
  notifications,
}: {
  notifications: Notification[];
}) {
  const { role, orders } = usePipeline();
  const root = DASHBOARD_ROOT[role];
  // Dernière visite AVANT celle-ci : ce qui est plus récent garde son point « nouveau ».
  const [prevSeen, setPrevSeen] = useState<number | null>(null);

  useEffect(() => {
    // Lu dans le navigateur après le montage (localStorage), puis on marque vu.
    const remember = () => setPrevSeen(readSeen());
    remember();
    markNotificationsSeen();
    if (notifications.some((n) => !n.is_read)) void markMyNotificationsRead();
    // Une seule fois par visite de la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events: Event[] = [
    ...notifications.map((n) => {
      const t = TONES[n.type] ?? DEFAULT_TONE;
      return {
        id: n.id,
        at: n.created_at,
        title: n.title,
        body: n.body,
        href: n.link,
        icon: t.icon,
        tone: t.tone,
        read: n.is_read,
      };
    }),
    // Les devis ont déjà leur notification « Nouvelle demande de devis ».
    ...orders
      .filter((o) => !o.is_quote)
      .map((o) => {
        const bucket = bucketOf(role, o.status, pipelineType(o));
        const name = o.model?.name ?? o.fabric?.name ?? ORDER_TYPE_LABELS[o.type];
        return {
          id: `order-${o.id}`,
          at: o.created_at,
          title: "Nouvelle commande",
          body: `${name} · Code ${o.order_number}`,
          href: `${root}/${BUCKET_PATH[bucket]}`,
          ...TONES.new_order,
        };
      }),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Bell className="text-muted-foreground mx-auto size-7" />
        <p className="text-muted-foreground mt-3 text-sm">Aucune notification pour l&apos;instant.</p>
      </div>
    );
  }

  const isNew = (e: Event) =>
    e.read !== undefined
      ? !e.read
      : prevSeen !== null && Date.parse(e.at) > prevSeen;

  // Regroupement par jour, l'ordre est déjà le bon.
  const days: { label: string; items: Event[] }[] = [];
  for (const e of events) {
    const label = dayLabel(e.at);
    const last = days.at(-1);
    if (last?.label === label) last.items.push(e);
    else days.push({ label, items: [e] });
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {days.map((day) => (
        <section key={day.label} className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {day.label}
          </h3>
          <ol className="relative">
            {day.items.map((e, i) => {
              const last = i === day.items.length - 1;
              const row = (
                <div
                  className={cn(
                    "flex gap-3 rounded-lg p-2",
                    e.href && "hover:bg-muted/50 transition-colors",
                  )}
                >
                  <div className="relative flex flex-col items-center">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        e.tone,
                      )}
                    >
                      <e.icon className="size-4" />
                    </span>
                    {!last && <span className="bg-border mt-1 w-px flex-1" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 text-sm leading-snug font-semibold">
                        {e.title}
                      </p>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {CLOCK.format(new Date(e.at)).replace(":", " h ")}
                      </span>
                      {isNew(e) && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500"
                          aria-label="Nouveau"
                        />
                      )}
                    </div>
                    {e.body && (
                      <p className="text-muted-foreground mt-0.5 text-sm break-words">
                        {e.body}
                      </p>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={e.id}>
                  {e.href ? (
                    <Link href={e.href} className="block">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
