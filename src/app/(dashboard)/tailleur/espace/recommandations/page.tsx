import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TailorCareTipsForm } from "@/components/dashboard/tailor-care-tips-form";
import { TailorModelSettingsList } from "@/components/dashboard/tailor-model-settings-list";
import { getMyBodyFits, getMyCareTips, getTailorModels } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes recommandations") };
}

export default async function TailorCareTipsPage() {
  const t = await getT();
  const [{ tips, modelCount }, models, bodyFits] = await Promise.all([
    getMyCareTips(),
    getTailorModels(),
    getMyBodyFits(),
  ]);

  return (
    <DashboardPage
      title="Mes recommandations"
      subtitle="Les détails de vos modèles : délai, devis, style, et vos conseils de lavage."
    >
      <div className="space-y-8">
        {models.length > 0 && <TailorModelSettingsList models={models} bodyFits={bodyFits} />}

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">{t("Lavage et entretien")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("Écrites une fois, elles s'affichent sur tous vos modèles.")}
            </p>
          </div>
          <TailorCareTipsForm tips={tips} modelCount={modelCount} />
        </section>
      </div>
    </DashboardPage>
  );
}
