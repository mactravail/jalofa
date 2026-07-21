"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Package, Wallet } from "lucide-react";

import { OrderList } from "@/components/dashboard/order-list";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/constants";
import { BUCKET_LABELS, DASHBOARD_ROOT, type ProRole } from "@/lib/dashboard-nav";
import { revenueOf } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

const COPY: Record<ProRole, { revenue: string; empty: string }> = {
  tailor: {
    revenue: "Revenu confection",
    empty: "Rien ne vous attend : tout est à jour.",
  },
  vendor: {
    revenue: "Revenu tissus",
    empty: "Rien ne vous attend : tout est à jour.",
  },
};

/**
 * Le corps de la vue d'ensemble : les chiffres, puis ce qui presse. Il lit le
 * même pipeline que les pages du menu, pour que les compteurs suivent les
 * commandes qu'on vient de déplacer.
 */
export function OverviewPanel() {
  const { role, orders } = usePipeline();
  const todo = useBucket("todo");
  const copy = COPY[role];
  const root = DASHBOARD_ROOT[role];

  const delivered = orders.filter((o) => o.status === "delivered");
  const revenue = revenueOf(
    role,
    orders.filter((o) => o.payment_status === "paid"),
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          icon={Package}
          label="Commandes"
          value={String(orders.length)}
          href={`${root}/en-cours`}
          tone="orange"
        />
        <Stat
          icon={ClipboardList}
          label={BUCKET_LABELS[role].todo}
          value={String(todo.length)}
          href={`${root}/a-traiter`}
          tone="yellow"
          accent={todo.length > 0}
        />
        <Stat
          icon={CheckCircle2}
          label="Livrées"
          value={String(delivered.length)}
          href={`${root}/terminees`}
          tone="green"
        />
        <Stat
          icon={Wallet}
          label={copy.revenue}
          value={formatPrice(revenue)}
          href={`${root}/revenus`}
          tone="blue"
        />
      </div>

      <div className="mt-10 mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">À traiter en priorité</h2>
        {todo.length > 3 && (
          <Link
            href={`${root}/a-traiter`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            Voir les {todo.length} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <OrderList bucket="todo" max={3} empty={copy.empty} />
    </>
  );
}

type Tone = "orange" | "yellow" | "green" | "blue";

/** Teintes fonctionnelles des icônes de stats (soft = fond léger, solid = badge plein). */
const TONE: Record<Tone, { soft: string; solid: string }> = {
  orange: {
    soft: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    solid: "bg-orange-500 text-white",
  },
  yellow: {
    soft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    solid: "bg-yellow-500 text-yellow-950",
  },
  green: {
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    solid: "bg-emerald-500 text-white",
  },
  blue: {
    soft: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    solid: "bg-blue-500 text-white",
  },
};

function Stat({
  icon: Icon,
  label,
  value,
  href,
  tone,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  tone: Tone;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="rounded-xl transition-opacity hover:opacity-80">
      <Card className="h-full">
        <CardContent className="flex flex-col items-start gap-2 p-4 sm:flex-row sm:items-center sm:gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              accent ? TONE[tone].solid : TONE[tone].soft,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="w-full min-w-0">
            <p className="text-muted-foreground truncate text-xs">{label}</p>
            <p className="truncate font-semibold">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
