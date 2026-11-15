"use client";

import { useActionState, useEffect } from "react";
import { Clock, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";
import { saveShippingFees, type ShippingFeesState } from "@/lib/actions/shipping-fees";

/**
 * Mes prix de livraison : économique et express. Le client les voit à la caisse
 * avant de payer. Vide = je ne propose pas cette option ; 0 = offerte.
 */
export function ShippingFeesForm({
  role,
  economy,
  express,
}: {
  role: "tailor" | "vendor";
  economy: number | null;
  express: number | null;
}) {
  const t = useT();
  const [state, action, isPending] = useActionState<ShippingFeesState, FormData>(saveShippingFees, null);

  useEffect(() => {
    if (state?.ok) toast.success(t("Prix de livraison enregistrés."));
    else if (state && !state.ok) toast.error(t(state.error));
  }, [state, t]);

  return (
    <form action={action} className="bg-card space-y-4 rounded-2xl border p-5">
      <input type="hidden" name="role" value={role} />
      <div>
        <h2 className="text-lg font-semibold">{t("Mes prix de livraison")}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {role === "vendor"
            ? t("Ce que coûte l'envoi de votre tissu (à l'atelier du tailleur, ou chez le client). Le client le voit avant de payer.")
            : t("Ce que coûte la livraison du vêtement fini chez le client. Le client le voit avant de payer.")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-4" /> {t("Économique (FCFA)")}
          </span>
          <Input name="economy" inputMode="numeric" defaultValue={economy ?? ""} placeholder="2000" />
          <span className="text-muted-foreground block text-xs">
            {role === "vendor"
              ? t("Vous attendez 24 h après le paiement avant d'envoyer.")
              : t("Livraison normale.")}
          </span>
        </label>
        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Zap className="size-4" /> {t("Express (FCFA)")}
          </span>
          <Input name="express" inputMode="numeric" defaultValue={express ?? ""} placeholder={t("Vide = pas d'express")} />
          <span className="text-muted-foreground block text-xs">
            {role === "vendor" ? t("Vous envoyez le jour même du paiement.") : t("Livraison rapide.")}
          </span>
        </label>
      </div>
      <p className="text-muted-foreground text-xs">
        {t("Vide : option non proposée. 0 : livraison offerte. Vous avancez les frais d'envoi : JALOFA vous les reverse quand la commande aboutit.")}
      </p>
      <Button type="submit" disabled={isPending} className="h-12 rounded-xl px-6">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {t("Enregistrer")}
      </Button>
    </form>
  );
}
