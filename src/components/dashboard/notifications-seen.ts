"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// « Lu / non lu » de la cloche du tailleur
//
// La pastille rouge = ce qu'il n'a pas encore vu : ses notifications non lues
// (colonne `is_read`, effacée côté serveur à l'ouverture de la page) + les
// nouvelles commandes tombées depuis sa dernière visite de « Notifications ».
// Les commandes n'ont pas de ligne de notification en base : on retient donc
// l'heure de la dernière visite sur l'appareil.
// ---------------------------------------------------------------------------

const SEEN_KEY = "jalofa.tailor.notifications.seen";
const SEEN_EVENT = "jalofa:notifications-seen";

export function readSeen(): number {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Le tailleur vient d'ouvrir ses notifications : tout est vu. */
export function markNotificationsSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    // Stockage indisponible : la pastille retombe quand même pour cette visite.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/**
 * L'heure de la dernière visite : 0 = jamais, `null` = pas encore lue (premier
 * rendu, avant le montage — on ne compte alors aucune commande, pour ne pas
 * faire clignoter la pastille).
 */
export function useNotificationsSeenAt(): number | null {
  const [seenAt, setSeenAt] = useState<number | null>(null);
  useEffect(() => {
    const sync = () => setSeenAt(readSeen());
    sync();
    window.addEventListener(SEEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SEEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return seenAt;
}

/**
 * Le nombre affiché sur la cloche. `unread` vient du serveur (notifications non
 * lues) ; `orderDates` = dates d'arrivée des nouvelles commandes.
 */
export function useUnreadCount(unread: number, orderDates: string[]): number {
  const seenAt = useNotificationsSeenAt();
  // Le compteur serveur date du chargement : une fois la page ouverte, il est
  // périmé tant que le layout n'est pas rechargé — on le met à zéro ici.
  const [clearedAt, setClearedAt] = useState(0);
  const [baseline, setBaseline] = useState(unread);
  if (baseline !== unread) {
    setBaseline(unread);
    setClearedAt(0);
  }
  useEffect(() => {
    const clear = () => setClearedAt(Date.now());
    window.addEventListener(SEEN_EVENT, clear);
    return () => window.removeEventListener(SEEN_EVENT, clear);
  }, []);

  const freshOrders =
    seenAt === null ? 0 : orderDates.filter((d) => Date.parse(d) > seenAt).length;
  return (clearedAt ? 0 : unread) + freshOrders;
}
