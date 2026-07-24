import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Bandeau « devenez pro » posé au bas des pages publiques Tailleurs / Vendeurs.
 * C'est ici que vivent les offres pros — les clients ne les croisent plus par
 * accident dans le tunnel de création de compte.
 */
export function ProJoinCta({
  metier,
}: {
  metier: "tailor" | "vendor";
}) {
  const isTailor = metier === "tailor";

  return (
    <section className="bg-muted/40 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight">
            {isTailor
              ? "Vous êtes tailleur ?"
              : "Vous vendez du tissu ?"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isTailor
              ? "Recevez des commandes sur mesure, gérez votre atelier et développez votre clientèle sur JALOFA. Démarrez gratuitement."
              : "Ouvrez votre boutique de tissus en ligne et vendez à toute la communauté JALOFA. Démarrez gratuitement."}
          </p>
        </div>
        <Link
          href={`/abonnements?metier=${metier}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "shrink-0 gap-1.5",
          )}
        >
          {isTailor ? "Devenir tailleur" : "Vendre mes tissus"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
