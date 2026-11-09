"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, PackageCheck, Scissors, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  confirmFabricReturnReceived,
  markAlterationDone,
  type AfterSaleResult,
} from "@/lib/actions/after-sale";
import { ALTERATION_REASON_LABELS } from "@/lib/after-sale";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";

function useProAction(done: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<AfterSaleResult>) =>
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(done);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  return { run, isPending };
}

/** Ce que l'après-vente attend de ce pro sur la commande : retour ou retouche. */
export function AfterSaleProActions({
  order,
  role,
}: {
  order: OrderListItem;
  role: ProRole;
}) {
  const { run, isPending } = useProAction("C'est noté.");

  if (role === "vendor" && order.fabric_return?.status === "requested") {
    return (
      <div className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Undo2 className="size-4 shrink-0" /> Le client vous renvoie ce tissu
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Touchez le bouton seulement quand vous l&apos;avez reçu : JALOFA remboursera alors le client.
        </p>
        <Button
          className="mt-3 h-11 w-full sm:w-auto"
          disabled={isPending}
          onClick={() => run(() => confirmFabricReturnReceived(order.id))}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
          J&apos;ai reçu le tissu retourné
        </Button>
      </div>
    );
  }

  const open =
    role === "tailor" ? (order.alterations ?? []).filter((a) => a.status === "requested") : [];
  if (open.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      {open.map((alteration) => (
        <div
          key={alteration.id}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Scissors className="size-4 shrink-0" /> Retouche demandée :{" "}
            {ALTERATION_REASON_LABELS[alteration.reason]}
          </p>
          {alteration.note && (
            <p className="text-muted-foreground mt-1 break-words text-sm">{alteration.note}</p>
          )}
          <Button
            className="mt-3 h-11 w-full sm:w-auto"
            disabled={isPending}
            onClick={() => run(() => markAlterationDone(order.id, alteration.id))}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Retouche faite
          </Button>
        </div>
      ))}
    </div>
  );
}
