import type { Metadata } from "next";

import { DemoBanner } from "@/components/demo-banner";
import { ShoeConfigurator } from "@/components/shoes/shoe-configurator";

export const metadata: Metadata = {
  title: "Personnaliser vos chaussures sur mesure",
  description:
    "Composez vos chaussures homme sur mesure : modèle, cuir et couleur, bout, semelle, doublure, lacets et monogramme. Aperçu et prix en direct.",
};

export default function PersonnaliserChaussuresPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <DemoBanner />
      </div>
      <ShoeConfigurator />
    </>
  );
}
