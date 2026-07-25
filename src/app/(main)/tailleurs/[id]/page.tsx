import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Scissors, Star, Truck } from "lucide-react";

import { CertifiedBadge } from "@/components/admin/status-badges";
import { DemoBanner } from "@/components/demo-banner";
import { ModelCard } from "@/components/catalog/model-card";
import { ReviewList } from "@/components/catalog/review-list";
import { ReviewStars } from "@/components/catalog/review-stars";
import { TailorReviewForm } from "@/components/catalog/tailor-review-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/constants";
import { getModelsByTailor, getTailorById, getTailorReviews } from "@/lib/data";
import { cn } from "@/lib/utils";

export default async function TailorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tailor = await getTailorById(id);
  // Un tailleur suspendu par la plateforme n'a plus de fiche publique.
  if (!tailor || tailor.is_suspended) notFound();

  const [reviews, models] = await Promise.all([
    getTailorReviews(id),
    getModelsByTailor(id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <DemoBanner />
      <Link
        href="/tailleurs"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour aux tailleurs
      </Link>

      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="bg-muted ring-background relative size-28 shrink-0 overflow-hidden rounded-full border shadow-sm ring-4 sm:size-36">
          {tailor.cover_url ? (
            <Image
              src={tailor.cover_url}
              alt={tailor.shop_name ?? "Tailleur"}
              fill
              sizes="144px"
              className="object-cover"
              preload
            />
          ) : (
            <span className="text-muted-foreground flex size-full items-center justify-center">
              <Scissors className="size-10" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
          <div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-3xl font-bold tracking-tight">
                {tailor.shop_name}
              </h1>
              {tailor.is_certified && <CertifiedBadge />}
            </div>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-3 text-sm sm:justify-start">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="text-foreground font-medium">
                  {tailor.rating.toFixed(1)}
                </span>
                ({tailor.rating_count} avis)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {tailor.city}
              </span>
              {tailor.free_delivery && (
                <span className="text-primary flex items-center gap-1 font-medium">
                  <Truck className="size-4" /> Livraison offerte
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/modeles?tailor=${tailor.id}`}
            className={cn(buttonVariants({ size: "lg" }), "h-11 text-base")}
          >
            <Scissors className="size-4" /> Commander chez ce tailleur
          </Link>
        </div>
      </div>

      {tailor.bio && (
        <p className="text-muted-foreground mt-6 text-center sm:text-left">
          {tailor.bio}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Scissors className="size-5" />
            </span>
            <div>
              <p className="text-muted-foreground text-xs">Prix de confection dès</p>
              <p className="font-semibold">{formatPrice(tailor.base_price)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-muted-foreground text-xs">Délai moyen</p>
              <p className="font-semibold">{tailor.avg_delivery_days} jours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section id="creations" className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Créations de l&apos;atelier
              <span className="text-muted-foreground ml-2 text-base font-normal">
                ({models.length})
              </span>
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Les modèles proposés par ce tailleur. Choisissez-en un pour le
              commander directement chez lui.
            </p>
          </div>
        </div>

        {models.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground text-sm">
              Ce tailleur n&apos;a pas encore publié de modèle. Vous pouvez tout
              de même lui confier une commande sur mesure.
            </p>
            <Link
              href={`/modeles?tailor=${tailor.id}`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              <Scissors className="size-4" /> Commander sur mesure
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </section>

      <section id="avis" className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            Avis clients
            <span className="text-muted-foreground ml-2 text-base font-normal">
              ({tailor.rating_count})
            </span>
          </h2>
          <span className="flex items-center gap-1.5 text-sm">
            <ReviewStars value={tailor.rating} />
            <span className="font-medium">{tailor.rating.toFixed(1)}</span>
          </span>
        </div>

        {reviews.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Aucun avis pour le moment. Soyez le premier à partager votre
            expérience.
          </p>
        ) : (
          <ReviewList reviews={reviews} />
        )}

        <div className="mt-6">
          <TailorReviewForm tailorId={tailor.id} />
        </div>
      </section>
    </div>
  );
}
