import Link from "@/components/i18n/link";
import { ChevronRight, Eye, Shirt, Store } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { StatCard } from "@/components/admin/stat-card";
import { ViewPeriodTabs, ViewStatsMissing } from "@/components/views/view-stats-body";
import { getTailorsViewRanking } from "@/lib/admin-data";
import { periodStart } from "@/lib/view-stats";

// « Vues des tailleurs » : chaque tailleur, du plus vu au moins vu — page
// publique ouverte et clics sur ses modèles. Un toucher ouvre le détail.
export default async function AdminTailorViewsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const { days, since } = periodStart(p);
  const ranking = await getTailorsViewRanking(since);

  return (
    <AdminPage
      title="Vues des tailleurs"
      subtitle="Combien de personnes ont ouvert la page de chaque tailleur et cliqué sur ses modèles. Vos propres visites ne sont pas comptées."
    >
      <ViewPeriodTabs base="/admin/vues" days={days} />
      {!ranking ? (
        <ViewStatsMissing />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={Store}
              label="Pages de tailleurs ouvertes"
              value={String(ranking.reduce((s, r) => s + r.page_views, 0))}
              accent
              tone="blue"
            />
            <StatCard
              icon={Shirt}
              label="Clics sur des modèles de tailleurs"
              value={String(ranking.reduce((s, r) => s + r.model_views, 0))}
              accent
              tone="violet"
            />
          </div>

          {ranking.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              Aucun tailleur.
            </p>
          ) : (
            <div className="divide-y rounded-xl border">
              <div className="text-muted-foreground hidden gap-4 px-4 py-2 text-xs sm:flex">
                <span className="flex-1">Tailleur</span>
                <span className="w-32 text-right">Page ouverte</span>
                <span className="w-32 text-right">Clics modèles</span>
                <span className="w-4" />
              </div>
              {ranking.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/vues/${r.id}?p=${days}`}
                  className="hover:bg-muted/50 flex items-center gap-4 px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.shop_name}</span>
                    {r.city && (
                      <span className="text-muted-foreground block truncate text-xs">{r.city}</span>
                    )}
                    <span className="text-muted-foreground mt-1 flex gap-3 text-xs sm:hidden">
                      <span>Page : {r.page_visitors} pers.</span>
                      <span>Modèles : {r.model_visitors} pers.</span>
                    </span>
                  </span>
                  <span className="hidden w-32 text-right sm:block">
                    <span className="flex items-center justify-end gap-1 font-semibold tabular-nums">
                      <Eye className="size-4" /> {r.page_visitors}
                    </span>
                    <span className="text-muted-foreground block text-xs tabular-nums">
                      {r.page_views} fois
                    </span>
                  </span>
                  <span className="hidden w-32 text-right sm:block">
                    <span className="flex items-center justify-end gap-1 font-semibold tabular-nums">
                      <Eye className="size-4" /> {r.model_visitors}
                    </span>
                    <span className="text-muted-foreground block text-xs tabular-nums">
                      {r.model_views} clic{r.model_views > 1 ? "s" : ""}
                    </span>
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              ))}
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            Le grand chiffre = des personnes différentes ; en dessous, le nombre total d&apos;ouvertures.
          </p>
        </div>
      )}
    </AdminPage>
  );
}
