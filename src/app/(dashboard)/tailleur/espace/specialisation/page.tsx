import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import {
  TailorSkillsForm,
  type SkillOption,
} from "@/components/dashboard/tailor-skills-form";
import { skillKey } from "@/lib/catalog-link";
import { getCurrentTailor, getModelSuggestions } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Spécialisation") };
}

// « Spécialisation » : homme, femme ou les deux, et les habits qu'il sait
// coudre. Même sans modèle publié, le client les voit sur sa page publique.
export default async function TailorSkillsPage() {
  const [tailor, catalog] = await Promise.all([getCurrentTailor(), getModelSuggestions()]);

  const options: SkillOption[] = catalog.map((m) => ({
    key: skillKey(m),
    name: m.name,
    image: m.photos[0] ?? m.image_url,
    category: m.category_slug,
  }));

  return (
    <DashboardPage
      title="Spécialisation"
      subtitle="Homme, femme ou les deux : dites ce que vous savez coudre. Les clients le voient sur votre page."
    >
      <TailorSkillsForm
        options={options}
        specialty={tailor?.specialty ?? null}
        skills={tailor?.skills ?? []}
        customSkills={tailor?.custom_skills ?? []}
      />
    </DashboardPage>
  );
}
