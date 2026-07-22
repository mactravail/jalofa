import type { Metadata } from "next";

import { DemoBanner } from "@/components/demo-banner";
import { BoubouConfigurator } from "@/components/men/boubou-configurator";
import { getFabrics, getModelBySlug } from "@/lib/data";

export const metadata: Metadata = {
  title: "Personnaliser votre grand boubou sur mesure",
  description:
    "Composez votre grand boubou en trois pièces : le boubou, le kaftan intérieur et le pantalon. Tissu, type de couture, broderie, col et finitions. Aperçu et prix en direct.",
};

/**
 * The one garment this page personalises. Reaching it means "Grand boubou" has
 * already been chosen, so nothing else is loaded — no robe, no jupe, no other
 * silhouette to drift onto mid-flow.
 */
const BOUBOU_SLUG = "grand-boubou";

export default async function PersonnaliserGrandBoubouPage() {
  const [fabrics, model] = await Promise.all([
    getFabrics(),
    getModelBySlug(BOUBOU_SLUG),
  ]);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <DemoBanner />
      </div>
      <BoubouConfigurator fabrics={fabrics} model={model} />
    </>
  );
}
