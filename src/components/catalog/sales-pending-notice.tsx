"use client";

import { Clock, Eye } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import {
  DEMO_FABRIC_TEXT,
  DEMO_FABRIC_TITLE,
  SALES_PENDING_TEXT,
  SALES_PENDING_TITLE,
} from "@/lib/sales-approval";
import { cn } from "@/lib/utils";

/**
 * À la place du bouton d'achat quand le pro n'est pas encore validé par JALOFA
 * (anti-arnaque) : l'article reste visible, mais ne s'achète pas encore.
 */
export function SalesPendingNotice({
  className,
  demo = false,
}: {
  className?: string;
  /** Tissu de démonstration (sans vrai vendeur) : aperçu, jamais en vente. */
  demo?: boolean;
}) {
  const t = useT();
  const Icon = demo ? Eye : Clock;
  return (
    <div className={cn("rounded-xl border border-dashed p-4", className)}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="size-5 shrink-0" />
        {t(demo ? DEMO_FABRIC_TITLE : SALES_PENDING_TITLE)}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">{t(demo ? DEMO_FABRIC_TEXT : SALES_PENDING_TEXT)}</p>
    </div>
  );
}
