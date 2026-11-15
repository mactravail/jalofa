import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, MapPin, Star, Store } from "lucide-react";

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
import { getT } from "@/lib/i18n/server";
import { SalesPendingNotice } from "@/components/catalog/sales-pending-notice";
import { canSell } from "@/lib/sales-approval";

// L'aperçu du lien partagé (TikTok, WhatsApp) : le nom de la boutique et sa photo.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getT();
  const vendor = await getVendorById(id);
  if (!vendor || vendor.is_suspended) return { title: t("Vendeur de tissu") };
  const title = vendor.shop_name ?? t("Vendeur de tissu");
  const description =
    vendor.bio ?? t("Les tissus de {name}, à acheter sur JALOFA.", { name: title });
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(vendor.cover_url ? { images: [vendor.cover_url] } : {}),
    },
  };
}

// La boutique d'un vendeur — aussi la page où arrivent les clients de ses lives
// TikTok : ses tissus à lui, et seulement les siens, tout en haut.
export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendorById(id);
  // Une boutique suspendue par la plateforme n'a plus de fiche publique.
  if (!vendor || vendor.is_suspended) notFound();
  const t = await getT();

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
        <ArrowLeft className="size-4" /> {t("Retour aux vendeurs")}
      </Link>

      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="bg-muted ring-background relative size-28 shrink-0 overflow-hidden rounded-full border shadow-sm ring-4 sm:size-36">
          {vendor.cover_url ? (
            <Image
              src={vendor.cover_url}
              alt={vendor.shop_name ?? t("Vendeur de tissu")}
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
                  ({t("{n} avis", { n: vendor.rating_count })})
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {vendor.city}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="size-4" /> {fabrics.length > 1 ? t("{n} tissus", { n: fabrics.length }) : t("{n} tissu", { n: fabrics.length })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-arnaque : pas encore validé par JALOFA → visible, pas en vente. */}
      {!canSell(vendor) && <SalesPendingNotice className="mt-6" />}

      {/* Les tissus d'abord : c'est pour eux que le client est venu (lives TikTok). */}
      <section id="tissus" className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">
          {t("Les tissus de la boutique")}
          <span className="text-muted-foreground ml-2 text-base font-normal">
            ({fabrics.length})
          </span>
        </h2>

        {fabrics.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            {t("Cette boutique n'a pas encore mis de tissu en ligne.")}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </div>
        )}
      </section>

      {vendor.bio && (
        <p className="text-muted-foreground mt-10 text-center sm:text-left">
          {vendor.bio}
        </p>
      )}

      {/* Score de confiance — la confiance en un coup d'œil, avant de commander. */}
      <div className="mt-6">
        <TrustScorePanel pro={vendor} kind="vendor" />
      </div>

      <section id="avis" className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            {t("Avis clients")}
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
            {t("Aucun avis pour le moment. Soyez le premier à partager votre expérience après une commande de tissu.")}
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
