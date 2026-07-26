"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

import { acceptQuote } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import {
  PAYMENT_METHOD_LABELS,
  formatPrice,
  type PaymentMethod,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/**
 * Réponse à un devis, côté client. Tant que le tailleur n'a pas chiffré, on
 * patiente ; une fois le prix reçu, le client l'accepte et paie — ce qui fait
 * de la demande une commande ferme qui entre dans le suivi normal.
 */
export function QuotePayPanel({
  orderId,
  tailoringPrice,
}: {
  orderId: string;
  /** Prix de confection proposé — 0 tant que le devis n'est pas chiffré. */
  tailoringPrice: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [isPending, startTransition] = useTransition();

  // En attente du chiffrage : le tailleur n'a pas encore répondu.
  if (tailoringPrice <= 0) {
    return (
      <div className="border-primary/30 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
        <MessageSquareQuote className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Devis en cours de chiffrage</p>
          <p className="text-muted-foreground mt-0.5">
            Le tailleur a bien reçu votre demande. Vous recevrez son prix ici —
            vous déciderez ensuite de l&apos;accepter et de payer.
          </p>
        </div>
      </div>
    );
  }

  const pay = () => {
    if (!method) {
      toast.error("Choisissez un moyen de paiement");
      return;
    }
    startTransition(async () => {
      const res = await acceptQuote(orderId, method);
      if (res.ok) {
        toast.success("Devis accepté — votre commande est confirmée.");
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  };

  return (
    <div className="border-primary/30 bg-primary/5 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <MessageSquareQuote className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">Votre devis est prêt</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Le tailleur propose{" "}
            <span className="text-foreground font-semibold">
              {formatPrice(tailoringPrice)}
            </span>{" "}
            de confection. Acceptez pour lancer votre commande.
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium">Moyen de paiement</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            aria-pressed={method === m}
            className={cn(
              "rounded-lg border p-2.5 text-sm font-medium transition-colors",
              method === m
                ? "border-primary ring-primary/30 ring-2"
                : "hover:bg-muted",
            )}
          >
            {PAYMENT_METHOD_LABELS[m]}
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="mt-4 h-11 w-full text-base"
        onClick={pay}
        disabled={isPending}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Accepter et payer {formatPrice(tailoringPrice)}
      </Button>
    </div>
  );
}
