"use client";

import Link from "@/components/i18n/link";
import {
  ChevronRight,
  ClipboardList,
  CreditCard,
  Plus,
  Scissors,
  Wallet,
} from "lucide-react";

import { Price } from "@/components/cart/price";
import { NewOrdersFeed } from "@/components/dashboard/new-orders-feed";
import { useBucket, usePipeline } from "@/components/dashboard/pipeline-store";
import { buttonVariants } from "@/components/ui/button";
import { DASHBOARD_ROOT, type ProRole } from "@/lib/dashboard-nav";
import { moneyReleased, revenueOf } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n/t";

const FEED_MAX = 4;

/**
 * Le corps de l'accueil, dans l'ordre où un pro se pose les questions :
 * combien ? (trois chiffres), quoi faire ? (les nouvelles commandes), et comment
 * vendre plus ? (un seul gros bouton). Tout lit le même pipeline partagé, donc les
 * chiffres suivent les commandes qu'on vient d'accepter.
 */
export function OverviewPanel({
  role,
  needsPayout,
}: {
  role: ProRole;
  needsPayout: boolean;
}) {
  const { orders } = usePipeline();
  const todo = useBucket("todo");
  const ongoing = useBucket("ongoing");
  const root = DASHBOARD_ROOT[role];

  const revenue = revenueOf(
    role,
    orders.filter((o) => moneyReleased(role, o)),
  );

  return (
    <div className="space-y-8">
      <h1 className="sr-only"><T>Accueil</T></h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile
          href={`${root}/a-traiter`}
          icon={ClipboardList}
          label="Nouvelles"
          iconClass="text-amber-500"
          urgent={todo.length > 0}
        >
          {todo.length}
        </Tile>
        <Tile
          href={`${root}/en-cours`}
          icon={Scissors}
          label="En cours"
          iconClass="text-blue-400"
        >
          {ongoing.length}
        </Tile>
        <Tile
          href={`${root}/revenus`}
          icon={Wallet}
          label="Mon argent"
          iconClass="text-emerald-400"
          className="col-span-2 sm:col-span-1"
        >
          <Price amount={revenue} />
        </Tile>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold"><T>Nouvelles commandes</T></h2>
          {todo.length > FEED_MAX && (
            <Link
              href={`${root}/a-traiter`}
              className="flex shrink-0 items-center gap-1 text-base font-medium hover:underline"
            >
              <T vars={{ n: todo.length }}>{"Voir les {n}"}</T> <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
        <NewOrdersFeed max={FEED_MAX} />
      </section>

      <div className="space-y-3">
        <Link
          href={
            role === "tailor"
              ? `${root}/creations?nouveau=1`
              : `${root}/tissus?nouveau=1`
          }
          className={cn(
            buttonVariants(),
            "h-14 w-full gap-2 rounded-xl text-base font-semibold",
          )}
        >
          <Plus className="size-5" />
          <T>{role === "tailor" ? "Ajouter un modèle" : "Ajouter un tissu"}</T>
        </Link>

        {needsPayout && (
          <Link
            href={`${root}/paiement`}
            className="bg-card hover:bg-muted/50 flex min-h-14 items-center gap-3 rounded-xl border border-amber-500/40 px-4 py-3 text-base font-medium transition-colors"
          >
            <CreditCard className="size-5 shrink-0 text-amber-500" />
            <span className="min-w-0 flex-1">
              <T>Où voulez-vous recevoir votre argent ?</T>
            </span>
            <ChevronRight className="text-muted-foreground size-5 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}

function Tile({
  href,
  icon: Icon,
  label,
  iconClass,
  urgent = false,
  className,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  iconClass: string;
  /** Du travail attend : la tuile passe en plein, on ne peut pas la rater. */
  urgent?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border p-4 transition-colors sm:p-5",
        urgent
          ? "border-transparent bg-amber-500 text-amber-950 hover:bg-amber-400"
          : "bg-card hover:bg-muted/50",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap sm:gap-2 sm:text-base">
        <Icon className={cn("size-5 shrink-0", !urgent && iconClass)} />
        <span className="truncate"><T>{label}</T></span>
      </span>
      <span className="block truncate text-3xl font-bold tracking-tight sm:text-4xl">
        {children}
      </span>
    </Link>
  );
}
