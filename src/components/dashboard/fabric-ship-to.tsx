import { MapPin, Phone, Store } from "lucide-react";

import type { OrderListItem } from "@/lib/orders-data";
import { T } from "@/components/i18n/t";

/**
 * Pour le vendeur : où envoyer le tissu d'une commande complète. L'adresse vient
 * de `tailor_ateliers`, lisible seulement une fois la commande payée.
 */
export function FabricShipTo({ order }: { order: OrderListItem }) {
  const atelier = order.tailor?.atelier ?? null;

  return (
    <div className="bg-muted/50 rounded-lg border p-3 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <Store className="size-4 shrink-0" />
        <T vars={{ name: order.tailor?.shop_name ?? "—" }}>{"À envoyer à l'atelier de {name}"}</T>
      </p>
      {atelier ? (
        <>
          <p className="mt-1.5 flex items-start gap-2">
            <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">{atelier.address}</span>
          </p>
          <a
            href={`tel:${atelier.phone}`}
            className="mt-1.5 flex items-center gap-2 font-medium hover:underline"
          >
            <Phone className="text-muted-foreground size-4 shrink-0" />
            {atelier.phone}
          </a>
        </>
      ) : (
        <p className="text-muted-foreground mt-1.5">
          <T>{"Le tailleur n'a pas encore indiqué son adresse."}</T>
        </p>
      )}
    </div>
  );
}

/** Pour le tailleur : qui envoie le tissu. */
export function FabricComesFrom({ order }: { order: OrderListItem }) {
  return (
    <p className="text-muted-foreground text-sm">
      <T vars={{ name: order.vendor?.shop_name ?? "—" }}>{"Tissu envoyé par {name}"}</T>
    </p>
  );
}
