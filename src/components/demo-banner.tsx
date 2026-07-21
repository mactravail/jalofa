import { Info } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/queries";

/**
 * Shown while the Supabase project is not yet connected, to make clear the
 * catalog is populated with local demo data.
 */
export function DemoBanner() {
  if (isSupabaseConfigured()) return null;
  return (
    <div className="border-primary/30 bg-primary/5 text-muted-foreground mb-6 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
      <Info className="text-primary mt-0.5 size-4 shrink-0" />
      <span>
        Mode démonstration — données locales d&apos;exemple. La base de données
        Supabase sera connectée prochainement.
      </span>
    </div>
  );
}
