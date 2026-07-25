import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, Droplets, Package, Store, Sun } from "lucide-react";

import { FabricBuyPanel } from "@/components/catalog/fabric-buy-panel";
import { FabricCard } from "@/components/catalog/fabric-card";
import { FabricReviews } from "@/components/catalog/fabric-reviews";
import { FabricShowcase } from "@/components/catalog/fabric-showcase";
import { ReviewList } from "@/components/catalog/review-list";
import { DemoBanner } from "@/components/demo-banner";
import { StyleIcon } from "@/components/order/style-icons";
import { formatPrice } from "@/lib/constants";
import { getFabricById, getFabricReviews, getFabrics, getVendorById } from "@/lib/data";
import { formatMeters } from "@/lib/fabric-metrage";
import { fabricSocialProof } from "@/lib/fabric-social-proof";
import { AUDIENCE_LABELS, audiencesOf, fabricProfile, pricedUse } from "@/lib/fabric-usage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fabric = await getFabricById(id);
  if (!fabric) return { title: "Tissu introuvable" };

  const profile = fabricProfile(fabric);
  return {
    title: fabric.name,
    description:
      fabric.description ??
      `${profile.family} — ${profile.pitch} À partir de ${formatPrice(fabric.price_per_meter)} le mètre.`,
    openGraph: fabric.image_url ? { images: [fabric.image_url] } : undefined,
  };
}

