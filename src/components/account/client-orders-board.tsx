import Link from "next/link";
import { ArrowRight, Check, Package, Scissors, Shirt, Truck, UserCog } from "lucide-react";

import { Price } from "@/components/cart/price";
import { buttonVariants } from "@/components/ui/button";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, type OrderStatus } from "@/lib/constants";
import type { OrderListItem } from "@/lib/orders-data";
import { pipelineType } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

/**
 * L'espace « Mes commandes » du client, pensé pour se lire en une seconde :
 *
 * 1. **À faire** — ce qui attend le client (payer un devis prêt, choisir un
 *    autre tailleur, confirmer la réception du tissu), en carte blanche sur le
 *    fond noir : c'est la seule chose qui saute aux yeux.
 * 2. **En cours** — une grande photo par commande et une barre de cinq étapes
 *    simples (Commande · Tissu · Couture · En route · Livré) au lieu des dix
 *    statuts internes du pipeline.
 * 3. **Terminées** — l'historique, en lignes compactes.
 */

type Action = { title: string; label: string; showPrice: boolean };

/** Ce que le client doit faire maintenant sur cette commande, sinon `null`. */
function actionFor(order: OrderListItem): Action | null {
  if (order.status === "rejected") {
    return {
      title: "Le tailleur n'a pas pu accepter",
      label: "Choisir un autre tailleur",
      showPrice: false,
    };
  }
  if (
    order.is_quote &&
    order.status === "received" &&
    order.payment_status === "pending" &&
    order.tailoring_price > 0
  ) {
    return { title: "Votre devis est prêt", label: "Voir et payer", showPrice: true };
  }
  if (order.type === "fabric_only" && order.status === "fabric_shipped") {
    return {
      title: "Votre tissu est en route",
      label: "J'ai reçu mon tissu",
      showPrice: false,
    };
  }
  if (order.type !== "fabric_only" && order.status === "shipped") {
    return {
      title: "Votre tenue est en route",
      label: "Voir le livreur",
      showPrice: false,
    };
  }
  return null;
}

const isDone = (o: OrderListItem) =>
  o.status === "delivered" || o.status === "cancelled";

// Les cinq étapes que le client comprend, et les statuts internes de chacune.
const PHASES = [
  { key: "order", label: "Commande", icon: Package, statuses: ["received", "accepted"] },
  {
    key: "fabric",
    label: "Tissu",
    icon: Shirt,
    statuses: ["fabric_prepared", "fabric_shipped", "fabric_received_by_tailor"],
  },
  {
    key: "sewing",
    label: "Couture",
    icon: Scissors,
    statuses: ["in_production", "sewing", "quality_check"],
  },
  { key: "shipping", label: "En route", icon: Truck, statuses: ["shipped"] },
  { key: "delivered", label: "Livré", icon: Check, statuses: ["delivered"] },
] as const satisfies readonly {
  key: string;
  label: string;
  icon: typeof Package;
  statuses: readonly OrderStatus[];
}[];

function phasesFor(order: OrderListItem) {
  const type = pipelineType(order);
  return PHASES.filter((p) => {
    if (p.key === "fabric") return type !== "own_fabric";
    if (p.key === "sewing") return type !== "fabric_only";
    return true;
  });
}

/** Le message principal d'une commande en cours, en mots de tous les jours. */
function headline(order: OrderListItem): string {
  if (order.is_quote && order.payment_status === "pending" && order.tailoring_price <= 0) {
    return "Le tailleur prépare votre prix";
  }
  switch (order.status) {
    case "received":
      return "Commande envoyée au tailleur";
    case "accepted":
      return "Le tailleur a accepté";
    case "fabric_prepared":
      return "Votre tissu est prêt";
    case "fabric_shipped":
      return "Le tissu part chez le tailleur";
    case "fabric_received_by_tailor":
      return "Le tailleur a reçu le tissu";
    case "in_production":
      return "La coupe a commencé";
    case "sewing":
      return "Votre tenue est en couture";
    case "quality_check":
      return "Dernières finitions";
    case "shipped":
      return "Votre tenue arrive";
    default:
      return ORDER_STATUS_LABELS[order.status];
  }
}

const titleOf = (o: OrderListItem) =>
  o.model?.name ?? o.fabric?.name ?? ORDER_TYPE_LABELS[o.type];

