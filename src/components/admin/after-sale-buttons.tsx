"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  adminMarkFabricReceived,
  adminMarkRefunded,
  type AfterSaleResult,
} from "@/lib/actions/after-sale";

function ActionButton({
  label,
  done,
  run,
}: {
  label: string;
  done: string;
  run: () => Promise<AfterSaleResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await run();
          if (res.ok) {
            toast.success(done);
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
    >
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function MarkFabricReceivedButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Tissu reçu"
      done="Tissu marqué reçu : l'argent du vendeur est libéré."
      run={() => adminMarkFabricReceived(orderId)}
    />
  );
}

export function MarkRefundedButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Client remboursé"
      done="Remboursement enregistré."
      run={() => adminMarkRefunded(orderId)}
    />
  );
}