export default async function FabricDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fabric = await getFabricById(id);
  if (!fabric) notFound();

  // Boutique d'origine — on ne lie que vers une fiche publique visible (une
  // boutique suspendue n'a pas de page).
  const vendor = fabric.vendor_id ? await getVendorById(fabric.vendor_id) : null;
  const shop = vendor && !vendor.is_suspended ? vendor : null;

  const family = await getFabrics({ category: fabric.category_slug ?? undefined });

  // Avis vérifiés portant sur CE tissu (clients qui l'ont réellement acheté et
  // reçu). Distincts de la preuve sociale synthétique ci-dessous, ils ne
  // s'affichent que s'il en existe.
  const fabricReviews = await getFabricReviews(id);

  // Coloris : le même tissu décliné, c'est-à-dire la même matière chez le
  // catalogue. Une matière unique n'affiche pas de nuancier.
  const variants = family.filter(
    (f) =>
      (f.material ?? "").toLowerCase() === (fabric.material ?? "").toLowerCase() &&
      f.is_active,
  );
  const variantIds = new Set(variants.map((v) => v.id));
  const related = family.filter((f) => !variantIds.has(f.id) && f.id !== fabric.id).slice(0, 4);

  const profile = fabricProfile(fabric);
  const uses = profile.uses.map((u) => pricedUse(u, fabric));
  const audiences = audiencesOf(profile);
  const proof = fabricSocialProof(fabric);

  // Le plus vendu de la sélection porte sa pastille — même source de vérité que
  // les chiffres de la fiche, donc jamais en contradiction avec eux.
  const bestSellerId = related.reduce<{ id: string; sold: number } | null>((best, f) => {
    const sold = fabricSocialProof(f).soldMeters;
    return !best || sold > best.sold ? { id: f.id, sold } : best;
  }, null)?.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
        <Link href="/tissus" className="hover:text-foreground">
          Tissus
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/tissus?category=${fabric.category_slug ?? ""}`}
          className="hover:text-foreground capitalize"
        >
          {fabric.category_slug ?? "Catalogue"}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground truncate font-medium">{fabric.name}</span>
      </nav>

      {/* Galerie + achat */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <FabricShowcase
            image={fabric.image_url}
            fabricName={fabric.name}
            colorLabel={fabric.color}
            uses={uses.map(({ use, meters }) => ({
              label: use.label,
              meters,
              icon: use.icon,
              audience: AUDIENCE_LABELS[use.audience],
            }))}
          />
        </div>

        <FabricBuyPanel
          fabric={fabric}
          variants={variants.map((v) => ({
            id: v.id,
            color: v.color,
            image_url: v.image_url,
          }))}
          uses={uses.map(({ use, meters }) => ({ label: use.label, meters }))}
          vendorName={shop?.shop_name ?? vendor?.shop_name ?? null}
          vendorHref={shop ? `/vendeurs/${shop.id}` : null}
          vendorFreeDelivery={vendor?.free_delivery ?? false}
          rating={proof.rating}
          reviewCount={proof.reviewCount}
          orders={proof.orders}
        />
      </div>

      {/* Note & avis — juste sous le bloc produit, là où on les cherche */}
      <div className="mt-16 border-t pt-12">
        <FabricReviews proof={proof} />
      </div>

      {/* Avis vérifiés de clients ayant acheté ce tissu (s'il y en a) */}
      {fabricReviews.length > 0 && (
        <section id="avis-verifies" className="mt-12">
          <h2 className="font-serif text-2xl tracking-tight">
            Avis vérifiés
            <span className="text-muted-foreground ml-2 text-base font-normal">
              ({fabricReviews.length})
            </span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            De clients ayant acheté et reçu ce tissu.
          </p>
          <ReviewList reviews={fabricReviews} />
        </section>
      )}

      {/* À quoi sert ce tissu — la question n°1 devant un rouleau */}
      <section className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl tracking-tight">Pour quelles tenues ?</h2>
          <div className="flex flex-wrap gap-1.5">
            {audiences.map((a) => (
              <span
                key={a}
                className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {AUDIENCE_LABELS[a]}
              </span>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">{profile.pitch}</p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {uses.map(({ use, meters, fabricPrice }) => (
            <li key={use.slug}>
              <Link
                href={`/modeles?fabric=${fabric.id}${
                  use.audience === "mixte" ? "" : `&category=${use.audience}`
                }`}
                className="hover:border-border hover:bg-muted/40 group flex h-full items-center gap-3 rounded-xl border p-4 transition-colors"
              >
                <StyleIcon
                  name={use.icon}
                  className="text-muted-foreground group-hover:text-foreground h-14 w-10 shrink-0 transition-colors"
                />
                <div className="min-w-0">
                  <p className="font-medium">{use.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {AUDIENCE_LABELS[use.audience]} · {formatMeters(meters)}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatPrice(fabricPrice)}
                    <span className="text-muted-foreground font-normal"> de tissu</span>
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground ml-auto size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">
          Métrages conseillés par les ateliers pour une carrure standard. La confection du
          tailleur s&apos;ajoute au prix du tissu.
        </p>
      </section>

      {/* La matière */}
      <section className="mt-14">
        <h2 className="font-serif text-2xl tracking-tight">La matière</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, term: "Famille", desc: profile.family },
            { icon: Sun, term: "Saison", desc: profile.season },
            { icon: Droplets, term: "Entretien", desc: profile.care },
            {
              icon: BadgeCheck,
              term: "Disponibilité",
              desc: `${formatMeters(fabric.stock_meters)} en stock${
                fabric.color ? ` · ${fabric.color}` : ""
              }`,
            },
          ].map(({ icon: Icon, term, desc }) => (
            <div key={term} className="rounded-xl border p-4">
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                <Icon className="size-3.5" /> {term}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* La boutique */}
      {shop && (
        <section className="mt-14">
          <h2 className="font-serif text-2xl tracking-tight">La boutique</h2>
          <Link
            href={`/vendeurs/${shop.id}`}
            className="hover:bg-muted/40 mt-5 flex items-center gap-4 rounded-2xl border p-5 transition-colors"
          >
            <span className="bg-muted flex size-14 shrink-0 items-center justify-center rounded-full">
              <Store className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium">
                {shop.shop_name}
                {shop.is_certified && <BadgeCheck className="text-muted-foreground size-4" />}
              </p>
              <p className="text-muted-foreground text-sm">
                {shop.city ?? "Sénégal"} · {proof.orders.toLocaleString("fr-FR")} commandes
                servies
              </p>
            </div>
            <ChevronRight className="text-muted-foreground ml-auto size-5 shrink-0" />
          </Link>
        </section>
      )}

      {/* Tissus similaires */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl tracking-tight">Dans la même famille</h2>
            <Link href="/tissus" className="text-muted-foreground hover:text-foreground text-sm">
              Tout voir
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((f) => (
              <FabricCard
                key={f.id}
                fabric={f}
                badge={f.id === bestSellerId ? "Best-seller" : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
