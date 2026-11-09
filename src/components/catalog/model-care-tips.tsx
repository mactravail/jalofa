import { Lightbulb } from "lucide-react";

import { careTipLines } from "@/lib/model-style";

/** Les recommandations du tailleur : lavage, entretien, choses à éviter. */
export function ModelCareTips({
  tips,
  className,
}: {
  tips: string | null | undefined;
  className?: string;
}) {
  const lines = careTipLines(tips);
  if (lines.length === 0) return null;

  return (
    <section className={className}>
      <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <Lightbulb className="text-primary size-4 shrink-0" />
        Les conseils du tailleur
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {lines.map((line, i) => (
          <li key={`${i}-${line}`} className="flex gap-2">
            <span aria-hidden className="text-muted-foreground">
              •
            </span>
            <span className="min-w-0">{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
