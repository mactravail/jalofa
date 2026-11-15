"use client";

import { useState, useTransition } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/lib/i18n/navigation";
import { adminRecordPayout } from "@/lib/actions/order-workflow";
import { formatPrice } from "@/lib/constants";

/** « J'ai versé » : inscrit au registre le versement de tout ce qui reste dû. */
export function RecordPayoutButton({
  proId,
  role,
  amount,
}: {
  proId: string;
  role: "tailor" | "vendor";
  amount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("Wave");
  const [reference, setReference] = useState("");
  const [isPending, startTransition] = useTransition();

  if (amount <= 0) return null;

  if (!open) {
    return (
      <Button variant="outline" className="h-10 rounded-xl" onClick={() => setOpen(true)}>
        <HandCoins className="size-4" /> Marquer versé ({formatPrice(amount)})
      </Button>
    );
  }

  const submit = () =>
    startTransition(async () => {
      const res = await adminRecordPayout({ proId, role, method, reference });
      if (res.ok) {
        toast.success("Versement enregistré.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
      <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Moyen (Wave…)" />
      <Input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Référence de la transaction"
      />
      <Button disabled={isPending || !reference.trim()} onClick={submit} className="h-10 rounded-xl">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Confirmer {formatPrice(amount)}
      </Button>
    </div>
  );
}
