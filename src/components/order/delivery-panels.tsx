"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarClock, CheckCircle2, Clock, Loader2, Phone, Truck, User } from "lucide-react";
import { toast } from "sonner";

import { JalofaWhatsApp } from "@/components/order/jalofa-whatsapp";
import { Button } from "@/components/ui/button";
import { confirmOrderReceived } from "@/lib/actions/orders";
import { PAYOUT_DELAY_HOURS } from "@/lib/after-sale";

const ETA = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
});

/** Le rappel des 72 h : passé ce délai, le pro est payé. */
export function PayoutDelayNotice() {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm">
      <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <span>
        <strong>{PAYOUT_DELAY_HOURS} h après la livraison</strong>, le tailleur et le vendeur
        de tissu sont payés. Un problème ? Prévenez-nous avant.
      </span>
    </p>
  );
}

/**
 * La tenue est en route : qui la livre, son numéro, quand elle arrive. Puis le
 * geste qui clôt la commande : « Reçue » — ou un message WhatsApp à JALOFA.
 */
export function InTransitPanel({
  orderId,
  orderNumber,
  courierName,
  courierPhone,
  courierEta,
}: {
  orderId: string;
  orderNumber: string;
  courierName: string | null;
  courierPhone: string | null;
  courierEta: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const received = () =>
    startTransition(async () => {
      const res = await confirmOrderReceived(orderId);
      if (res.ok) {
        toast.success("Merci ! Vous pouvez maintenant donner votre avis.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Truck className="size-5 text-violet-400" /> Votre tenue est en route
      </p>

      {(courierName || courierPhone || courierEta) && (
        <div className="bg-background space-y-2 rounded-lg border p-3 text-sm">
          {courierName && (
            <p className="flex items-center gap-2">
              <User className="text-muted-foreground size-4 shrink-0" />
              <span>
                Livreur : <strong>{courierName}</strong>
              </span>
            </p>
          )}
          {courierPhone && (
            <a
              href={`tel:${courierPhone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 font-semibold text-emerald-400"
            >
              <Phone className="size-4 shrink-0" /> {courierPhone}
            </a>
          )}
          {courierEta && (
            <p className="flex items-center gap-2" suppressHydrationWarning>
              <CalendarClock className="text-muted-foreground size-4 shrink-0" />
              <span>Arrivée prévue : {ETA.format(new Date(courierEta))}</span>
            </p>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        Votre tailleur a donné votre numéro au livreur : il pourra vous appeler. Vous
        êtes à l&apos;étranger et la tenue va chez votre GP ? Touchez « Reçue » dès
        qu&apos;il l&apos;a.
      </p>

      <Button
        onClick={received}
        disabled={isPending}
        className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-500"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        J&apos;ai reçu ma tenue
      </Button>

      <PayoutDelayNotice />

      <JalofaWhatsApp
        orderNumber={orderNumber}
        message="Je n'ai pas reçu ma tenue / j'ai un problème :"
        label="Pas reçue ? Contacter un membre de JALOFA"
        className="w-full"
      />
    </div>
  );
}
