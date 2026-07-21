import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Affiche une note sur 5 en étoiles pleines/vides. Purement décoratif. */
export function ReviewStars({
  value,
  className,
  size = "size-4",
}: {
  value: number;
  className?: string;
  size?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`Note ${value} sur 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}
