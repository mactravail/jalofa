"use client";

import { adminRefundViaBictorys, adminVerifyVendorShipment } from "@/lib/actions/order-workflow";
import { useRouter } from "@/lib/i18n/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  adminMarkOrderNotReceived,
  adminMarkOrderReceived,
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

/** Réponse du client à « Avez-vous reçu votre commande ? ». */
export function ReceiptAnswerButtons({ orderId, disputed }: { orderId: string; disputed: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <ActionButton
        label="Oui, reçue"
        done="Commande marquée reçue : le tailleur peut être payé."
        run={() => adminMarkOrderReceived(orderId)}
      />
      {!disputed && (
        <ActionButton
          label="Non, pas reçue"
          done="Noté : personne n'est payé tant que ce n'est pas réglé."
          run={() => adminMarkOrderNotReceived(orderId)}
        />
      )}
    </div>
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
        done="Envoi confirmé : la commande continue."
        run={() => adminVerifyVendorShipment(orderId, true)}
      />
      {!denied && (
        <ActionButton
          label="Non, pas envoyé"
          done="Envoi démenti : le tissu est à renvoyer."
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
