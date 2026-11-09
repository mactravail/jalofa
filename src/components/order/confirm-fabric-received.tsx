"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmFabricReceived } from "@/lib/actions/orders";

/** Tissu seul expédié : le client confirme qu'il l'a reçu. */
export function ConfirmFabricReceived({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    startTransition(async () => {
      const res = await confirmFabricReceived(orderId);
      if (res.ok) {
        toast.success("Merci, réception confirmée.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="border-primary/30 bg-primary/5 rounded-xl border p-4">
      <p className="font-semibold">Votre tissu est en route</p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        Touchez ce bouton seulement quand vous l&apos;avez entre les mains.
      </p>
      <Button
        size="lg"
        className="mt-3 h-12 w-full text-base"
        onClick={confirm}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PackageCheck className="size-4" />
        )}
        J&apos;ai reçu mon tissu
      </Button>
    </div>
  );
}
