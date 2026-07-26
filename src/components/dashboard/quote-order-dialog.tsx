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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/constants";

/**
 * Le tailleur chiffre une demande de devis : il saisit son prix de confection.
 * Dialog contrôlé — `OrderStatusControl` l'ouvre depuis son bouton « Chiffrer
 * le devis » et exécute l'envoi. Le client sera ensuite invité à accepter et
 * payer ce prix.
 */
export function QuoteOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (price: number) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  const price = Math.round(Number(value));
  const valid = Number.isFinite(price) && price > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setValue("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chiffrer ce devis</DialogTitle>
          <DialogDescription>
            Indiquez votre prix de confection. Le client le recevra, puis
            décidera de l&apos;accepter et de payer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="quote_price">Prix de confection (FCFA)</Label>
          <Input
            id="quote_price"
            type="number"
            min={0}
            step={500}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex. 25000"
            autoFocus
          />
          {valid && (
            <p className="text-muted-foreground text-sm">
              Proposé au client : {" "}
              <span className="text-foreground font-medium">{formatPrice(price)}</span>
            </p>
          )}
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
            onClick={() => valid && onConfirm(price)}
            disabled={isPending || !valid}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Envoyer le devis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
