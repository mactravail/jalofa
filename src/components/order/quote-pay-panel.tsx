"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CalendarClock,
  Loader2,
  Lock,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { acceptQuote } from "@/lib/actions/orders";
import { CANCEL_WINDOW_HOURS } from "@/lib/after-sale";
import { Button } from "@/components/ui/button";
import { PaymentMethodLogo } from "@/components/payment-logos";
import {
  PAYMENT_METHOD_LABELS,
  formatPrice,
  type PaymentMethod,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/**
 * Réponse à un devis, côté client. Tant que le tailleur n'a pas chiffré, on
 * patiente ; une fois le prix reçu, le client voit où va son argent (tissu,
 * livraison, tailleur), puis accepte et paie le total en une fois — ce qui fait
 * de la demande une commande ferme, et donne ses coordonnées au tailleur.
 */
export function QuotePayPanel({
  orderId,
  revision,
  tailoringPrice,
  fabricPrice,
  deliveryFee,
  totalAmount,
  deliveryPlace,
  hasAddress,
  readyDays = null,
  note = null,
}: {
  orderId: string;
  /** Combien de fois le client a déjà modifié sa demande. */
  revision: number;
  /** Prix du tailleur — 0 tant que le devis n'est pas chiffré. */
  tailoringPrice: number;
  fabricPrice: number;
  deliveryFee: number;
  /** Ce que le client paie : tissu, livraison et tailleur. */
  totalAmount: number;
  /** L'adresse pour laquelle le tailleur a chiffré la livraison. */
  deliveryPlace: string;
  /** Une ancienne demande peut ne pas en avoir : il faut d'abord la modifier. */
  hasAddress: boolean;
  /** Le délai annoncé par le tailleur : « prête en N jours ». */
  readyDays?: number | null;
  /** Le mot bref du tailleur. */
  note?: string | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // En attente du chiffrage : le tailleur n'a pas encore répondu.
  if (tailoringPrice <= 0) {
    return (
      <div className="border-primary/30 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
        <MessageSquareQuote className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">
            {revision > 0 ? "Nouveau devis demandé" : "Devis demandé"}
          </p>
          <p className="text-muted-foreground mt-0.5">
            Le tailleur a bien reçu votre demande. Vous recevrez son prix ici, avec
            le détail. C&apos;est gratuit et sans engagement.
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
    if (!accepted) {
      toast.error("Acceptez les conditions pour payer");
      return;
    }
    startTransition(async () => {
      const res = await acceptQuote(orderId, method);
      if (res.ok) {
        toast.success("Devis accepté et payé. Le tailleur est prévenu.");
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
        <p className="font-semibold">
          Votre devis est prêt{revision > 0 ? ` (n° ${revision + 1})` : ""}
        </p>
      </div>

      {/* Où va l'argent, ligne par ligne. */}
      <dl className="bg-background mt-3 space-y-2 rounded-lg border p-3 text-sm">
        {fabricPrice > 0 && <Line label="Tissu" amount={formatPrice(fabricPrice)} />}
        <Line
          label="Livraison"
          amount={deliveryFee > 0 ? formatPrice(deliveryFee) : "Gratuite"}
        />
        <Line label="Tailleur" amount={formatPrice(tailoringPrice)} />
        <div className="flex items-center justify-between gap-3 border-t pt-2 text-base font-bold">
          <dt>Total</dt>
          <dd className="text-primary whitespace-nowrap">{formatPrice(totalAmount)}</dd>
        </div>
      </dl>

      {readyDays ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm">
          <CalendarClock className="text-muted-foreground size-4 shrink-0" />
          <span>
            Prête en <strong>{readyDays} jour{readyDays > 1 ? "s" : ""}</strong> après
            le paiement
          </span>
        </p>
      ) : null}

      {note && (
        <blockquote className="bg-background mt-3 rounded-lg border p-3 text-sm">
          <p className="text-muted-foreground text-xs font-medium">Le mot du tailleur</p>
          <p className="mt-1 break-words whitespace-pre-line">{note}</p>
        </blockquote>
      )}

      {hasAddress ? (
        <p className="mt-3 flex items-start gap-1.5 text-sm">
          <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">Livraison à : {deliveryPlace}</span>
        </p>
      ) : (
        <p className="text-destructive mt-3 text-sm">
          Ajoutez votre adresse avec « Modifier ma demande » avant de payer.
        </p>
      )}

      <p className="mt-4 text-sm font-medium">Moyen de paiement</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            aria-pressed={method === m}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors",
              method === m
                ? "border-primary ring-primary/30 ring-2"
                : "hover:bg-muted",
            )}
          >
            <PaymentMethodLogo method={m} />
            <span className="text-muted-foreground text-[11px] leading-tight">
              {PAYMENT_METHOD_LABELS[m]}
            </span>
          </button>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="accent-primary mt-0.5 size-4 shrink-0"
        />
        <span>
          J&apos;accepte les{" "}
          <Link href="/conditions" target="_blank" className="underline underline-offset-2">
            conditions d&apos;utilisation
          </Link>
        </span>
      </label>

      <Button
        className="mt-3 h-auto min-h-10 w-full flex-wrap gap-x-1.5 gap-y-0 bg-emerald-600 px-3 py-2 text-center text-[13px] leading-tight font-semibold whitespace-normal text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:bg-emerald-600/40 sm:text-sm"
        onClick={pay}
        disabled={isPending || !hasAddress || !accepted}
      >
        {isPending ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <Lock className="size-4 shrink-0" />
        )}
        <span>Accepter et payer</span>
        <span className="whitespace-nowrap">{formatPrice(totalAmount)}</span>
      </Button>
      <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-emerald-500">
        <ShieldCheck className="size-3.5" />
        Paiement sécurisé · argent protégé par JALOFA
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Une fois payé, le tailleur reçoit votre nom, votre téléphone et votre e-mail pour
        vous livrer.
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Payez uniquement ici. En dehors du site, JALOFA ne peut ni vous protéger ni vous
        rembourser.
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Annulation possible pendant {CANCEL_WINDOW_HOURS} h. Une tenue cousue ne se rend
        pas, mais votre tailleur peut la retoucher.
      </p>
    </div>
  );
}

function Line({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium whitespace-nowrap">{amount}</dd>
    </div>
  );
}
