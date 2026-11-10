"use client";

import { useState } from "react";
import { Loader2, Truck } from "lucide-react";

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

export type CourierInfo = { name: string; phone: string; eta: string };

/** Valeur par défaut d'un <input type="datetime-local"> : dans 3 heures. */
function inThreeHours(): string {
  const d = new Date(Date.now() + 3 * 3_600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

/**
 * Le tailleur remet la tenue au livreur : qui, quel numéro, quand elle
 * arrivera. Le client reçoit tout ça dans sa notification.
 */
export function CourierDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (courier: CourierInfo) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [eta, setEta] = useState(inThreeHours);

  const ready = name.trim() && phone.replace(/\D/g, "").length >= 7 && eta;

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onConfirm({ name, phone, eta: new Date(eta).toISOString() });
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="size-5" /> Tenue remise au livreur
            </DialogTitle>
            <DialogDescription>
              Le client recevra le nom et le numéro du livreur. Donnez aussi au livreur le
              numéro du client pour qu&apos;il puisse l&apos;appeler.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="courier-name">Nom du livreur</Label>
              <Input
                id="courier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Moussa"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="courier-phone">Numéro du livreur</Label>
              <Input
                id="courier-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="77 123 45 67"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="courier-eta">Arrivée prévue chez le client</Label>
              <Input
                id="courier-eta"
                type="datetime-local"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!ready || isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
              Envoyer au client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
