"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import Link from "@/components/i18n/link";
import { useCart } from "@/components/cart/cart-context";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { useRouter } from "@/lib/i18n/navigation";

/** Combien de fois on relit l'état (toutes les 3 s) avant de rendre la main. */
const MAX_POLLS = 40;

/**
 * Retour de la page Bictorys. Le retour lui-même ne prouve rien : on affiche
 * l'état que le WEBHOOK a écrit en base, relu toutes les 3 s tant qu'il est en
 * attente. Le panier n'est vidé qu'une fois le paiement confirmé.
 */
export function PaymentReturnStatus({
  status,
  orderNumbers,
  isQuote,
}: {
  status: "paid" | "pending" | "failed";
  orderNumbers: string[];
  isQuote: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { clear } = useCart();
  const polls = useRef(0);

  useEffect(() => {
    if (status === "paid" && !isQuote) clear();
  }, [status, isQuote, clear]);

  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(() => {
      polls.current += 1;
      if (polls.current > MAX_POLLS) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [status, router]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
        {status === "paid" ? (
          <CheckCircle2 className="size-8 text-emerald-500" />
        ) : status === "failed" ? (
          <XCircle className="size-8 text-red-500" />
        ) : (
          <Loader2 className="text-primary size-8 animate-spin" />
        )}
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        {status === "paid"
          ? t("Paiement confirmé")
          : status === "failed"
            ? t("Le paiement n'a pas abouti")
            : t("Nous confirmons votre paiement…")}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {status === "paid"
          ? t("Merci ! Suivez votre commande dans votre espace.")
          : status === "failed"
            ? t("Aucun argent n'a été pris. Vous pouvez réessayer.")
            : t("Cela prend quelques secondes. Ne fermez pas cette page.")}
      </p>

      {orderNumbers.length > 0 && status !== "failed" && (
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {orderNumbers.map((n) => (
            <li key={n} className="bg-muted rounded-md px-2 py-1 font-mono text-xs">
              {n}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {status === "failed" ? (
          <Link href={isQuote ? "/compte/commandes" : "/panier"} className={buttonVariants({})}>
            {t("Réessayer")}
          </Link>
        ) : (
          <Link href="/compte/commandes" className={buttonVariants({})}>
            {t("Voir mes commandes")}
          </Link>
        )}
      </div>
    </div>
  );
}
