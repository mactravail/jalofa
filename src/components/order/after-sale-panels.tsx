"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Scissors, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelOrder,
  requestAlteration,
  requestFabricReturn,
  type AfterSaleResult,
} from "@/lib/actions/after-sale";
import { ALTERATION_REASON_LABELS, type AlterationReason } from "@/lib/after-sale";
import { cn } from "@/lib/utils";

function useAfterSaleAction(done: string) {
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

/** Annuler dans le délai. Le bouton demande une confirmation : le geste est définitif. */
export function CancelOrderPanel({
  orderId,
  paid,
  deadlineLabel,
}: {
  orderId: string;
  paid: boolean;
  /** « 12 novembre à 14:30 » ; absent quand aucun délai ne s'applique. */
  deadlineLabel: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const { run, isPending } = useAfterSaleAction("Commande annulée.");

  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">Vous avez changé d&apos;avis ?</p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {paid
          ? "Annulez et JALOFA vous rembourse."
          : "Vous pouvez annuler cette demande."}
        {deadlineLabel && ` Possible jusqu'au ${deadlineLabel}.`}
      </p>
      {confirming ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => cancelOrder(orderId))}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Oui, annuler
          </Button>
          <Button variant="outline" disabled={isPending} onClick={() => setConfirming(false)}>
            Non, garder
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="mt-3" onClick={() => setConfirming(true)}>
          Annuler ma commande
        </Button>
      )}
    </div>
  );
}

/** Rendre un tissu reçu, ou suivre le retour déjà demandé. */
export function FabricReturnPanel({
  orderId,
  status,
  deadlineLabel,
  returnAddress,
}: {
  orderId: string;
  status: "requested" | "received" | null;
  deadlineLabel: string | null;
  returnAddress: { address: string; phone: string } | null;
}) {
  const { run, isPending } = useAfterSaleAction("Retour enregistré.");

  if (status === "received") {
    return (
      <div className="rounded-xl border p-4">
        <p className="font-semibold">Le vendeur a reçu votre tissu</p>
        <p className="text-muted-foreground mt-0.5 text-sm">JALOFA va vous rembourser.</p>
      </div>
    );
  }

  if (status === "requested") {
    return (
      <div className="rounded-xl border p-4">
        <p className="font-semibold">Renvoyez le tissu au vendeur</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          L&apos;envoi est à votre charge. Vous êtes remboursé quand le vendeur l&apos;a reçu.
        </p>
        {returnAddress ? (
          <div className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
            <p className="break-words font-medium">{returnAddress.address}</p>
            <a href={`tel:${returnAddress.phone}`} className="mt-1 block hover:underline">
              {returnAddress.phone}
            </a>
          </div>
        ) : (
          <p className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
            JALOFA vous contacte sur WhatsApp pour vous donner l&apos;adresse.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">Ce tissu ne vous convient pas ?</p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        Vous pouvez le rendre
        {deadlineLabel && ` jusqu'au ${deadlineLabel}`}. L&apos;envoi est à votre charge,
        et vous êtes remboursé quand le vendeur l&apos;a reçu.
      </p>
      <Button
        variant="outline"
        className="mt-3"
        disabled={isPending}
        onClick={() => run(() => requestFabricReturn(orderId))}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
        Rendre ce tissu
      </Button>
    </div>
  );
}

const REASONS = Object.keys(ALTERATION_REASON_LABELS) as AlterationReason[];

/** Un vêtement ne se rend pas : il se retouche. */
export function AlterationPanel({
  orderId,
  canAsk,
  alterations,
}: {
  orderId: string;
  canAsk: boolean;
  alterations: { id: string; reason: AlterationReason; status: "requested" | "done" }[];
}) {
  const [reason, setReason] = useState<AlterationReason | null>(null);
  const [note, setNote] = useState("");
  const { run, isPending } = useAfterSaleAction("Demande envoyée à votre tailleur.");

  return (
    <div className="rounded-xl border p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Scissors className="size-4" /> Votre tenue ne va pas ?
      </p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        Une tenue cousue ne peut pas être rendue, mais votre tailleur peut la retoucher.
      </p>

      {alterations.map((a) => (
        <p key={a.id} className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
          {ALTERATION_REASON_LABELS[a.reason]} :{" "}
          <span className="font-medium">
            {a.status === "done" ? "retouche faite" : "demande envoyée au tailleur"}
          </span>
        </p>
      ))}

      {canAsk && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                aria-pressed={reason === r}
                className={cn(
                  "rounded-lg border p-3 text-sm font-medium transition-colors",
                  reason === r ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted",
                )}
              >
                {ALTERATION_REASON_LABELS[r]}
              </button>
            ))}
          </div>
          {reason && (
            <>
              <Textarea
                className="mt-3"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Expliquez en quelques mots (facultatif)"
              />
              <Button
                className="mt-3 h-11 w-full"
                disabled={isPending}
                onClick={() => run(() => requestAlteration(orderId, reason, note))}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Demander la retouche
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
