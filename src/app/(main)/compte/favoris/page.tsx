import { Heart } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function FavoritesPage() {
  const t = await getT();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("Favoris")}</h1>
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Heart className="text-muted-foreground mx-auto size-8" />
        <p className="text-muted-foreground mt-3">
          {t("Retrouvez ici vos tailleurs et tissus favoris.")}
        </p>
      </div>
    </div>
  );
}
