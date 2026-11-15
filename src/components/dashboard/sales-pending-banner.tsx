"use client";

import { ShieldCheck } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";

/**
 * Bandeau de l'espace pro tant que JALOFA n'a pas validé les ventes du compte
 * (anti-arnaque) : le pro publie et ses articles sont visibles, mais les
 * clients ne peuvent pas encore acheter.
 */
export function SalesPendingBanner() {
  const t = useT();
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <ShieldCheck className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">{t("Votre boutique est en cours de validation")}</p>
        <p className="mt-0.5 text-sm">
          {t(
            "Publiez vos articles dès maintenant : ils sont déjà visibles. Les clients pourront les acheter dès que JALOFA aura validé votre boutique.",
          )}
        </p>
      </div>
    </div>
  );
}
