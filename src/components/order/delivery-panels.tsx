"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useTransition } from "react";
import { CalendarClock, CheckCircle2, Clock, Loader2, Phone, Truck, User } from "lucide-react";
import { toast } from "sonner";

import { JalofaWhatsApp } from "@/components/order/jalofa-whatsapp";
import { Button } from "@/components/ui/button";
import { confirmOrderReceived } from "@/lib/actions/orders";
import { PAYOUT_DELAY_HOURS } from "@/lib/after-sale";
import { useT } from "@/components/i18n/locale-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { intlLocale } from "@/lib/i18n/config";

const ETA_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
};

/** Le rappel des 72 h : passé ce délai, le pro est payé. */
export function PayoutDelayNotice() {
  const t = useT();
  return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm">
      <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <span>
        <strong>{t("{h} h après la livraison", { h: PAYOUT_DELAY_HOURS })}</strong>
        {t(", le tailleur et le vendeur de tissu sont payés. Un problème ? Prévenez-nous avant.")}
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
  const t = useT();
  const locale = intlLocale(useLocale());
  const [isPending, startTransition] = useTransition();

  const received = () =>
    startTransition(async () => {
      const res = await confirmOrderReceived(orderId);
      if (res.ok) {
        toast.success(t("Merci ! Vous pouvez maintenant donner votre avis."));
        router.refresh();
      } else {
        toast.error(t(res.error));
      }
    });

  return (
    <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Truck className="size-5 text-violet-400" /> {t("Votre tenue est en route")}
      </p>

      {(courierName || courierPhone || courierEta) && (
        <div className="bg-background space-y-2 rounded-lg border p-3 text-sm">
          {courierName && (
            <p className="flex items-center gap-2">
              <User className="text-muted-foreground size-4 shrink-0" />
              <span>
                {t("Livreur :")} <strong>{courierName}</strong>
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
              <span>{t("Arrivée prévue :")} {new Intl.DateTimeFormat(locale, ETA_OPTIONS).format(new Date(courierEta))}</span>
            </p>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        {t("Votre tailleur a donné votre numéro au livreur : il pourra vous appeler. Vous êtes à l'étranger et la tenue va chez votre GP ? Touchez « Reçue » dès qu'il l'a.")}
      </p>

      <Button
        onClick={received}
        disabled={isPending}
        className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-500"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {t("J'ai reçu ma tenue")}
      </Button>

      <PayoutDelayNotice />

      <JalofaWhatsApp
        orderNumber={orderNumber}
        message="Je n'ai pas reçu ma tenue / j'ai un problème :"
        label={t("Pas reçue ? Contacter un membre de JALOFA")}
        className="w-full"
      />
    </div>
  );
}
