"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  REJECTION_REASONS,
  REJECTION_REASON_LABELS,
  type RejectionReason,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Le tailleur ne refuse jamais une commande à l'aveugle : il choisit POURQUOI.
 * Le motif prévient le client (qui relance chez un autre atelier) et remonte à
 * l'administration. Dialog contrôlé — c'est `OrderStatusControl` qui l'ouvre
 * depuis son bouton « Refuser » et exécute le refus.
 */
export function RejectOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: RejectionReason) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState<RejectionReason | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refuser cette commande</DialogTitle>
          <DialogDescription>
            Indiquez pourquoi. Le client sera prévenu et pourra choisir un autre
            tailleur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {REJECTION_REASONS.map((value) => {
            const active = reason === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setReason(value)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                  active
                    ? "border-primary ring-primary/30 ring-2"
                    : "hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border",
                    active ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {active && <span className="bg-primary size-2 rounded-full" />}
                </span>
                {REJECTION_REASON_LABELS[value]}
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => reason && onConfirm(reason)}
            disabled={isPending || !reason}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
