import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TailorModelsPanel } from "@/components/dashboard/tailor-models-panel";
import {
  getModelCategories,
  getModelSuggestions,
  getMyAtelier,
  getMyBodyFits,
  getTailorModels,
  getCurrentTailor,
} from "@/lib/data";
import { isEuropeCountry } from "@/lib/europe";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes modèles") };
}

export default async function TailorModelsPage() {
  const [models, suggestions, categories, atelier, tailor, bodyFits] = await Promise.all([
    getTailorModels(),
    getModelSuggestions(),
    getModelCategories(),
    getMyAtelier(),
    getCurrentTailor(),
    getMyBodyFits(),
  ]);

  return (
    <DashboardPage
      title="Mes modèles"
      subtitle="Les modèles que vous vendez."
    >
      <TailorModelsPanel
        models={models}
        suggestions={suggestions}
        categories={categories}
        atelier={atelier}
        bodyFits={bodyFits}
        europe={isEuropeCountry(tailor?.country)}
      />
    </DashboardPage>
  );
}
