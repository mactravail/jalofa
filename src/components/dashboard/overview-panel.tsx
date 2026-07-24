"use client";

import Link from "next/link";
import { ArrowRight, Package, Scissors, Users, Wallet } from "lucide-react";

import { NewOrdersFeed } from "@/components/dashboard/new-orders-feed";
import { OverviewHero } from "@/components/dashboard/overview-hero";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { formatPrice } from "@/lib/constants";
import { groupClients } from "@/lib/clients";
import { DASHBOARD_ROOT, type ProRole } from "@/lib/dashboard-nav";
import { TONE, type Tone } from "@/lib/dashboard-tone";
import { revenueOf } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

const FEED_MAX = 4;

/**
 * Le corps de la vue d'ensemble : on dit bonjour, on montre les quatre chiffres
 * qui comptent, puis les nouvelles commandes, puis les gros raccourcis. Tout lit
 * le même pipeline partagé, donc les compteurs suivent les commandes qu'on vient
 * d'accepter.
 */
export function OverviewPanel({
  role,
  firstName,
}: {
  role: ProRole;
  firstName: string | null;
}) {
  const { orders } = usePipeline();
  const todo = useBucket("todo");
  const ongoing = useBucket("ongoing");
  const root = DASHBOARD_ROOT[role];

  const clients = groupClients(role, orders).length;
  const revenue = revenueOf(
    role,
    orders.filter((o) => o.payment_status === "paid"),
  );

  return (
    <div className="space-y-8">
      <OverviewHero firstName={firstName} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Package}
          label="Nouvelles"
          value={String(todo.length)}
          href={`${root}/a-traiter`}
          tone="amber"
          highlight={todo.length > 0}
        />
        <Stat
          icon={Scissors}
          label="En cours"
          value={String(ongoing.length)}
          href={`${root}/en-cours`}
          tone="blue"
        />
        <Stat
          icon={Users}
          label="Clients"
          value={String(clients)}
          href={`${root}/clients`}
          tone="violet"
        />
        <Stat
          icon={Wallet}
          label="Gagné"
          value={formatPrice(revenue)}
          href={`${root}/revenus`}
          tone="emerald"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Vos nouvelles commandes</h2>
          {todo.length > FEED_MAX && (
            <Link
              href={`${root}/a-traiter`}
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Voir les {todo.length} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        <NewOrdersFeed max={FEED_MAX} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Que voulez-vous faire ?</h2>
        <QuickActions role={role} />
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  tone,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  tone: Tone;
  /** Met la tuile en avant (fond teinté, puce pleine) quand ça presse. */
  highlight?: boolean;
}) {
  const t = TONE[tone];
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 transition-transform active:scale-[0.98]",
        highlight ? cn(t.tint, t.border) : "bg-card hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl",
          highlight ? t.solid : t.soft,
        )}
      >
        <Icon className="size-6" />
      </span>
      <span className="mt-1">
        <span className="block truncate text-xl font-bold tracking-tight sm:text-2xl">
          {value}
        </span>
        <span
          className={cn(
            "block text-sm font-medium",
            highlight ? "" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}
