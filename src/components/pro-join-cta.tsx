import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

/**
 * Bandeau « devenez pro » posé au bas des pages publiques Tailleurs / Vendeurs.
 * C'est ici que vivent les offres pros — les clients ne les croisent plus par
 * accident dans le tunnel de création de compte.
 */
export async function ProJoinCta({
  metier,
}: {
  metier: "tailor" | "vendor";
}) {
  const isTailor = metier === "tailor";
  const t = await getT();

  return (
    <section className="bg-muted/40 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight">
            {isTailor ? t("Vous êtes tailleur ?") : t("Vous vendez du tissu ?")}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isTailor
              ? t("Recevez des commandes sur mesure, gérez votre atelier et développez votre clientèle sur JALOFA. Démarrez gratuitement.")
              : t("Ouvrez votre boutique de tissus en ligne et vendez à toute la communauté JALOFA. Démarrez gratuitement.")}
          </p>
        </div>
        <Link
          href="/inscription?role=pro"
          className={cn(
            buttonVariants({ size: "lg" }),
            "shrink-0 gap-1.5",
          )}
        >
          {isTailor ? t("Devenir tailleur") : t("Vendre mes tissus")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
