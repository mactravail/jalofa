"use client";

import { useState, useTransition } from "react";
import { Check, Layers, Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";

import { T } from "@/components/i18n/t";
import { setProVisibility, type ProVisibility } from "@/lib/actions/visibility";
import { translateNow } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

const CHOICES: {
  id: Exclude<ProVisibility, "none">;
  title: string;
  icons: React.ComponentType<{ className?: string }>[];
  tone: string;
}[] = [
  {
    id: "tailor",
    title: "Tailleur",
    icons: [Scissors],
    tone: "bg-rose-500",
  },
  {
    id: "vendor",
    title: "Vendeur de tissus",
    icons: [Layers],
    tone: "bg-fuchsia-500",
  },
  {
    id: "both",
    title: "Les deux",
    icons: [Scissors, Layers],
    tone: "bg-violet-500",
  },
];

/**
 * « Je suis » : Tailleur, Vendeur de tissus ou Les deux — rien d'autre. Un
 * toucher suffit, le choix est enregistré tout de suite.
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
            <span className="flex shrink-0 -space-x-1.5">
              {c.icons.map((Icon, i) => (
                <span
                  key={i}
                  className={cn(
                    "border-card flex size-8 items-center justify-center rounded-full border-2 text-white",
                    c.tone,
                  )}
                >
                  <Icon className="size-4" />
                </span>
              ))}
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
