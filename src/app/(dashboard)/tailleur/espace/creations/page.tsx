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
  getVendorFabrics,
} from "@/lib/data";

export const metadata: Metadata = { title: "Mes modèles" };

export default async function TailorModelsPage() {
  const [models, suggestions, categories, fabrics, fabricCategories, fabricLinks, atelier] =
    await Promise.all([
      getTailorModels(),
      getModelSuggestions(),
      getModelCategories(),
      getVendorFabrics(),
      getFabricCategories(),
      getMyModelFabricLinks(),
      getMyAtelier(),
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
      />
    </DashboardPage>
  );
}
