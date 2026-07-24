"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Bell, Sparkles } from "lucide-react";

import { useBucket } from "@/components/dashboard/pipeline-store";
import { TONE } from "@/lib/dashboard-tone";
import { cn } from "@/lib/utils";

const DATE_FR = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function greetingFor(hour: number): string {
  if (hour < 5) return "Bonne nuit";
  if (hour < 18) return "Bonjour";
  return "Bonsoir";
}

/**
 * La carte de bienvenue de l'espace pro : « Bonjour {Prénom} », la date en
 * toutes lettres, et une phrase qui dit tout de suite ce qui compte — combien
 * de nouvelles commandes attendent. La couleur suit l'humeur : chaude et vive
 * quand il y a du travail, calme et verte quand tout est fait.
 */
export function OverviewHero({ firstName }: { firstName: string | null }) {
  const todo = useBucket("todo");
  const count = todo.length;

  // L'heure (donc « Bonjour » vs « Bonsoir » et la date) dépend de l'horloge du
  // lecteur : on rend un premier jet neutre au serveur, puis on cale sur l'heure
  // locale au montage pour éviter tout écart d'hydratation.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  const hello = now ? greetingFor(now.getHours()) : "Bonjour";
  const today = now ? DATE_FR.format(now) : "";

  const hasWork = count > 0;
  const tone = hasWork ? TONE.amber : TONE.emerald;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 sm:p-6",
        tone.tint,
        tone.border,
      )}
    >
      <div className="relative flex items-start gap-4">
        <span
          className={cn(
            "hidden size-14 shrink-0 items-center justify-center rounded-2xl sm:flex",
            tone.solid,
          )}
        >
          {hasWork ? <Bell className="size-7" /> : <Sparkles className="size-7" />}
        </span>

        <div className="min-w-0 flex-1">
          {today && (
            <p className="text-xs font-medium capitalize opacity-70">{today}</p>
          )}
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {hello}
            {firstName ? ` ${firstName}` : ""} 👋
          </h1>

          {hasWork ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium sm:text-base">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold",
                  tone.solid,
                )}
              >
                {count}
              </span>
              {count > 1
                ? "nouvelles commandes vous attendent"
                : "nouvelle commande vous attend"}
              <ArrowDown className="size-4 animate-bounce opacity-70" />
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium opacity-90 sm:text-base">
              Tout est à jour, bravo. Aucune commande n&apos;attend.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
