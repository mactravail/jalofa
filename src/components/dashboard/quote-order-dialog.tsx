"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/constants";
import { tailorDeliversFree, type FreeDeliveryZone } from "@/lib/delivery";
import { T } from "@/components/i18n/t";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Le tailleur répond à une demande de devis : son prix et celui de la livraison
 * vers l'adresse du client, le tissu étant déjà connu. Le client reçoit ce détail,
 * puis accepte et paie le total, ou modifie sa demande. Dialog contrôlé —
 * `OrderStatusControl` l'ouvre et exécute l'envoi.
 */
export function QuoteOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  fabricPrice,
  address,
  city,
  country,
  deliveryZone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    price: number,
    deliveryFee: number,
    readyDays: number,
    note: string | null,
  ) => void;
  isPending: boolean;
  fabricPrice: number;
  address: string | null;
  city: string | null;
  country: string | null;
  /** Son choix sur ce modèle propose un prix de livraison ; c'est lui qui décide. */
  deliveryZone: FreeDeliveryZone;
}) {
  const suggestedDelivery = tailorDeliversFree(deliveryZone, { city, country }) ? "0" : "";
  const [value, setValue] = useState("");
  const [deliveryValue, setDeliveryValue] = useState(suggestedDelivery);
  const [daysValue, setDaysValue] = useState("");
  const [note, setNote] = useState("");
  const t = useT();
  const place = [address, city, country].filter(Boolean).join(", ");

  const price = Math.round(Number(value));
  const delivery = Math.round(Number(deliveryValue));
  const days = Math.round(Number(daysValue));
  const daysValid = daysValue.trim() !== "" && Number.isFinite(days) && days >= 1 && days <= 120;
  const valid =
    Number.isFinite(price) &&
    price > 0 &&
    deliveryValue.trim() !== "" &&
    Number.isFinite(delivery) &&
    delivery >= 0 &&
    daysValid;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setValue("");
          setDeliveryValue(suggestedDelivery);
          setDaysValue("");
          setNote("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle><T>Donner mon prix</T></DialogTitle>
          <DialogDescription>
            <T>Le client recevra le détail : tissu, livraison, votre travail et le délai.</T>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote_price"><T>Mon travail (FCFA)</T></Label>
            <Input
              id="quote_price"
              type="number"
              min={0}
              step={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("Ex. 25000")}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote_delivery"><T>Livraison (FCFA)</T></Label>
            {place && (
              <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-words">{place}</span>
              </p>
            )}
            <Input
              id="quote_delivery"
              type="number"
              min={0}
              step={1}
              value={deliveryValue}
              onChange={(e) => setDeliveryValue(e.target.value)}
              placeholder={t("Ex. 3000")}
            />
            <p className="text-muted-foreground text-xs"><T>0 = livraison gratuite.</T></p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote_days"><T>Prêt dans combien de jours ?</T></Label>
            <div className="flex items-center gap-2">
              <Input
                id="quote_days"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                step={1}
                value={daysValue}
                onChange={(e) => setDaysValue(e.target.value)}
                placeholder={t("Ex. 6")}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm"><T>jours</T></span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote_note">
              <T>Un mot pour le client</T>{" "}
              <span className="text-muted-foreground font-normal">(<T>facultatif</T>)</span>
            </Label>
            <Textarea
              id="quote_note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder={t("Ex. Je peux ajouter une doublure si vous voulez.")}
              rows={2}
              maxLength={200}
            />
            <p className="text-muted-foreground text-right text-xs tabular-nums">
              {note.length}/200
            </p>
          </div>

          {valid && (
            <dl className="bg-muted/50 space-y-1 rounded-lg p-3 text-sm">
              {fabricPrice > 0 && <Line label="Tissu" amount={formatPrice(fabricPrice)} />}
              <Line
                label="Livraison"
                amount={delivery > 0 ? formatPrice(delivery) : t("Gratuite")}
              />
              <Line label="Mon travail" amount={formatPrice(price)} />
              <Line label="Prêt dans" amount={days > 1 ? t("{n} jours", { n: days }) : t("{n} jour", { n: days })} />
              <div className="flex justify-between gap-3 border-t pt-1 font-semibold">
                <dt><T>Total pour le client</T></dt>
                <dd className="whitespace-nowrap">
                  {formatPrice(fabricPrice + delivery + price)}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            <T>Annuler</T>
          </Button>
          <Button
            type="button"
            onClick={() => valid && onConfirm(price, delivery, days, note.trim() || null)}
            disabled={isPending || !valid}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            <T>Envoyer le devis</T>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Line({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground"><T>{label}</T></dt>
      <dd className="whitespace-nowrap">{amount}</dd>
    </div>
  );
}
