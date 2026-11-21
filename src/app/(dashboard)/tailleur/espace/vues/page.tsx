import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import {
  ViewPeriodTabs,
  ViewStatsBody,
  ViewStatsMissing,
} from "@/components/views/view-stats-body";
import { DASHBOARD_ROOT } from "@/lib/dashboard-nav";
import { getT } from "@/lib/i18n/server";
import { getMyViewStats, periodStart } from "@/lib/view-stats";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes vues") };
}

// « Mes vues » : combien de personnes ont ouvert la page du tailleur et cliqué
// sur chacun de ses modèles.
export default async function TailorViewsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const { days, since } = periodStart(p);
  const stats = await getMyViewStats(since);

  return (
    <DashboardPage
      title="Mes vues"
      subtitle="Combien de personnes ont ouvert votre page et cliqué sur vos modèles."
    >
      <ViewPeriodTabs base={`${DASHBOARD_ROOT.tailor}/vues`} days={days} />
      {stats ? (
        <ViewStatsBody stats={stats} modelHref={(id) => `/modeles/${id}`} />
      ) : (
        <ViewStatsMissing />
      )}
    </DashboardPage>
  );
}
