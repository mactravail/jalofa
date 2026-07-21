import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * La tuile chiffrée de la vue d'ensemble. `accent` la peint aux couleurs de la
 * marque pour le chiffre phare (le volume d'affaires) ; les autres restent
 * sobres.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && "bg-primary text-primary-foreground border-0")}>
      <CardContent className="p-5">
        <p
          className={cn(
            "flex items-center gap-2 text-sm",
            accent ? "opacity-90" : "text-muted-foreground",
          )}
        >
          <Icon className="size-4" /> {label}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        {hint && (
          <p className={cn("mt-1 text-xs", accent ? "opacity-80" : "text-muted-foreground")}>
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
