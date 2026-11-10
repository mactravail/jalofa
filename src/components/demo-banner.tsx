import { Info } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/queries";
import { getT } from "@/lib/i18n/server";

/**
 * Shown while the Supabase project is not yet connected, to make clear the
 * catalog is populated with local demo data.
 */
export async function DemoBanner() {
  if (isSupabaseConfigured()) return null;
  const t = await getT();
  return (
    <div className="border-primary/30 bg-primary/5 text-muted-foreground mb-6 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
      <Info className="text-primary mt-0.5 size-4 shrink-0" />
      <span>
        {t("Mode démonstration — données locales d'exemple. La base de données Supabase sera connectée prochainement.")}
      </span>
    </div>
  );
}
