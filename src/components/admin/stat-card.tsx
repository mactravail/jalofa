import { Card, CardContent } from "@/components/ui/card";
import { TONE, type Tone } from "@/lib/dashboard-tone";
import { cn } from "@/lib/utils";

/** Fond plein en dégradé, pour la tuile phare (`accent`). Écrit en toutes lettres pour Tailwind. */
const SOLID_GRADIENT: Partial<Record<Tone, string>> = {
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950",
  blue: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
  violet: "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white",
  sky: "bg-gradient-to-br from-sky-500 to-blue-600 text-white",
  teal: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
  rose: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
  indigo: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white",
};

/**
 * La tuile chiffrée de l'admin. `tone` lui donne sa teinte (vert = argent,
 * ambre = en attente…) ; `accent` la peint en plein pour le chiffre phare.
 * Sans `tone`, la tuile phare garde la couleur de la marque.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  tone?: Tone;
}) {
  const t = tone ? TONE[tone] : null;
  const solid = accent
    ? (tone && SOLID_GRADIENT[tone]) || "bg-primary text-primary-foreground"
    : null;

  return (
    <Card className={cn(solid && `${solid} border-0 shadow-md`, !solid && t && t.border)}>
      <CardContent className="p-5">
        <p
          className={cn(
            "flex items-center gap-2 text-sm",
            solid ? "opacity-90" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              solid ? "bg-white/20" : t ? t.soft : "bg-muted",
            )}
          >
            <Icon className="size-4" />
          </span>
          {label}
        </p>
        <p
          className={cn(
            "mt-3 text-2xl font-bold tracking-tight sm:text-3xl",
            !solid && t?.text,
          )}
        >
          {value}
        </p>
        {hint && (
          <p className={cn("mt-1 text-xs", solid ? "opacity-80" : "text-muted-foreground")}>
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
