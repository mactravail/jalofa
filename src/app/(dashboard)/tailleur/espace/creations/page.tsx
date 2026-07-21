import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TailorModelsPanel } from "@/components/dashboard/tailor-models-panel";
import {
  getModelCategories,
  getModelSuggestions,
  getTailorModels,
} from "@/lib/data";

export const metadata: Metadata = { title: "Mes créations" };

export default async function TailorModelsPage() {
  const [models, suggestions, categories] = await Promise.all([
    getTailorModels(),
    getModelSuggestions(),
    getModelCategories(),
  ]);

  return (
    <DashboardPage
      title="Mes créations"
      subtitle="Les modèles que vous proposez au catalogue. Les clients qui les choisissent vous sont adressés directement."
    >
      <TailorModelsPanel
        models={models}
        suggestions={suggestions}
        categories={categories}
      />
    </DashboardPage>
  );
}
