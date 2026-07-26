import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, MapPin, Star, Store, Truck } from "lucide-react";

import {
  CertifiedBadge,
  FoundingMemberBadge,
} from "@/components/admin/status-badges";
import { DemoBanner } from "@/components/demo-banner";
import { FabricCard } from "@/components/catalog/fabric-card";
import { ReviewList } from "@/components/catalog/review-list";
import { ReviewStars } from "@/components/catalog/review-stars";
import { TrustScorePanel } from "@/components/catalog/trust-score";
import { VendorReviewForm } from "@/components/catalog/vendor-review-form";
import { getFabricsByVendor, getVendorById, getVendorReviews } from "@/lib/data";

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendorById(id);
  // Une boutique suspendue par la plateforme n'a plus de fiche publique.
  if (!vendor || vendor.is_suspended) notFound();

  const [fabrics, reviews] = await Promise.all([
    getFabricsByVendor(id),
    getVendorReviews(id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DemoBanner />
      <Link
        href="/vendeurs"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour aux vendeurs
      </Link>

      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="bg-muted ring-background relative size-28 shrink-0 overflow-hidden rounded-full border shadow-sm ring-4 sm:size-36">
          {vendor.cover_url ? (
            <Image
              src={vendor.cover_url}
              alt={vendor.shop_name ?? "Vendeur de tissu"}
              fill
              sizes="144px"
              className="object-cover"
              preload
            />
          ) : (
            <span className="text-muted-foreground flex size-full items-center justify-center">
              <Store className="size-10" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
          <div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-3xl font-bold tracking-tight">
                {vendor.shop_name}
              </h1>
              {vendor.is_certified && <CertifiedBadge />}
              {vendor.is_founding_member && <FoundingMemberBadge />}
            </div>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-3 text-sm sm:justify-start">
              {vendor.rating_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="text-foreground font-medium">
                    {vendor.rating.toFixed(1)}
                  </span>
                  ({vendor.rating_count} avis)
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {vendor.city}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="size-4" /> {fabrics.length} tissu
                {fabrics.length > 1 ? "s" : ""}
              </span>
              {vendor.free_delivery && (
                <span className="text-primary flex items-center gap-1 font-medium">
                  <Truck className="size-4" /> Livraison offerte
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {vendor.bio && (
        <p className="text-muted-foreground mt-6 text-center sm:text-left">
          {vendor.bio}
        </p>
      )}

      {/* Score de confiance — la confiance en un coup d'œil, avant de commander. */}
      <div className="mt-6">
        <TrustScorePanel pro={vendor} />
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">
          Les tissus de la boutique
          <span className="text-muted-foreground ml-2 text-base font-normal">
            ({fabrics.length})
          </span>
        </h2>

        {fabrics.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Cette boutique n&apos;a pas encore mis de tissu en ligne.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </div>
        )}
      </section>

      <section id="avis" className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            Avis clients
            <span className="text-muted-foreground ml-2 text-base font-normal">
              ({vendor.rating_count})
            </span>
          </h2>
          {vendor.rating_count > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <ReviewStars value={vendor.rating} />
              <span className="font-medium">{vendor.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Aucun avis pour le moment. Soyez le premier à partager votre
            expérience après une commande de tissu.
          </p>
        ) : (
          <ReviewList reviews={reviews} />
        )}

        <div className="mt-6">
          <VendorReviewForm vendorId={vendor.id} />
        </div>
      </section>
    </div>
  );
}
