"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { savePayoutMethod } from "@/lib/actions/payout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAYOUT_METHOD_LABELS,
  PAYOUT_IS_MOBILE,
  type PayoutMethod,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const METHODS = Object.keys(PAYOUT_METHOD_LABELS) as PayoutMethod[];

/**
 * Le moyen de paiement du pro : où sont versées ses ventes. JALOFA est gratuit
 * (aucune commission), le pro encaisse 100% sur ce compte. Un seul moyen, valable
 * pour ses deux boutiques éventuelles (tailleur et vendeur).
 */
export function PayoutMethodForm({
  method: initialMethod,
  number: initialNumber,
  name: initialName,
}: {
  method: PayoutMethod | null;
  number: string | null;
  name: string | null;
}) {
  const [method, setMethod] = useState<PayoutMethod | null>(initialMethod);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMobile = method ? PAYOUT_IS_MOBILE(method) : true;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!method) {
      setError("Choisissez un moyen de paiement.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("payout_method", method);
    startTransition(async () => {
      const res = await savePayoutMethod(null, formData);
      if (res?.ok) {
        toast.success("Moyen de paiement enregistré.");
      } else if (res) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label>Moyen de paiement</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {METHODS.map((m) => {
            const active = method === m;
            return (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                aria-pressed={active}
                className={cn(
                  "relative rounded-lg border p-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                    : "hover:bg-muted",
                )}
              >
                {active && (
                  <span className="bg-primary text-primary-foreground absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
                {PAYOUT_METHOD_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payout_number">
          {isMobile ? "Numéro qui reçoit vos paiements" : "RIB / IBAN"}
        </Label>
        <Input
          id="payout_number"
          name="payout_number"
          defaultValue={initialNumber ?? ""}
          inputMode={isMobile ? "tel" : "text"}
          placeholder={isMobile ? "+221 77 000 00 00" : "SN12 3456 7890 …"}
          required
        />
        <p className="text-muted-foreground text-xs">
          {isMobile
            ? "Le numéro du compte Mobile Money sur lequel vous voulez être payé."
            : "Le RIB ou l'IBAN de votre compte bancaire."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payout_name">Titulaire du compte</Label>
        <Input
          id="payout_name"
          name="payout_name"
          defaultValue={initialName ?? ""}
          placeholder="Nom tel qu'il apparaît sur le compte"
          required
        />
      </div>

      <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border p-3 text-xs">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
        <span>
          Vos coordonnées de paiement restent privées : elles ne servent qu&apos;à
          vous verser vos ventes et ne sont jamais affichées aux clients.
        </span>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
