"use client";

import { MapPin, Phone, ShoppingBag, UsersRound } from "lucide-react";

import { usePipeline } from "@/components/dashboard/pipeline-store";
import { groupClients, initialsOf, type ClientSummary } from "@/lib/clients";
import { formatPrice, formatReceivedAt } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import { TONE, type Tone } from "@/lib/dashboard-tone";
import { cn } from "@/lib/utils";

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

/**
 * La grille « Mes clients » — reconstruite à partir des commandes du pipeline
 * partagé. Composant client (il lit le pipeline) ; le titre et le bandeau démo
 * viennent de la page serveur qui l'enveloppe, pour ne pas tirer de code serveur
 * dans le paquet du navigateur.
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
        <p className="mt-4 font-semibold">Pas encore de client</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
          Dès qu&apos;une personne commande, elle apparaît ici avec tout ce
          qu&apos;elle vous a commandé.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {clients.map((client, i) => (
        <li key={client.id}>
          <ClientCard client={client} tone={AVATAR_TONES[i % AVATAR_TONES.length]} />
        </li>
      ))}
    </ul>
  );
}

function ClientCard({ client, tone }: { client: ClientSummary; tone: Tone }) {
  const t = TONE[tone];
  return (
    <div className="bg-card flex h-full flex-col gap-4 rounded-2xl border p-4">
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
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1">
              <ShoppingBag className="size-3.5" />
              {client.orders} commande{client.orders > 1 ? "s" : ""}
            </span>
            {client.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {client.city}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">Vous a rapporté</p>
          <p className={cn("text-lg font-bold", t.text)}>
            {formatPrice(client.spent)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs" suppressHydrationWarning>
            Dernière commande {formatReceivedAt(client.lastOrderAt)}
          </p>
        </div>

        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95",
              t.solid,
            )}
          >
            <Phone className="size-4" /> Appeler
          </a>
        )}
      </div>
    </div>
  );
}
