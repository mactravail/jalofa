"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Hourglass,
  Loader2,
  PackageCheck,
  Scissors,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CourierDialog, type CourierInfo } from "@/components/dashboard/courier-dialog";
import { usePipeline } from "@/components/dashboard/pipeline-store";
import { handOverToCourier } from "@/lib/actions/orders";
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
import type { FreeDeliveryZone } from "@/lib/delivery";
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
import { T } from "@/components/i18n/t";
import { translateNow } from "@/lib/i18n/translate";

/** Faits pour le pouce : on ne doit pas pouvoir les rater. */
const BIG = "h-12 flex-1 rounded-xl px-5 text-base font-semibold sm:flex-none";
/** Oui = vert, non = rouge : on comprend sans lire. */
const YES = "bg-emerald-600 text-white hover:bg-emerald-700";

/**
 * Le prochain geste du tailleur à l'atelier. Trois étapes que le client voit
 * dans sa frise et dont il reçoit la notification.
 */
function workshopStep(status: OrderStatus): {
  next: OrderStatus;
  label: string;
  icon: typeof Truck;
} {
  if (status === "sewing" || status === "in_production" || status === "quality_check") {
    return { next: "shipped", label: "Remise au livreur", icon: Truck };
  }
  // Tissu reçu (ou tissu du client) : la couture peut commencer.
  return { next: "sewing", label: "Je commence la couture", icon: Scissors };
}

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
  fabricPrice = 0,
  deliveryAddress = null,
  deliveryCity = null,
  deliveryCountry = null,
  deliveryZone = "none",
  paymentStatus,
  readyDays = null,
  courierName = null,
  courierPhone = null,
}: {
  orderId: string;
  status: OrderStatus;
  type: OrderType;
  /** Née d'une demande de devis (tailleur « Prix sur demande »). */
  isQuote?: boolean;
  /** Prix de confection déjà fixé — 0 tant qu'un devis n'est pas chiffré. */
  tailoringPrice?: number;
  /** Le prix du tissu, déjà connu : il entre dans le devis du tailleur. */
  fabricPrice?: number;
  /** Où livrer : le tailleur en tient compte pour son prix de livraison. */
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryCountry?: string | null;
  /** Le choix du tailleur pour la livraison de ce modèle. */
  deliveryZone?: FreeDeliveryZone;
  paymentStatus?: PaymentStatus;
  /** Devis envoyé : « prêt dans N jours ». */
  readyDays?: number | null;
  /** Le livreur, une fois la tenue en route. */
  courierName?: string | null;
  courierPhone?: string | null;
}) {
  const { role, demo, move, reject, quote } = usePipeline();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [courierOpen, setCourierOpen] = useState(false);

  const confirmCourier = (courier: CourierInfo) => {
    startTransition(async () => {
      try {
        if (demo) await move(orderId, "shipped");
        else await handOverToCourier(orderId, courier);
        setCourierOpen(false);
        toast.success(translateNow("Le client est prévenu : la tenue est en route."));
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur lors de l'envoi"));
      }
    });
  };

  const run = (next: OrderStatus) => {
    startTransition(async () => {
      try {
        await move(orderId, next);
        // Advancing usually moves the order to another page of the menu — say
        // which one, since it is about to vanish from the list being read.
        const to = bucketOf(role, next, type);
        toast.success(
          to === bucketOf(role, status, type)
            ? translateNow("Statut mis à jour : {status}", { status: translateNow(ORDER_STATUS_LABELS[next]) })
            : translateNow("{status} — voir « {bucket} »", { status: translateNow(ORDER_STATUS_LABELS[next]), bucket: translateNow(BUCKET_LABELS[role][to]) }),
        );
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur de mise à jour"));
      }
    });
  };

  const confirmReject = (reason: RejectionReason) => {
    startTransition(async () => {
      try {
        await reject(orderId, reason);
        setRejectOpen(false);
        toast.success(translateNow("Commande refusée — le client va être prévenu."));
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur lors du refus"));
      }
    });
  };

  const confirmQuote = (
    price: number,
    deliveryFee: number,
    readyDays: number,
    note: string | null,
  ) => {
    startTransition(async () => {
      try {
        await quote(orderId, price, deliveryFee, fabricPrice, readyDays, note);
        setQuoteOpen(false);
        toast.success(
          translateNow("Devis envoyé : {price}. Le client doit répondre.", { price: formatPrice(price + deliveryFee + fabricPrice) }),
        );
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur lors de l'envoi"));
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
        <div className="flex w-full items-center gap-3 rounded-lg bg-amber-500/10 px-3 py-2.5">
          <Hourglass className="size-5 shrink-0 text-amber-500" />
          <div className="min-w-0 text-sm leading-snug">
            <p className="font-semibold text-amber-500"><T>Devis envoyé</T></p>
            <p className="text-muted-foreground">
              {readyDays ? <><T vars={{ n: readyDays }}>{readyDays > 1 ? "Prête en {n} jours" : "Prête en {n} jour"}</T>{" · "}</> : ""}
              <T>En attente de la réponse du client.</T>
            </p>
          </div>
        </div>
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
            <T>Donner mon prix</T>
          </Button>
          <Button
            className={BIG}
            variant="destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <X className="size-4" /> <T>Refuser</T>
          </Button>
        </div>
        <QuoteOrderDialog
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          onConfirm={confirmQuote}
          isPending={isPending}
          fabricPrice={fabricPrice}
          address={deliveryAddress}
          city={deliveryCity}
          country={deliveryCountry}
          deliveryZone={deliveryZone}
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
        <T>{ORDER_STATUS_LABELS[status]}</T>
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
            <T>Accepter</T>
          </Button>
          <Button
            className={BIG}
            variant="destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <X className="size-4" /> <T>Refuser</T>
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
              <T>En attente du fournisseur</T>
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
            <T>{"J'ai reçu le tissu"}</T>
          </Button>
        </div>
      );
    }

    // Le tissu est en main : une étape à la fois, chacune prévient le client
    // (couture commencée → en route → livrée). « Déjà livrée » reste possible
    // pour qui remet la tenue en main propre.
    // En route : c'est au client de dire qu'il l'a reçue.
    if (status === "shipped") {
      return (
        <div className="flex w-full items-center gap-3 rounded-lg bg-violet-500/10 px-3 py-2.5 sm:w-auto">
          <Truck className="size-5 shrink-0 text-violet-400" />
          <div className="min-w-0 text-sm leading-snug">
            <p className="font-semibold text-violet-400"><T>En route</T></p>
            <p className="text-muted-foreground">
              {courierName ? `${courierName} · ${courierPhone ?? ""} · ` : ""}
              <T>En attente de la confirmation du client.</T>
            </p>
          </div>
        </div>
      );
    }

    if (tailorInWorkshop(status, type)) {
      const step = workshopStep(status);
      return (
        <>
          <Button
            className={cn(BIG, YES)}
            onClick={() => (step.next === "shipped" ? setCourierOpen(true) : run(step.next))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <step.icon className="size-4" />
            )}
            <T>{step.label}</T>
          </Button>
          <CourierDialog
            open={courierOpen}
            onOpenChange={setCourierOpen}
            onConfirm={confirmCourier}
            isPending={isPending}
          />
        </>
      );
    }
  }

  // --- Vendeur d'une commande complète : un seul geste -----------------------
  // Le tissu part à l'atelier ; l'adresse est affichée juste au-dessus.
  if (
    role === "vendor" &&
    type === "full" &&
    (status === "accepted" || status === "fabric_prepared")
  ) {
    return (
      <Button
        className={cn(BIG, YES)}
        onClick={() => run("fabric_shipped")}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Truck className="size-4" />
        )}
        <T>Tissu envoyé</T>
      </Button>
    );
  }

  // Tissu seul expédié : c'est le client qui confirme la réception.
  if (role === "vendor" && type === "fabric_only" && status === "fabric_shipped") {
    return (
      <span className="text-muted-foreground text-sm">
        <T>Tissu envoyé. JALOFA confirme la réception avec le client.</T>
      </span>
    );
  }

  // --- Vendeur (et repli) : étape par étape -------------------------------
  // Not this role's turn — the other pro is working on it.
  if (!needsAction(role, status, type)) {
    const owner = ownerOf(status, type);
    const waiting =
      owner === "vendor" ? "En attente du fournisseur" : "En attente du tailleur";
    return <span className="text-muted-foreground text-sm"><T>{waiting}</T></span>;
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
      <T>{ORDER_STATUS_LABELS[next]}</T>
    </Button>
  );
}
