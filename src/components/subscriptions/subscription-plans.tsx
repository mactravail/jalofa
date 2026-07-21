"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";
import {
  BILLING_PERIOD_LABELS,
  SUBSCRIPTION_PLANS,
  YEARLY_DISCOUNT,
  displayedMonthly,
  periodTotal,
  type BillingPeriod,
  type SubscriptionPlan,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

const PERIODS: BillingPeriod[] = ["monthly", "yearly"];

export function SubscriptionPlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div className="mt-10">
      <PeriodToggle period={period} onChange={setPeriod} />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        Sans engagement — changez de plan ou résiliez à tout moment. Les clients
        commandent gratuitement, l&apos;abonnement ne concerne que les pros.
      </p>
    </div>
  );
}

function PeriodToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Périodicité de facturation"
      className="bg-muted mx-auto flex w-fit items-center gap-1 rounded-full p-1"
    >
      {PERIODS.map((value) => {
        const active = period === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {BILLING_PERIOD_LABELS[value]}
            {value === "yearly" && (
              <Badge
                variant={active ? "default" : "secondary"}
                className="h-4 px-1.5 text-[10px]"
              >
                -{Math.round(YEARLY_DISCOUNT * 100)}%
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({
  plan,
  period,
}: {
  plan: SubscriptionPlan;
  period: BillingPeriod;
}) {
  const isFree = plan.monthlyPrice === 0;
  const monthly = displayedMonthly(plan, period);
  const total = periodTotal(plan, period);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        plan.featured
          ? "border-primary ring-primary/30 shadow-md ring-1"
          : "border-border",
      )}
    >
      {plan.badge && (
        <Badge
          variant={plan.featured ? "default" : "secondary"}
          className="absolute -top-2.5 right-6"
        >
          {plan.badge}
        </Badge>
      )}

      <div>
        <h2 className="text-xl font-semibold">{plan.name}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{plan.tagline}</p>
      </div>

      <div className="mt-5">
        {isFree ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight">Gratuit</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              0 FCFA / mois — aucun abonnement
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight">
                {formatPrice(monthly)}
              </span>
              <span className="text-muted-foreground text-sm">/ mois</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {period === "yearly"
                ? `Soit ${formatPrice(total)} facturés une fois par an`
                : "Facturé chaque mois"}
            </p>
          </>
        )}
      </div>

      <p
        className={cn(
          "mt-4 rounded-lg px-3 py-2 text-xs font-medium",
          plan.commission > 0
            ? "bg-muted text-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        {plan.commission > 0
          ? `${Math.round(plan.commission * 100)}% de commission par métier (10% pour les deux)`
          : "0% de commission — vous gardez 100% de vos ventes"}
      </p>

      <Link
        href={
          isFree
            ? `/inscription?plan=${plan.id}`
            : `/inscription?plan=${plan.id}&period=${period}`
        }
        className={cn(
          buttonVariants({
            variant: plan.featured ? "default" : "outline",
            size: "lg",
          }),
          "mt-6 h-11 w-full text-base",
        )}
      >
        {isFree ? "Commencer gratuitement" : `Choisir ${plan.name}`}
      </Link>

      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
