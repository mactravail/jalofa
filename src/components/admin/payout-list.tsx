import { MapPin } from "lucide-react";

import { PlanBadge } from "@/components/admin/status-badges";
import { formatPrice } from "@/lib/constants";
import type { Payout } from "@/lib/payouts";
import { planCommission } from "@/lib/subscriptions";

/**
 * La liste des reversements d'un métier : par prestataire, ce que JALOFA a
 * encaissé pour lui (brut), la commission qu'elle garde (sur le plan Gratuit)
 * et le net qu'elle doit lui reverser. La part en attente d'encaissement est
 * rappelée à part — elle ne sera due qu'une fois la commande réglée.
 */
export function PayoutList({
  rows,
  grossLabel,
  emptyLabel,
}: {
  rows: Payout[];
  /** « Part tissu (brut) » ou « Part confection (brut) » selon le métier. */
  grossLabel: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <PayoutCard key={row.id} row={row} grossLabel={grossLabel} />
      ))}
    </div>
  );
}

function PayoutCard({ row, grossLabel }: { row: Payout; grossLabel: string }) {
  const rate = planCommission(row.plan);
  const takesCommission = rate > 0;

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{row.name}</p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
            {row.city && (
              <>
                <MapPin className="size-3" /> {row.city} ·{" "}
              </>
            )}
            {row.paidOrders} commande{row.paidOrders > 1 ? "s" : ""} payée
            {row.paidOrders > 1 ? "s" : ""}
          </p>
        </div>
        <PlanBadge plan={row.plan} />
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <Line label={grossLabel} value={formatPrice(row.gross)} />
        {takesCommission ? (
          <Line
            label={`Commission JALOFA (${Math.round(rate * 100)}%)`}
            value={`− ${formatPrice(row.commission)}`}
            muted
          />
        ) : (
          <p className="text-muted-foreground text-xs">
            Plan {row.plan === "premium" ? "Premium" : "Standard"} · 0% de
            commission, reversement intégral
          </p>
        )}
      </dl>

      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="text-sm font-medium">À reverser</span>
        <span className="text-primary text-lg font-bold tracking-tight">
          {formatPrice(row.net)}
        </span>
      </div>

      {row.pending > 0 && (
        <p className="text-muted-foreground mt-2 text-xs">
          En attente d’encaissement : {formatPrice(row.pending)}
        </p>
      )}
    </div>
  );
}

function Line({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className={muted ? "text-muted-foreground" : "font-medium"}>{value}</dd>
    </div>
  );
}
