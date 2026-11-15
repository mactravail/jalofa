"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, PauseCircle, Scissors, Store } from "lucide-react";
import { toast } from "sonner";

import { ContactInfo } from "@/components/admin/contact-info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setProSalesApproval } from "@/lib/actions/subscriptions";

export type SalesApprovalAccount = {
  id: string;
  name: string;
  hasTailor: boolean;
  hasVendor: boolean;
  approved: boolean;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  /** Ce que le pro a déjà publié — de quoi juger s'il est sérieux. */
  models: number;
  fabrics: number;
  certified: boolean;
};

/**
 * Un pro dans « Validations » : l'admin regarde sa boutique (liens vers ses
 * pages publiques), l'appelle si besoin, puis valide ses ventes — ou les met
 * en pause s'il devient suspect.
 */
export function SalesApprovalRow({
  account,
  demo,
}: {
  account: SalesApprovalAccount;
  demo: boolean;
}) {
  const [approved, setApproved] = useState(account.approved);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !approved;
    if (!next && !window.confirm(`Mettre en pause les ventes de ${account.name} ?`)) return;
    startTransition(async () => {
      if (!demo) {
        const res = await setProSalesApproval(account.id, next);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      }
      setApproved(next);
      toast.success(
        next ? `${account.name} peut maintenant vendre` : `Ventes de ${account.name} en pause`,
      );
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{account.name}</p>
          {account.certified && <Badge variant="secondary">Certifié</Badge>}
          {account.city && (
            <span className="text-muted-foreground text-xs">{account.city}</span>
          )}
        </div>

        <p className="text-muted-foreground mt-1 text-xs">
          {account.models} modèle{account.models > 1 ? "s" : ""} ·{" "}
          {account.fabrics} tissu{account.fabrics > 1 ? "s" : ""} publié
          {account.models + account.fabrics > 1 ? "s" : ""}
        </p>

        <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
          {account.hasTailor && (
            <Link
              href={`/tailleurs/${account.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 underline underline-offset-2"
            >
              <Scissors className="size-3" /> Voir l&apos;atelier
              <ExternalLink className="size-3" />
            </Link>
          )}
          {account.hasVendor && (
            <Link
              href={`/vendeurs/${account.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 underline underline-offset-2"
            >
              <Store className="size-3" /> Voir la boutique
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>

        {(account.owner_name || account.email || account.phone) && (
          <div className="mt-2">
            {account.owner_name && <p className="text-sm">{account.owner_name}</p>}
            <ContactInfo email={account.email} phone={account.phone} className="mt-0.5" />
          </div>
        )}
      </div>

      <div className="shrink-0">
        {approved ? (
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PauseCircle className="size-4" />
            )}
            Mettre en pause
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={toggle}
            disabled={isPending}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Valider les ventes
          </Button>
        )}
      </div>
    </div>
  );
}
