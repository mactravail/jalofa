"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, PackageCheck, Truck, X } from "lucide-react";
import { toast } from "sonner";

import { usePipeline } from "@/components/dashboard/pipeline-store";
import { RejectOrderDialog } from "@/components/dashboard/reject-order-dialog";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type OrderType,
  type RejectionReason,
} from "@/lib/constants";
import { BUCKET_LABELS } from "@/lib/dashboard-nav";
import {
  bucketOf,
  isTerminal,
  needsAction,
  nextStatus,
  ownerOf,
  tailorAwaitingFabric,
  tailorInWorkshop,
} from "@/lib/pipeline";

/**
 * Inline pipeline control for a pro (tailor or vendor). Shows the actions the
 * current role is responsible for, and a read-only "waiting" hint when the ball
 * is in the other party's court.
 */
export function OrderStatusControl({
  orderId,
  status,
  type,
}: {
  orderId: string;
  status: OrderStatus;
  type: OrderType;
}) {
  const { role, move, reject } = usePipeline();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  const run = (next: OrderStatus) => {
    startTransition(async () => {
      try {
        await move(orderId, next);
        // Advancing usually moves the order to another page of the menu — say
        // which one, since it is about to vanish from the list being read.
        const to = bucketOf(role, next, type);
        toast.success(
          to === bucketOf(role, status, type)
            ? `Statut mis à jour : ${ORDER_STATUS_LABELS[next]}`
            : `${ORDER_STATUS_LABELS[next]} — commande déplacée vers « ${BUCKET_LABELS[role][to]} »`,
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de mise à jour");
      }
    });
  };

  const confirmReject = (reason: RejectionReason) => {
    startTransition(async () => {
      try {
        await reject(orderId, reason);
        setRejectOpen(false);
        toast.success("Commande refusée — le client va être prévenu.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur lors du refus");
      }
    });
  };

  if (isTerminal(status)) {
    return (
      <span className="text-muted-foreground text-sm font-medium">
        {ORDER_STATUS_LABELS[status]}
      </span>
    );
  }

  // A fresh order — accept or decline (whoever it belongs to).
  if (status === "received" && needsAction(role, status, type)) {
    const accepted = nextStatus(status, type);
    return (
      <>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => accepted && run(accepted)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Accepter
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <X className="size-4" /> Refuser
          </Button>
        </div>
        <RejectOrderDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          onConfirm={confirmReject}
          isPending={isPending}
        />
      </>
    );
  }

  // --- Tailleur : jamais bloqué -------------------------------------------
  // Deux gestes concrets plutôt que d'attendre le fournisseur puis dérouler
  // chaque étape : « J'ai reçu le tissu », puis « Marquer prêt & livré ».
  if (role === "tailor") {
    // Le tissu est chez le fournisseur ou en route : confirmer la réception.
    if (tailorAwaitingFabric(status, type)) {
      const waiting = ownerOf(status, type) === "vendor";
      return (
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          {waiting && (
            <span className="text-muted-foreground text-sm">
              En attente du fournisseur
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => run("fabric_received_by_tailor")}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackageCheck className="size-4" />
            )}
            J&apos;ai reçu le tissu
          </Button>
        </div>
      );
    }

    // Le tissu est en main : un seul geste pour clôturer, prêt et livré.
    if (tailorInWorkshop(status, type)) {
      return (
        <Button size="sm" onClick={() => run("delivered")} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Truck className="size-4" />
          )}
          Marquer prêt &amp; livré
        </Button>
      );
    }
  }

  // --- Vendeur (et repli) : étape par étape -------------------------------
  // Not this role's turn — the other pro is working on it.
  if (!needsAction(role, status, type)) {
    const owner = ownerOf(status, type);
    const waiting =
      owner === "vendor" ? "En attente du fournisseur" : "En attente du tailleur";
    return <span className="text-muted-foreground text-sm">{waiting}</span>;
  }

  const next = nextStatus(status, type);
  if (!next) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => run(next)}
      disabled={isPending}
    >
      {isPending && <Loader2 className="size-4 animate-spin" />}
      Passer à : {ORDER_STATUS_LABELS[next]}
    </Button>
  );
}
