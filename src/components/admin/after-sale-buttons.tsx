"use client";

import { adminRefundViaBictorys, adminVerifyVendorShipment } from "@/lib/actions/order-workflow";
import { useRouter } from "@/lib/i18n/navigation";
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

/** Après l'appel au vendeur : il a bien envoyé le tissu → on peut le payer. */
export function VendorShipmentButtons({ orderId, denied }: { orderId: string; denied: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        label="Oui, il l'a envoyé"
        done="Envoi confirmé : l'argent du vendeur est libéré."
        run={() => adminVerifyVendorShipment(orderId, true)}
      />
      {!denied && (
        <ActionButton
          label="Non, pas envoyé"
          done="Envoi démenti : le vendeur ne sera pas payé pour ce tissu."
          run={() => adminVerifyVendorShipment(orderId, false)}
        />
      )}
    </div>
  );
}

/** Rembourse par Bictorys (transaction entière, une seule commande). */
export function BictorysRefundButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Rembourser via Bictorys"
      done="Remboursement Bictorys demandé et enregistré."
      run={() => adminRefundViaBictorys(orderId)}
    />
  );
}
