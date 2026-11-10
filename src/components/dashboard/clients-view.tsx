"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Phone,
  Scissors,
  ShoppingBag,
  Sparkles,
  Undo2,
  UsersRound,
} from "lucide-react";

import { AfterSaleProActions } from "@/components/dashboard/after-sale-pro-actions";
import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet";
import { usePipeline } from "@/components/dashboard/pipeline-store";
import { OrderStatusBadge } from "@/components/order/order-status";
import {
  feedbackOf,
  groupClients,
  initialsOf,
  type ClientFeedback,
  type ClientSummary,
} from "@/lib/clients";
import { ORDER_TYPE_LABELS, formatPrice, formatReceivedAt } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import { TONE, type Tone } from "@/lib/dashboard-tone";
import type { OrderListItem } from "@/lib/orders-data";
import { amountFor } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n/t";
import { useT } from "@/components/i18n/locale-provider";
import { useLocale } from "@/components/i18n/locale-provider";

// Chaque client garde sa couleur (rangée par dépense), pour que les fiches se
// distinguent d'un coup d'œil sans qu'aucune ne crie plus fort qu'une autre.
const AVATAR_TONES: Tone[] = [
  "violet",
  "amber",
  "emerald",
  "blue",
  "rose",
  "teal",
  "fuchsia",
  "indigo",
];

/** Au-delà, la fiche se replie : « Voir les N commandes ». */
const ORDERS_SHOWN = 3;

/**
 * La grille « Mes clients » — reconstruite à partir des commandes du pipeline
 * partagé. Pour chaque client : ce qu'on lui a fait (chaque commande ouvre sa
 * fiche) et ce qu'il a renvoyé (retouche, problème, tissu retourné). Composant
 * client (il lit le pipeline) ; le titre vient de la page serveur.
 */
export function ClientsList({ role }: { role: ProRole }) {
  const { orders } = usePipeline();
  const clients = groupClients(role, orders);

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <span
          className={cn(
            "mx-auto flex size-14 items-center justify-center rounded-2xl",
            TONE.violet.soft,
          )}
        >
          <UsersRound className="size-7" />
        </span>
        <p className="mt-4 font-semibold"><T>Pas encore de client</T></p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
          <T>{"Dès qu'une personne a payé, elle apparaît ici avec tout ce qu'elle vous a commandé."}</T>
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      {clients.map((client, i) => (
        <li key={client.id}>
          <ClientCard
            client={client}
            role={role}
            tone={AVATAR_TONES[i % AVATAR_TONES.length]}
          />
        </li>
      ))}
    </ul>
  );
}

function ClientCard({
  client,
  role,
  tone,
}: {
  client: ClientSummary;
  role: ProRole;
  tone: Tone;
}) {
  const t = TONE[tone];
  const tr = useT();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? client.orderList : client.orderList.slice(0, ORDERS_SHOWN);
  const hidden = client.orderList.length - shown.length;

  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-4 rounded-2xl border p-4",
        client.openFeedback > 0 && "border-amber-500/50",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold",
            t.solid,
          )}
        >
          {initialsOf(client.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{client.name}</p>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
            <span className="inline-flex items-center gap-1">
              <ShoppingBag className="size-3.5" />
              {client.orders > 1 ? tr("{n} commandes", { n: client.orders }) : tr("{n} commande", { n: client.orders })}
            </span>
            {client.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {client.city}
              </span>
            )}
          </p>
        </div>
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            aria-label={tr("Appeler {name}", { name: client.name })}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95",
              t.solid,
            )}
          >
            <Phone className="size-4" />
            <span className="max-sm:hidden">{tr("Appeler")}</span>
          </a>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">{tr("Vous a rapporté")}</p>
          <p className={cn("text-lg font-bold whitespace-nowrap", t.text)}>
            {formatPrice(client.spent)}
          </p>
        </div>
        {client.openFeedback > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-amber-950">
            <AlertTriangle className="size-3.5" />
            {client.openFeedback > 1 ? tr("{n} retours à traiter", { n: client.openFeedback }) : tr("{n} retour à traiter", { n: client.openFeedback })}
          </span>
        )}
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {tr("Ses commandes")}
        </p>
        {shown.map((order) => (
          <ClientOrder key={order.id} order={order} role={role} />
        ))}
        {client.orderList.length > ORDERS_SHOWN && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium"
          >
            <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} />
            {showAll ? tr("Voir moins") : tr("Voir les {n} autres", { n: hidden })}
          </button>
        )}
      </div>
    </div>
  );
}

/** Une commande du client : la ligne ouvre sa fiche, ses retours suivent. */
function ClientOrder({ order, role }: { order: OrderListItem; role: ProRole }) {
  const title = order.model?.name ?? order.fabric?.name ?? ORDER_TYPE_LABELS[order.type];
  // Les retours ouverts portent leur bouton (« Retouche faite », « J'ai reçu le
  // tissu ») via AfterSaleProActions ; les autres se lisent en dessous.
  const past = feedbackOf(role, order).filter((f) => !f.open);
  const locale = useLocale();

  return (
    <div className="bg-muted/30 space-y-2 rounded-xl p-2">
      <OrderDetailSheet order={order}>
        <div className="bg-muted size-11 shrink-0 overflow-hidden rounded-lg">
          {order.fabric?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.fabric.image_url} alt="" className="size-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium"><T>{title}</T></p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <OrderStatusBadge status={order.status} />
            <span className="text-muted-foreground text-xs" suppressHydrationWarning>
              {formatReceivedAt(order.created_at, locale)}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {order.payment_status === "paid" && (
            <p className="text-sm font-semibold whitespace-nowrap">
              {formatPrice(amountFor(role, order))}
            </p>
          )}
          <p className="text-muted-foreground font-mono text-[11px]">{order.order_number}</p>
        </div>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
      </OrderDetailSheet>

      <AfterSaleProActions order={order} role={role} />

      {past.map((f) => (
        <FeedbackNote key={f.id} feedback={f} />
      ))}
    </div>
  );
}

const FEEDBACK_STYLE: Record<
  ClientFeedback["kind"],
  { icon: typeof Scissors; className: string }
> = {
  alteration: { icon: Scissors, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  fabric_return: { icon: Undo2, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  problem: { icon: AlertTriangle, className: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  perfect: { icon: Sparkles, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

function FeedbackNote({ feedback }: { feedback: ClientFeedback }) {
  const { icon: Icon, className } = FEEDBACK_STYLE[feedback.kind];
  const done = feedback.kind === "alteration" || feedback.kind === "fabric_return";
  const locale = useLocale();
  return (
    <div className={cn("rounded-lg px-3 py-2 text-sm", className)}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1"><T>{feedback.title}</T></span>
        {done && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium opacity-80">
            <Check className="size-3.5" /> <T>Fait</T>
          </span>
        )}
      </p>
      {feedback.note && (
        <p className="mt-1 break-words opacity-90">« {feedback.note} »</p>
      )}
      <p className="mt-1 text-xs opacity-70" suppressHydrationWarning>
        {formatReceivedAt(feedback.at, locale)}
      </p>
    </div>
  );
}
