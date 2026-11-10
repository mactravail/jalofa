import type { Metadata } from "next";

import { DemoBanner } from "@/components/demo-banner";
import { FemmeCollection } from "@/components/catalog/femme-collection";
import { HommeCollection } from "@/components/catalog/homme-collection";
import { ModelsCatalog } from "@/components/catalog/models-catalog";
import { getLatestReviews, getModelCategories, getModels } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

type ModelsSearchParams = {
  category?: string;
  q?: string;
  type?: string;
  fabric?: string;
  tailor?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ModelsSearchParams>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const t = await getT();
  if (category === "homme") {
    return {
      title: t("Homme — tenues sur mesure"),
      description: t(
        "Grand boubou, kaftan, costume : un habit coupé pour votre corps, pour la cérémonie, le vendredi ou le bureau.",
      ),
    };
  }
  if (category === "femme") {
    return {
      title: t("Femme — tenues sur mesure"),
      description: t(
        "La robe que vous n'avez vue qu'en rêve, cousue pour vous par un tailleur, à vos mesures.",
      ),
    };
  }
  return {
    title: t("Modèles"),
    description: t("Des centaines de modèles : boubou, kaftan, robe, ensemble et plus."),
  };
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<ModelsSearchParams>;
}) {
  const { category, q, type, fabric, tailor } = await searchParams;
  const [models, categories] = await Promise.all([
    getModels({ category }),
    getModelCategories(),
  ]);

  // The configurator sends people here when they started an order without
  // choosing a garment. Keep what they had already picked so the detail page can
  // hand it straight back.
  const context = new URLSearchParams();
  if (type) context.set("type", type);
  if (fabric) context.set("fabric", fabric);
  if (tailor) context.set("tailor", tailor);
  const contextQuery = context.toString();

  // Les collections Homme et Femme ont leur propre vitrine. Une recherche (`q`)
  // reste sur la grille simple, seule à savoir afficher des résultats filtrés.
  if (category === "homme" && !q) {
    return (
      <>
        <DemoBanner />
        <HommeCollection
          models={models}
          context={contextQuery}
          reviews={await getLatestReviews()}
        />
      </>
    );
  }

  if (category === "femme" && !q) {
    return (
      <>
        <DemoBanner />
        <FemmeCollection
          models={models}
          context={contextQuery}
          reviews={await getLatestReviews()}
        />
      </>
    );
  }

  // Tout le reste (catalogue complet, autre catégorie, recherche) : la grille
  // « collection » filtre et trie côté client, sur tout le catalogue.
  const allModels = category ? await getModels() : models;

  return (
    <>
      <DemoBanner />
      <ModelsCatalog
        models={allModels}
        categories={categories}
        initialCategory={category}
        initialQuery={q}
        context={contextQuery}
      />
    </>
  );
}
