"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/lib/i18n/navigation";
import { adminDecideCancellation } from "@/lib/actions/order-workflow";
import { formatPrice } from "@/lib/constants";
import {
  REVIEW_FLAG_LABELS,
  proposeSettlement,
  type LedgerKind,
  type LedgerParty,
  type WorkflowOrder,
} from "@/lib/order-workflow";

const KIND_LABELS: Record<LedgerKind, string> = {
  fabric: "Tissu (à son propriétaire)",
  tailoring: "Couture",
  delivery_out: "Aller du tissu (trajet effectué)",
  delivery_garment: "Livraison du vêtement",
  delivery_return: "Retour du tissu (à la charge du client)",
  compensation: "Indemnité découpe : 35 % de la couture",
  commission: "Commission JALOFA",
};

const PARTY_LABELS: Record<LedgerParty, string> = {
  client: "Client",
  vendor: "JALOFA",
  tailor: "Tailleur",
  carrier: "Transporteur",
  jalofa: "JALOFA",
};

/**
 * L'examen d'une demande d'annulation. La proposition se recalcule pendant que
 * JALOFA saisit le coût réel du retour ; le serveur la recalcule à l'identique
 * à la validation (rien de ce qui est affiché ici n'est envoyé comme montant).
 */
export function CancellationDecision({
  requestId,
  order,
  travelled,
}: {
  requestId: string;
  order: WorkflowOrder;
  /** Le tissu a voyagé : le coût du retour doit être saisi. */
  travelled: boolean;
}) {
  const router = useRouter();
  const [returnFee, setReturnFee] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const fee = returnFee.trim() === "" ? null : Math.max(0, Math.round(Number(returnFee) || 0));
  const proposal = useMemo(
    () => proposeSettlement(order, { returnFee: travelled ? fee : 0 }),
    [order, fee, travelled],
  );

  const decide = (accept: boolean) =>
    startTransition(async () => {
      const res = await adminDecideCancellation({
        requestId,
        accept,
        reason,
        returnFee: travelled ? fee : 0,
      });
      if (res.ok) {
        toast.success(accept ? "Annulation acceptée." : "Annulation refusée : la commande reprend.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="space-y-3">
      <dl className="bg-muted/40 space-y-1.5 rounded-lg p-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Payé par le client</dt>
          <dd className="font-medium whitespace-nowrap">{formatPrice(proposal.paid)}</dd>
        </div>
        {proposal.lines.map((l, i) => (
          <div key={i} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              − {KIND_LABELS[l.kind]} → {PARTY_LABELS[l.party]}
            </dt>
            <dd className="whitespace-nowrap">{formatPrice(l.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t pt-1.5 font-bold">
          <dt>Remboursement proposé</dt>
          <dd className="text-primary whitespace-nowrap">{formatPrice(proposal.refund)}</dd>
        </div>
      </dl>

      {proposal.flags.length > 0 && (
        <ul className="space-y-1 text-sm text-amber-500">
          {proposal.flags.map((f) => (
            <li key={f}>⚠ {REVIEW_FLAG_LABELS[f]}</li>
          ))}
        </ul>
      )}

      {travelled && (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Coût réel du retour du tissu (FCFA)</span>
          <Input
            inputMode="numeric"
            value={returnFee}
            onChange={(e) => setReturnFee(e.target.value)}
            placeholder="Tarif ou preuve du transporteur — 0 si le client le récupère"
          />
        </label>
      )}

      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motif de la décision (obligatoire, visible du client)"
        rows={2}
        maxLength={1000}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isPending || !reason.trim()}
          onClick={() => decide(true)}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Accepter l&apos;annulation
        </Button>
        <Button
          variant="destructive"
          className="h-11 rounded-xl"
          disabled={isPending || !reason.trim()}
          onClick={() => decide(false)}
        >
          <X className="size-4" /> Refuser (la commande reprend)
        </Button>
      </div>
    </div>
  );
}
