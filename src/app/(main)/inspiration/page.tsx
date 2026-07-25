import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Sparkles } from "lucide-react";

import { InspirationCard } from "@/components/inspiration/inspiration-card";
import { DemoBanner } from "@/components/demo-banner";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedInspiration } from "@/lib/inspiration-data";
import { getSessionUser } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inspiration",
  description:
    "Les tenues partagées par la communauté : boubous, robes et ensembles portés au quotidien. Trouvez un tailleur pour vous faire la même.",
};

export default async function InspirationPage() {
  const [posts, user] = await Promise.all([
    getPublishedInspiration(),
    getSessionUser(),
  ]);

  // Publier passe par l'espace client ; un visiteur non connecté y est amené
  // après connexion.
  const shareHref = user
    ? "/compte/inspiration"
    : "/connexion?redirect=/compte/inspiration";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Sparkles className="text-primary size-7" /> Inspiration
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
            Les tenues portées par la communauté — cousues par un tailleur du
            quartier, chinées au marché ou en boutique. Inspirez-vous, et
            faites-vous la même.
          </p>
        </div>
        <Link
          href={shareHref}
          className={cn(buttonVariants(), "shrink-0 gap-2")}
        >
          <Camera className="size-4" /> Partager ma tenue
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Sparkles className="text-muted-foreground mx-auto size-8" />
          <p className="text-muted-foreground mt-3">
            Aucune tenue partagée pour l&apos;instant — soyez le premier.
          </p>
          <Link href={shareHref} className={cn(buttonVariants(), "mt-4 gap-2")}>
            <Camera className="size-4" /> Partager ma tenue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <InspirationCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
