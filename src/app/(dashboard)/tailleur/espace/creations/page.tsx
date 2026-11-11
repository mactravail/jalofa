import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TailorModelsPanel } from "@/components/dashboard/tailor-models-panel";
import {
  getFabricCategories,
  getModelCategories,
  getModelSuggestions,
  getMyAtelier,
  getMyModelFabricLinks,
  getTailorModels,
  getCurrentTailor,
  getVendorFabrics,
} from "@/lib/data";
import { isEuropeCountry } from "@/lib/europe";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes modèles") };
}

export default async function TailorModelsPage() {
  const [models, suggestions, categories, fabrics, fabricCategories, fabricLinks, atelier, tailor] =
    await Promise.all([
      getTailorModels(),
      getModelSuggestions(),
      getModelCategories(),
      getVendorFabrics(),
      getFabricCategories(),
      getMyModelFabricLinks(),
      getMyAtelier(),
      getCurrentTailor(),
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
        fabrics={fabrics}
        fabricCategories={fabricCategories}
        fabricLinks={fabricLinks}
        atelier={atelier}
        europe={isEuropeCountry(tailor?.country)}
      />
    </DashboardPage>
  );
}
