"use client";

import { useState, useTransition } from "react";
import { Check, EyeOff, Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";

import { T } from "@/components/i18n/t";
import { setProVisibility, type ProVisibility } from "@/lib/actions/visibility";
import { translateNow } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

const CHOICES: {
  id: ProVisibility;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  {
    id: "tailor",
    title: "Visible : les clients me trouvent",
    icon: Scissors,
    tone: "bg-rose-500",
  },
  {
    id: "none",
    title: "Caché pour l'instant",
    icon: EyeOff,
    tone: "bg-zinc-500",
  },
];

/**
 * « Ma visibilité » : le tailleur apparaît dans l'annuaire /tailleurs, ou reste
 * caché le temps de compléter sa fiche. Un toucher suffit, le choix est
 * enregistré tout de suite.
 */
export function VisibilityChooser({ initial }: { initial: ProVisibility }) {
  const [current, setCurrent] = useState<ProVisibility>(initial);
  const [pending, setPending] = useState<ProVisibility | null>(null);
  const [, startTransition] = useTransition();

  function choose(next: ProVisibility) {
    if (next === current || pending) return;
    setPending(next);
    startTransition(async () => {
      const res = await setProVisibility(next);
      setPending(null);
      if (res.ok) {
        setCurrent(next);
        toast.success(
          translateNow(next === "none" ? "Votre boutique est masquée." : "C'est enregistré."),
        );
      } else {
        toast.error(translateNow(res.error));
      }
    });
  }

  return (
    <div className="max-w-xl space-y-2">
      {CHOICES.map((c) => {
        const selected = current === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => choose(c.id)}
            disabled={pending !== null}
            aria-pressed={selected}
            className={cn(
              "bg-card flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition",
              selected ? "border-primary" : "border-border hover:border-muted-foreground/40",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-white",
                c.tone,
              )}
            >
              <c.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold">
              <T>{c.title}</T>
            </span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {pending === c.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                selected && <Check className="size-3" />
              )}
            </span>
          </button>
        );
      })}

    </div>
  );
}
