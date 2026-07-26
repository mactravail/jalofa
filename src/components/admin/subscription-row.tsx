"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Lock, Scissors, Store } from "lucide-react";
import { toast } from "sonner";

import { ContactInfo } from "@/components/admin/contact-info";
import { PlanBadge } from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setProActivation, setProPlan } from "@/lib/actions/subscriptions";
import { formatPrice } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import { getPlan, SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/lib/subscriptions";

export type ProAccount = {
  id: string;
  name: string;
  plan: SubscriptionPlanId;
  /** Les métiers pour lesquels une boutique existe (un pour Standard, deux pour Premium/Gratuit). */
  metiers: ProRole[];
  is_activated: boolean;
  /** Le nom du propriétaire du compte — pour savoir qui contacter. */
  owner_name?: string | null;
  /** E-mail du compte (lu depuis `auth.users`). */
  email?: string | null;
  /** Téléphone renseigné à l'inscription. */
  phone?: string | null;
};

const METIER_LABEL: Record<ProRole, string> = {
  tailor: "Tailleur",
  vendor: "Vendeur",
};

/**
 * Ligne d'un prestataire dans la validation des abonnements. L'administration y
 * confirme le paiement Wave (« Activer l'espace ») ou referme l'accès, et peut
 * corriger le plan réellement réglé. En démo (sans Supabase), l'état ne vit que
 * dans le navigateur.
 */
export function SubscriptionRow({
  account,
  demo,
}: {
  account: ProAccount;
  demo: boolean;
}) {
  const [activated, setActivated] = useState(account.is_activated);
  const [plan, setPlan] = useState<SubscriptionPlanId>(account.plan);
  const [isPending, startTransition] = useTransition();

  const details = getPlan(plan);
  const price = details?.monthlyPrice ?? 0;

  const toggleActivation = () => {
    const next = !activated;
    startTransition(async () => {
      if (!demo) {
        const res = await setProActivation(account.id, next);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      }
      setActivated(next);
      toast.success(
        next
          ? `Espace de ${account.name} activé`
          : `Accès de ${account.name} suspendu`,
      );
    });
  };

  const changePlan = (next: SubscriptionPlanId) => {
    const previous = plan;
    setPlan(next);
    startTransition(async () => {
      if (!demo) {
        const res = await setProPlan(account.id, next);
        if (!res.ok) {
          setPlan(previous);
          toast.error(res.error);
          return;
        }
      }
      toast.success(`Plan de ${account.name} : ${getPlan(next)?.name ?? next}`);
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{account.name}</p>
          {account.metiers.map((m) => (
            <Badge key={m} variant="outline" className="gap-1 font-normal">
              {m === "tailor" ? (
                <Scissors className="size-3" />
              ) : (
                <Store className="size-3" />
              )}
              {METIER_LABEL[m]}
            </Badge>
          ))}
        </div>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
          <PlanBadge plan={plan} />
          {price > 0 ? (
            <span>
              {formatPrice(price)} / mois — à régler par Wave
            </span>
          ) : (
            <span>Sans abonnement (commission sur les ventes)</span>
          )}
        </p>

        {/* Qui contacter : propriétaire du compte + coordonnées. */}
        {(account.owner_name || account.email || account.phone) && (
          <div className="mt-2">
            {account.owner_name && (
              <p className="text-sm">{account.owner_name}</p>
            )}
            <ContactInfo
              email={account.email}
              phone={account.phone}
              className="mt-0.5"
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Corriger le plan réellement payé (décide de la commission JALOFA). */}
        <select
          aria-label="Plan de l'abonnement"
          value={plan}
          onChange={(e) => changePlan(e.target.value as SubscriptionPlanId)}
          disabled={isPending}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        >
          {SUBSCRIPTION_PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {activated ? (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleActivation}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
            Suspendre l&apos;accès
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={toggleActivation}
            disabled={isPending}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Activer l&apos;espace
          </Button>
        )}
      </div>
    </div>
  );
}
