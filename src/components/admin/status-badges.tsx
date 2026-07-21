import { BadgeCheck } from "lucide-react";

import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  ROLE_LABELS,
  type OrderStatus,
  type PaymentStatus,
  type UserRole,
} from "@/lib/constants";
import { getPlan, type SubscriptionPlanId } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

type Variant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

const ORDER_TONE: Partial<Record<OrderStatus, Variant>> = {
  delivered: "default",
  rejected: "destructive",
  cancelled: "destructive",
};

/** Pastille d'état d'une commande, dans les tons de son étape. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_TONE[status] ?? "secondary"}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

const PAYMENT_TONE: Record<PaymentStatus, Variant> = {
  paid: "default",
  pending: "outline",
  failed: "destructive",
  refunded: "secondary",
};

/** Pastille d'état de paiement. */
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={PAYMENT_TONE[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>
  );
}

const ROLE_TONE: Record<UserRole, Variant> = {
  admin: "default",
  tailor: "secondary",
  vendor: "secondary",
  client: "outline",
};

/** Pastille du rôle d'un compte. */
export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>;
}

/** Pastille active / désactivée pour une boutique ou une fiche catalogue. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "secondary" : "outline"}>
      {active ? "Actif" : "Désactivé"}
    </Badge>
  );
}

/**
 * État global d'un prestataire vu par l'admin. La suspension imposée par la
 * plateforme prime sur le `is_active` que le pro règle lui-même : un pro
 * suspendu est « Suspendu » même si sa boutique est ouverte de son côté.
 */
export function ProStatusBadge({
  active,
  suspended,
}: {
  active: boolean;
  suspended: boolean;
}) {
  if (suspended) return <Badge variant="destructive">Suspendu</Badge>;
  return <ActiveBadge active={active} />;
}

/**
 * Pastille « Certifié » — gage de confiance attribué par l'administration.
 * Bleu « vérifié », le code visuel universel de la confiance (comme les coches
 * bleues des réseaux sociaux).
 */
export function CertifiedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        className,
      )}
    >
      <BadgeCheck className="fill-blue-600 text-white dark:fill-blue-400 dark:text-blue-950" />
      Certifié
    </Badge>
  );
}

const PLAN_TONE: Record<SubscriptionPlanId, Variant> = {
  free: "outline",
  standard: "secondary",
  premium: "default",
};

/** Pastille du plan d'abonnement d'un prestataire (Gratuit / Standard / Premium). */
export function PlanBadge({ plan }: { plan: SubscriptionPlanId }) {
  return <Badge variant={PLAN_TONE[plan]}>{getPlan(plan)?.name ?? plan}</Badge>;
}
