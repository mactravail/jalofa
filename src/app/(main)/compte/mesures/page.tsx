import type { Metadata } from "next";

import { MyMeasurementsForm } from "@/components/account/my-measurements-form";
import { getMySavedProfile } from "@/lib/actions/saved-profile";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes mesures") };
}

export default async function MyMeasurementsPage() {
  const [profile, t] = await Promise.all([getMySavedProfile(), getT()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("Mes mesures")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Enregistrez vos mesures une fois pour toutes. À chaque commande, nous vous demanderons si vous voulez les utiliser — ou en donner d'autres, pour quelqu'un d'autre par exemple.")}
        </p>
      </div>
      <MyMeasurementsForm initial={profile?.measurement ?? null} />
    </div>
  );
}