const imageOf = (o: OrderListItem) => o.model?.image_url ?? o.fabric?.image_url ?? null;

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

const hrefOf = (o: OrderListItem) => `/compte/commandes/${o.id}`;

export function ClientOrdersBoard({
  orders,
  firstName,
  children,
}: {
  orders: OrderListItem[];
  firstName: string | null;
  /** Glissé avant l'appel « Une nouvelle tenue ? » (ex. les notifications). */
  children?: React.ReactNode;
}) {
  const todo = orders.filter((o) => actionFor(o));
  const ongoing = orders.filter((o) => !actionFor(o) && !isDone(o));
  const done = orders.filter((o) => !actionFor(o) && isDone(o));

  return (
    <div className="space-y-12">
      <header>
        <OrdersHeading firstName={firstName} />
        <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
          <Counter value={todo.length} label="À faire" accent={todo.length > 0} href="#a-faire" />
          <Counter value={ongoing.length} label="En cours" href="#en-cours" />
          <Counter value={done.length} label="Terminées" href="#terminees" />
        </div>
      </header>

      {todo.length > 0 && (
        <section id="a-faire" className="scroll-mt-24 space-y-4">
          <SectionTitle index="01" title="À faire maintenant" />
          <div className="space-y-4">
            {todo.map((o) => (
              <TodoCard key={o.id} order={o} action={actionFor(o)!} />
            ))}
          </div>
        </section>
      )}

      {ongoing.length > 0 && (
        <section id="en-cours" className="scroll-mt-24 space-y-4">
          <SectionTitle index={todo.length > 0 ? "02" : "01"} title="En cours" />
          <div className="grid gap-4 lg:grid-cols-2">
            {ongoing.map((o) => (
              <OngoingCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section id="terminees" className="scroll-mt-24 space-y-4">
          <SectionTitle
            index={String([todo, ongoing].filter((l) => l.length > 0).length + 1).padStart(2, "0")}
            title="Terminées"
          />
          <ul className="divide-border divide-y rounded-2xl border">
            {done.map((o) => (
              <DoneRow key={o.id} order={o} />
            ))}
          </ul>
        </section>
      )}

      {children}

      <Link
        href="/modeles"
        className="group bg-card hover:bg-muted/60 flex items-center justify-between gap-4 rounded-2xl border p-6 transition-colors"
      >
        <span>
          <span className="block text-xl font-bold">Une nouvelle tenue ?</span>
          <span className="text-muted-foreground text-sm">Choisissez un modèle, on s’occupe du reste.</span>
        </span>
        <span className="bg-foreground text-background flex size-12 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1">
          <ArrowRight className="size-5" />
        </span>
      </Link>
    </div>
  );
}

/**
 * Le titre de l'espace client. Le profil n'y tient qu'en un petit lien
 * « Mon compte » : ce qui compte ici, ce sont les commandes.
 */
function OrdersHeading({ firstName }: { firstName: string | null }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground min-w-0 truncate text-xs font-medium tracking-[0.3em] uppercase">
          {firstName ? `${firstName} · ` : ""}Mon espace
        </p>
        <Link
          href="/compte/parametres"
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 text-xs font-medium"
        >
          <UserCog className="size-4" /> Mon compte
        </Link>
      </div>
      <h1 className="mt-2 text-4xl font-black tracking-tight uppercase sm:text-6xl">
        Mes commandes
      </h1>
    </>
  );
}

export function ClientOrdersEmpty({
  message,
  firstName = null,
  children,
}: {
  message: string;
  firstName?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header>
        <OrdersHeading firstName={firstName} />
      </header>
      <div className="relative overflow-hidden rounded-3xl border p-8 sm:p-12">
        <Scissors className="text-muted-foreground/20 absolute -right-6 -bottom-6 size-48 -rotate-12" />
        <p className="relative max-w-sm text-2xl font-bold">{message}</p>
        <p className="text-muted-foreground relative mt-2">
          Votre première tenue sur mesure vous attend.
        </p>
        <Link
          href="/modeles"
          className={cn(buttonVariants({ size: "lg" }), "relative mt-6 h-14 gap-2 px-8 text-base")}
        >
          Créer une tenue <ArrowRight className="size-5" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function Counter({
  value,
  label,
  href,
  accent,
}: {
  value: number;
  label: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <a
      href={value > 0 ? href : undefined}
      className={cn(
        "rounded-2xl border p-3 transition-colors",
        accent
          ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
          : "hover:bg-muted/60",
        value === 0 && "opacity-50",
      )}
    >
      <span className="block text-3xl font-black tabular-nums">{value}</span>
      <span className={cn("text-xs font-medium", !accent && "text-muted-foreground")}>{label}</span>
    </a>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 border-b pb-3">
      <span className="text-muted-foreground font-mono text-xs">{index} /</span>
      <span className="text-sm font-bold tracking-[0.2em] uppercase">{title}</span>
    </h2>
  );
}

function Thumb({ order, className }: { order: OrderListItem; className?: string }) {
  const src = imageOf(order);
  return (
    <div className={cn("bg-muted relative shrink-0 overflow-hidden", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <Shirt className="text-muted-foreground/40 absolute inset-0 m-auto size-1/3" />
      )}
    </div>
  );
}

/** Carte blanche, sur fond noir : on ne voit qu'elle. */
function TodoCard({ order, action }: { order: OrderListItem; action: Action }) {
  return (
    <Link
      href={hrefOf(order)}
      className="group bg-foreground text-background flex flex-col overflow-hidden rounded-3xl shadow-2xl transition-transform hover:-translate-y-0.5 sm:flex-row"
    >
      <Thumb order={order} className="aspect-[16/10] w-full sm:aspect-auto sm:w-56" />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-orange-500" />
          </span>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Action requise</span>
        </div>
        <div>
          <p className="text-2xl leading-tight font-black sm:text-3xl">{action.title}</p>
          <p className="mt-1 text-sm opacity-60">
            {titleOf(order)}
            {order.tailor?.shop_name ? ` · ${order.tailor.shop_name}` : ""}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          {action.showPrice ? (
            <Price amount={order.total_amount} className="text-3xl font-black" />
          ) : (
            <span />
          )}
          <span className="bg-background text-foreground inline-flex h-14 items-center gap-2 rounded-lg px-7 text-base font-bold transition-transform group-hover:translate-x-1">
            {action.label} <ArrowRight className="size-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function OngoingCard({ order }: { order: OrderListItem }) {
  const phases = phasesFor(order);
  const current = Math.max(
    0,
    phases.findIndex((p) => (p.statuses as readonly OrderStatus[]).includes(order.status)),
  );

  return (
    <Link
      href={hrefOf(order)}
      className="group bg-card hover:border-foreground/40 flex flex-col overflow-hidden rounded-3xl border transition-colors"
    >
      <div className="relative">
        <Thumb order={order} className="aspect-[16/9] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-xs font-medium tracking-[0.2em] uppercase opacity-70">
            {titleOf(order)}
          </p>
          <p className="mt-1 text-2xl leading-tight font-black">{headline(order)}</p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <ol className="flex items-start">
          {phases.map((p, i) => {
            const reached = i <= current;
            const isCurrent = i === current;
            return (
              <li key={p.key} className="flex flex-1 flex-col items-center gap-1.5 last:flex-none">
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      reached
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground",
                      isCurrent && "ring-foreground/20 ring-4",
                    )}
                  >
                    <p.icon className="size-4" />
                  </span>
                  {i < phases.length - 1 && (
                    <span
                      className={cn(
                        "mx-1 h-0.5 flex-1 rounded-full",
                        i < current ? "bg-foreground" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "self-start text-[11px] font-medium",
                    isCurrent ? "text-foreground font-bold" : "text-muted-foreground",
                  )}
                >
                  {p.label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
          <span className="text-muted-foreground min-w-0 truncate">
            {order.tailor?.shop_name ?? ORDER_TYPE_LABELS[order.type]} · {dateOf(order.created_at)}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
            Suivre <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function DoneRow({ order }: { order: OrderListItem }) {
  const delivered = order.status === "delivered";
  return (
    <li>
      <Link href={hrefOf(order)} className="hover:bg-muted/40 flex items-center gap-4 p-4 transition-colors">
        <Thumb order={order} className="size-14 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{titleOf(order)}</p>
          <p className="text-muted-foreground text-sm">
            {delivered ? "Livré" : ORDER_STATUS_LABELS[order.status]} · {dateOf(order.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {order.total_amount > 0 && <Price amount={order.total_amount} className="font-semibold" />}
          {delivered && (
            <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
              <Check className="size-3" /> Reçue
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
