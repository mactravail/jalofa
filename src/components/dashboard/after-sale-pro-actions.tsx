"use client";

import { useRouter } from "@/lib/i18n/navigation";
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
import { T } from "@/components/i18n/t";
import { translateNow } from "@/lib/i18n/translate";

function useProAction(done: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<AfterSaleResult>) =>
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(translateNow(done));
        router.refresh();
      } else {
        toast.error(translateNow(res.error));
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
          <Undo2 className="size-4 shrink-0" /> <T>Le client vous renvoie ce tissu</T>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          <T>{"Touchez le bouton seulement quand vous l'avez reçu : JALOFA remboursera alors le client."}</T>
        </p>
        <Button
          className="mt-3 h-11 w-full sm:w-auto"
          disabled={isPending}
          onClick={() => run(() => confirmFabricReturnReceived(order.id))}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
          <T>{"J'ai reçu le tissu retourné"}</T>
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
            <Scissors className="size-4 shrink-0" /> <T>Retouche demandée :</T>{" "}
            <T>{ALTERATION_REASON_LABELS[alteration.reason]}</T>
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
            <T>Retouche faite</T>
          </Button>
        </div>
      ))}
    </div>
  );
}
