import type { Metadata } from "next";

import { DemoBanner } from "@/components/demo-banner";
import { DressConfigurator } from "@/components/women/dress-configurator";
import { getFabrics, getModels } from "@/lib/data";

export const metadata: Metadata = {
  title: "Personnaliser votre robe sur mesure",
  description:
    "Composez votre robe femme sur mesure : tissu, encolure, manches, silhouette, longueur et finitions. Aperçu et prix en direct.",
};

// Base dress silhouettes offered as the preview canvas (women's dresses only).
const DRESS_MODEL_IDS = ["demo-robe", "demo-boubou-femme"];

export default async function PersonnaliserRobePage() {
  const [fabrics, femmeModels] = await Promise.all([
    getFabrics(),
    getModels({ category: "femme" }),
  ]);

  const models = femmeModels.filter((m) => DRESS_MODEL_IDS.includes(m.id));

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <DemoBanner />
      </div>
      <DressConfigurator fabrics={fabrics} models={models} />
    </>
  );
}
