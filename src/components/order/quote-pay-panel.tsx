"use client";

import Link from "@/components/i18n/link";
import { useRouter } from "@/lib/i18n/navigation";
import { useState, useTransition } from "react";
import {
  CalendarClock,
  Loader2,
  Lock,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { acceptQuote } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Réponse à un devis, côté client. Tant que le tailleur n'a pas chiffré, on
 * patiente ; une fois le prix reçu, le client voit où va son argent (tissu,
 * livraison, tailleur), puis accepte et paie le total en une fois — ce qui fait
 * de la demande une commande ferme, et donne ses coordonnées au tailleur.
 */
export function QuotePayPanel({
  orderId,
  revision,
  tailoringPrice,
  fabricPrice,
  deliveryFee,
  totalAmount,
  deliveryPlace,
  hasAddress,
  readyDays = null,
  note = null,
  fabricFees = { economy: 0, express: null },
}: {
  /** Aller du tissu au tarif du vendeur, par option ; null = option non proposée. */
  fabricFees?: { economy: number | null; express: number | null };
  orderId: string;
  /** Combien de fois le client a déjà modifié sa demande. */
  revision: number;
  /** Prix du tailleur — 0 tant que le devis n'est pas chiffré. */
  tailoringPrice: number;
  fabricPrice: number;
  deliveryFee: number;
  /** Ce que le client paie : tissu, livraison et tailleur. */
  totalAmount: number;
  /** L'adresse pour laquelle le tailleur a chiffré la livraison. */
  deliveryPlace: string;
  /** Une ancienne demande peut ne pas en avoir : il faut d'abord la modifier. */
  hasAddress: boolean;
  /** Le délai annoncé par le tailleur : « prête en N jours ». */
  readyDays?: number | null;
  /** Le mot bref du tailleur. */
  note?: string | null;
}) {
  const router = useRouter();
  const t = useT();
  const [accepted, setAccepted] = useState(false);
  const [option, setOption] = useState<"economy" | "express">("economy");
  const fabricFee = fabricFees[option] ?? 0;
  const grandTotal = totalAmount + fabricFee;
  const [isPending, startTransition] = useTransition();

  // En attente du chiffrage : le tailleur n'a pas encore répondu.
  if (tailoringPrice <= 0) {
    return (
      <div className="border-primary/30 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
        <MessageSquareQuote className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">
            {revision > 0 ? t("Nouveau devis demandé") : t("Devis demandé")}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {t("Le tailleur a bien reçu votre demande. Vous recevrez son prix ici, avec le détail. C'est gratuit et sans engagement.")}
          </p>
        </div>
      </div>
    );
  }

  const pay = () => {
    if (!accepted) {
      toast.error(t("Acceptez les conditions pour payer"));
      return;
    }
    startTransition(async () => {
      const res = await acceptQuote(orderId, option);
      if (res.ok && res.redirectUrl) {
        // Bictorys : le client paie sur sa page ; le webhook confirmera.
        window.location.assign(res.redirectUrl);
        return;
      }
      if (res.ok) {
        toast.success(t("Devis accepté et payé. Le tailleur est prévenu."));
        router.refresh();
        return;
      }
      toast.error(t(res.error));
    });
  };

  return (
    <div className="border-primary/30 bg-primary/5 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <MessageSquareQuote className="text-primary mt-0.5 size-5 shrink-0" />
        <p className="font-semibold">
          {t("Votre devis est prêt")}{revision > 0 ? ` (n° ${revision + 1})` : ""}
        </p>
      </div>

      {/* Où va l'argent, ligne par ligne. */}
      <dl className="bg-background mt-3 space-y-2 rounded-lg border p-3 text-sm">
        {fabricPrice > 0 && <Line label={t("Tissu")} amount={formatPrice(fabricPrice)} />}
        <Line
          label={t("Livraison")}
          amount={deliveryFee > 0 ? formatPrice(deliveryFee) : t("Gratuite")}
        />
        {fabricFee > 0 && <Line label={t("Envoi du tissu à l'atelier")} amount={formatPrice(fabricFee)} />}
        <Line label={t("Tailleur")} amount={formatPrice(tailoringPrice)} />
        <div className="flex items-center justify-between gap-3 border-t pt-2 text-base font-bold">
          <dt>{t("Total")}</dt>
          <dd className="text-primary whitespace-nowrap">{formatPrice(grandTotal)}</dd>
        </div>
      </dl>

      {/* Option A / B (cahier des charges §3). */}
      <p className="mt-4 text-sm font-medium">{t("Rapidité")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["economy", "express"] as const).map((o) => {
          const available = fabricFees[o] !== null;
          return (
            <button
              key={o}
              type="button"
              disabled={!available}
              onClick={() => setOption(o)}
              aria-pressed={option === o}
              className={cn(
                "rounded-lg border p-2.5 text-left text-sm transition-colors disabled:opacity-50",
                option === o ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted",
              )}
            >
              <span className="block font-semibold">{o === "economy" ? t("Économique") : t("Express")}</span>
              <span className="text-muted-foreground block text-[11px] leading-tight">
                {!available
                  ? t("Pas proposé")
                  : o === "economy"
                    ? t("24 h pour changer d'avis")
                    : t("Tout part tout de suite")}
              </span>
            </button>
          );
        })}
      </div>

      {readyDays ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm">
          <CalendarClock className="text-muted-foreground size-4 shrink-0" />
          <span>
            {t("Prête en")}{" "}
            <strong>{readyDays > 1 ? t("{n} jours", { n: readyDays }) : t("{n} jour", { n: readyDays })}</strong>{" "}
            {t("après le paiement")}
          </span>
        </p>
      ) : null}

      {note && (
        <blockquote className="bg-background mt-3 rounded-lg border p-3 text-sm">
          <p className="text-muted-foreground text-xs font-medium">{t("Le mot du tailleur")}</p>
          <p className="mt-1 break-words whitespace-pre-line">{note}</p>
        </blockquote>
      )}

      {hasAddress ? (
        <p className="mt-3 flex items-start gap-1.5 text-sm">
          <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{t("Livraison à : {place}", { place: deliveryPlace })}</span>
        </p>
      ) : (
        <p className="text-destructive mt-3 text-sm">
          {t("Ajoutez votre adresse avec « Modifier ma demande » avant de payer.")}
        </p>
      )}

      <p className="text-muted-foreground mt-4 text-sm">
        {t("Vous payez sur une page de paiement sécurisée : Wave, Orange Money ou carte bancaire.")}
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="accent-primary mt-0.5 size-4 shrink-0"
        />
        <span>
          {t("J'accepte les")}{" "}
          <Link href="/conditions" target="_blank" className="underline underline-offset-2">
            {t("conditions d'utilisation")}
          </Link>
        </span>
      </label>

      <Button
        className="mt-3 h-auto min-h-10 w-full flex-wrap gap-x-1.5 gap-y-0 bg-emerald-600 px-3 py-2 text-center text-[13px] leading-tight font-semibold whitespace-normal text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:bg-emerald-600/40 sm:text-sm"
        onClick={pay}
        disabled={isPending || !hasAddress || !accepted}
      >
        {isPending ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <Lock className="size-4 shrink-0" />
        )}
        <span>{t("Accepter et payer")}</span>
        <span className="whitespace-nowrap">{formatPrice(grandTotal)}</span>
      </Button>
      <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-emerald-500">
        <ShieldCheck className="size-3.5" />
        {t("Paiement sécurisé · l'argent attend en sécurité")}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        {t("Une fois payé, le tailleur reçoit votre nom, votre téléphone et votre e-mail pour vous livrer.")}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {t("Payez uniquement ici. En dehors du site, JALOFA ne peut ni vous protéger ni vous rembourser.")}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {t("Annulation possible jusqu'au départ de votre tenue : JALOFA examine. Après la découpe du tissu, le tailleur garde 35 % du prix de la couture. Une tenue cousue ne se rend pas, mais votre tailleur peut la retoucher.")}
      </p>
    </div>
  );
}

function Line({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium whitespace-nowrap">{amount}</dd>
    </div>
  );
}
