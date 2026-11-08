"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, PackageCheck, Tag, Truck, X } from "lucide-react";
import { toast } from "sonner";

import { usePipeline } from "@/components/dashboard/pipeline-store";
import { QuoteOrderDialog } from "@/components/dashboard/quote-order-dialog";
import { RejectOrderDialog } from "@/components/dashboard/reject-order-dialog";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_LABELS,
  formatPrice,
  type OrderStatus,
  type OrderType,
  type PaymentStatus,
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
import { cn } from "@/lib/utils";

/** Faits pour le pouce : on ne doit pas pouvoir les rater. */
const BIG = "h-12 flex-1 rounded-xl px-5 text-base font-semibold sm:flex-none";
/** Oui = vert, non = rouge : on comprend sans lire. */
const YES = "bg-emerald-600 text-white hover:bg-emerald-700";

/**
 * Inline pipeline control for a pro (tailor or vendor). Shows the actions the
 * current role is responsible for, and a read-only "waiting" hint when the ball
 * is in the other party's court.
 */
export function OrderStatusControl({
  orderId,
  status,
  type,
  isQuote = false,
  tailoringPrice = 0,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  type: OrderType;
  /** Née d'une demande de devis (tailleur « Prix sur demande »). */
  isQuote?: boolean;
  /** Prix de confection déjà fixé — 0 tant qu'un devis n'est pas chiffré. */
  tailoringPrice?: number;
  paymentStatus?: PaymentStatus;
}) {
  const { role, move, reject, quote } = usePipeline();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

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
            : `${ORDER_STATUS_LABELS[next]} — voir « ${BUCKET_LABELS[role][to]} »`,
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

  const confirmQuote = (price: number) => {
    startTransition(async () => {
      try {
        await quote(orderId, price);
        setQuoteOpen(false);
        toast.success(
          `Prix envoyé : ${formatPrice(price)}. Le client doit répondre.`,
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi");
      }
    });
  };

  // --- Devis en privé : chiffrer avant que le client paie -------------------
  // Une demande de devis arrive « reçue » et impayée : le tailleur ne l'accepte
  // pas à l'aveugle, il la CHIFFRE. Une fois le prix envoyé, la balle est dans
  // le camp du client (accepter & payer) — la commande reste ici en attendant.
  if (
    role === "tailor" &&
    isQuote &&
    status === "received" &&
    paymentStatus === "pending"
  ) {
    if (tailoringPrice > 0) {
      return (
        <span className="text-muted-foreground text-sm">
          Prix envoyé. Le client doit répondre.
        </span>
      );
    }
    return (
      <>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button className={BIG} onClick={() => setQuoteOpen(true)} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Tag className="size-4" />
            )}
            Donner mon prix
          </Button>
          <Button
            className={BIG}
            variant="destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <X className="size-4" /> Refuser
          </Button>
        </div>
        <QuoteOrderDialog
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          onConfirm={confirmQuote}
          isPending={isPending}
        />
        <RejectOrderDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          onConfirm={confirmReject}
          isPending={isPending}
        />
      </>
    );
  }

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
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            className={cn(BIG, YES)}
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
            className={BIG}
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
        <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
          {waiting && (
            <span className="text-muted-foreground text-sm">
              En attente du fournisseur
            </span>
          )}
          <Button
            className={BIG}
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
        <Button className={cn(BIG, YES)} onClick={() => run("delivered")} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Truck className="size-4" />
          )}
          Livré
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
      className={BIG}
      variant="outline"
      onClick={() => run(next)}
      disabled={isPending}
    >
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {ORDER_STATUS_LABELS[next]}
    </Button>
  );
}
