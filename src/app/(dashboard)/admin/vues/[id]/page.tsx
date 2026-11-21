import Link from "@/components/i18n/link";
import { ArrowLeft } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import {
  ViewPeriodTabs,
  ViewStatsBody,
  ViewStatsMissing,
} from "@/components/views/view-stats-body";
import { getTailorViewStatsAdmin } from "@/lib/admin-data";
import { getTailorById } from "@/lib/data";
import { periodStart } from "@/lib/view-stats";

// Le détail des vues d'un tailleur, tel qu'il le voit dans « Mes vues ».
export default async function AdminTailorViewsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const [{ id }, { p }] = await Promise.all([params, searchParams]);
  const { days, since } = periodStart(p);
  const [tailor, stats] = await Promise.all([
    getTailorById(id),
    getTailorViewStatsAdmin(id, since),
  ]);

  return (
    <AdminPage
      title={tailor?.shop_name || "Tailleur"}
      subtitle="Les mêmes chiffres que ceux du tailleur dans « Mes vues »."
    >
      <Link
        href={`/admin/vues?p=${days}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Tous les tailleurs
      </Link>
      <ViewPeriodTabs base={`/admin/vues/${id}`} days={days} />
      {stats ? (
        <ViewStatsBody stats={stats} modelHref={(m) => `/modeles/${m}`} />
      ) : (
        <ViewStatsMissing />
      )}
      <p className="mt-6 text-sm">
        <Link href={`/tailleurs/${id}`} className="underline">
          Voir sa page publique
        </Link>
      </p>
    </AdminPage>
  );
}
