"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Compte les visites du site pour l'admin (« Statistiques »).
 *
 * À chaque page ouverte : un signal « view ». Quand le visiteur la quitte (autre
 * page, onglet fermé, téléphone verrouillé) : le temps passé dessus, écran
 * allumé seulement. La dernière page d'une visite = celle où il s'est arrêté.
 *
 * Rien de personnel : un identifiant aléatoire dans le navigateur, pas de
 * cookie, pas de nom. L'admin et les espaces pros ne sont pas comptés.
 */

const VISITOR_KEY = "jalofa-vid";
const SESSION_KEY = "jalofa-sid";
const OPT_OUT_KEY = "jalofa-no-track";

function storedId(storage: Storage, key: string): string {
  let id = storage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }
  return id;
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch {
    /* on retombe sur fetch */
  }
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

function isPrivateArea(path: string): boolean {
  const p = path.replace(/^\/it(?=\/|$)/, "") || "/";
  return (
    p.startsWith("/admin") ||
    p.startsWith("/tailleur/espace") ||
    p.startsWith("/vendeur/espace")
  );
}

export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    if (!pathname) return;

    let ids: { vid: string; sid: string };
    try {
      // L'administrateur ne fausse pas ses propres chiffres : une visite de
      // l'admin suffit pour que ce navigateur ne soit plus jamais compté.
      if (pathname.replace(/^\/it(?=\/|$)/, "").startsWith("/admin")) {
        localStorage.setItem(OPT_OUT_KEY, "1");
      }
      if (localStorage.getItem(OPT_OUT_KEY)) return;
      ids = {
        vid: storedId(localStorage, VISITOR_KEY),
        sid: storedId(sessionStorage, SESSION_KEY),
      };
    } catch {
      return; // stockage bloqué (navigation privée stricte) : on ne compte pas
    }
    if (isPrivateArea(pathname)) return;

    // Seul `category` change vraiment la page (Homme / Femme…).
    const query = category ? `category=${encodeURIComponent(category)}` : "";
    const id = crypto.randomUUID();

    send({
      t: "view",
      id,
      ...ids,
      path: query ? `${pathname}?${query}` : pathname,
      ref: document.referrer,
    });

    // Temps passé, écran visible uniquement.
    let visibleMs = 0;
    let since: number | null = document.visibilityState === "visible" ? Date.now() : null;
    const total = () => visibleMs + (since ? Date.now() - since : 0);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (since) visibleMs += Date.now() - since;
        since = null;
        // Le téléphone peut ne jamais revenir : on envoie déjà le temps.
        send({ t: "leave", id, ms: visibleMs });
      } else {
        since = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      send({ t: "leave", id, ms: total() });
    };
  }, [pathname, category]);

  return null;
}
