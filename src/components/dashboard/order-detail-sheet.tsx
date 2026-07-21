"use client";

import { Mail, Phone, Ruler } from "lucide-react";

import { OrderStatusBadge } from "@/components/order/order-status";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DELIVERY_METHOD_LABELS,
  MEASUREMENT_FIELDS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import type { OrderListItem, OrderMeasurement } from "@/lib/orders-data";

/**
 * La fiche complète d'une commande, en panneau latéral. Quand une nouvelle
 * commande tombe, le tailleur doit tout voir d'un coup : le tissu et le nombre
 * de mètres, le relevé de mesures, la livraison, le contact et le détail des
 * prix. Le vendeur y lit la même fiche, centrée sur le tissu à préparer.
 *
 * `children` est le contenu de la ligne cliquable (vignette + résumé) : on
 * l'enveloppe dans le déclencheur pour que toute la ligne ouvre la fiche.
 */
export function OrderDetailSheet({
  order,
  children,
}: {
  order: OrderListItem;
  children: React.ReactNode;
}) {
  const created = new Date(order.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const contactName =
    [order.contact_first_name, order.contact_last_name]
      .filter(Boolean)
      .join(" ") ||
    order.client?.full_name ||
    "Client";

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={`Voir la fiche de la commande ${order.order_number}`}
            className="hover:bg-muted/50 -m-2 flex min-w-0 flex-1 items-center gap-4 rounded-lg p-2 text-left transition-colors"
          />
        }
      >
        {children}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b p-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="font-mono text-sm">
              {order.order_number}
            </SheetTitle>
            <OrderStatusBadge status={order.status} />
          </div>
          <SheetDescription>
            {ORDER_TYPE_LABELS[order.type]} · {created}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <Section title="Vêtement">
            {order.model?.name && <Row label="Modèle" value={order.model.name} />}
            {order.style?.name && <Row label="Style" value={order.style.name} />}
            <Row label="Type" value={ORDER_TYPE_LABELS[order.type]} />
          </Section>

          <FabricSection order={order} />

          <MeasurementSection measurement={order.measurement} />

          <Section title="Livraison & contact">
            <Row label="Client" value={contactName} />
            {order.contact_phone && (
              <Row
                label="Téléphone"
                value={
                  <a
                    href={`tel:${order.contact_phone}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Phone className="size-3.5" /> {order.contact_phone}
                  </a>
                }
              />
            )}
            {order.contact_email && (
              <Row
                label="E-mail"
                value={
                  <a
                    href={`mailto:${order.contact_email}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Mail className="size-3.5" /> {order.contact_email}
                  </a>
                }
              />
            )}
            <Row
              label="Mode"
              value={DELIVERY_METHOD_LABELS[order.delivery_method]}
            />
            {order.delivery_city && (
              <Row label="Ville" value={order.delivery_city} />
            )}
          </Section>

          {order.notes && (
            <Section title="Note du client">
              <p className="text-foreground/90 text-sm leading-relaxed">
                {order.notes}
              </p>
            </Section>
          )}

          <Section title="Paiement">
            {order.fabric_price > 0 && (
              <Row label="Tissu" value={formatPrice(order.fabric_price)} />
            )}
            {order.tailoring_price > 0 && (
              <Row label="Confection" value={formatPrice(order.tailoring_price)} />
            )}
            <Row
              label="Livraison"
              value={
                order.delivery_fee > 0
                  ? formatPrice(order.delivery_fee)
                  : order.delivery_method === "home"
                    ? "Offerte"
                    : "Gratuit"
              }
            />
            <div className="bg-border my-2 h-px" />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-primary">
                {formatPrice(order.total_amount)}
              </span>
            </div>
            <Row
              label="Statut"
              value={`${
                order.payment_method
                  ? PAYMENT_METHOD_LABELS[order.payment_method]
                  : "—"
              } · ${PAYMENT_STATUS_LABELS[order.payment_status]}`}
            />
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Le tissu : le point de départ du travail — vignette, matière, mètres. */
function FabricSection({ order }: { order: OrderListItem }) {
  if (order.type === "own_fabric") {
    return (
      <Section title="Tissu">
        <p className="text-muted-foreground text-sm">
          Le client apporte son propre tissu.
        </p>
      </Section>
    );
  }

  const meters =
    order.fabric_meters != null
      ? `${order.fabric_meters.toLocaleString("fr-FR")} m`
      : null;

  return (
    <Section title="Tissu">
      <div className="flex gap-3">
        <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
          {order.fabric?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.fabric.image_url}
              alt=""
              className="size-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {order.fabric?.name && (
            <p className="font-medium">{order.fabric.name}</p>
          )}
          {order.fabric?.material && (
            <p className="text-muted-foreground text-sm">
              {order.fabric.material}
            </p>
          )}
          {order.fabric?.color && (
            <p className="text-muted-foreground text-sm">
              Couleur : {order.fabric.color}
            </p>
          )}
          {meters && (
            <p className="text-sm font-medium">
              Métrage : <span className="text-primary">{meters}</span>
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

/** Le relevé de mesures — ce que lit le tailleur pour couper et coudre. */
function MeasurementSection({
  measurement,
}: {
  measurement?: OrderMeasurement | null;
}) {
  if (!measurement) {
    return (
      <Section title="Mesures">
        <p className="text-muted-foreground text-sm">
          Aucune mesure renseignée pour cette commande.
        </p>
      </Section>
    );
  }

  if (measurement.mode === "standard") {
    return (
      <Section title="Mesures">
        <div className="flex items-center gap-2">
          <Ruler className="text-muted-foreground size-4" />
          <span className="text-sm">
            Taille standard :{" "}
            <span className="font-semibold">
              {measurement.standard_size ?? "—"}
            </span>
          </span>
        </div>
      </Section>
    );
  }

  const values = MEASUREMENT_FIELDS.map((f) => ({
    label: f.label,
    value: measurement[f.key],
  })).filter((m) => m.value != null);

  return (
    <Section title="Mesures sur mesure">
      {values.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Relevé manuel sans cote renseignée.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {values.map((m) => (
            <div
              key={m.label}
              className="flex items-baseline justify-between gap-2 border-b border-dashed pb-1.5"
            >
              <dt className="text-muted-foreground text-sm">{m.label}</dt>
              <dd className="text-sm font-semibold">{m.value} cm</dd>
            </div>
          ))}
        </dl>
      )}
      {measurement.notes && (
        <p className="text-muted-foreground mt-3 text-sm">{measurement.notes}</p>
      )}
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
