import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Droplets,
  Eye,
  MapPin,
  MoveHorizontal,
  Package,
  Ruler,
  Shapes,
  Sparkles,
  Sun,
  Weight,
  Wind,
  Shirt,
} from "lucide-react";

import { FabricBuyPanel } from "@/components/catalog/fabric-buy-panel";
import { FabricCard } from "@/components/catalog/fabric-card";
import { FabricShowcase } from "@/components/catalog/fabric-showcase";
import { ReviewList } from "@/components/catalog/review-list";
import { DemoBanner } from "@/components/demo-banner";
import { StyleIcon } from "@/components/order/style-icons";
import { formatPrice } from "@/lib/constants";
import {
  getFabricById,
  getFabricCategories,
  getFabricReviews,
  getFabrics,
  getVendorById,
} from "@/lib/data";
import {
  CARE_INSTRUCTIONS,
  DRAPES,
  OPACITIES,
  PATTERNS,
  STRETCHES,
  USAGES,
  WEIGHTS,
  pickKey,
} from "@/lib/fabric-specs";
import { formatMeters, isFabricAvailable } from "@/lib/fabric-metrage";
import { AUDIENCE_LABELS, audiencesOf, fabricProfile, pricedUse } from "@/lib/fabric-usage";
import { getT } from "@/lib/i18n/server";
import { canSell, isDemoFabric } from "@/lib/sales-approval";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getT();
  const fabric = await getFabricById(id);
  if (!fabric) return { title: t("Tissu introuvable") };

  const profile = fabricProfile(fabric);
  return {
    title: fabric.name,
    description:
      fabric.description ??
      `${t(profile.family)} — ${t(profile.pitch)} ${t("À partir de {price} le mètre.", { price: formatPrice(fabric.price_per_meter) })}`,
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
  // Retiré du catalogue par son vendeur : la fiche disparaît, comme un modèle
  // désactivé — elle ne doit plus vendre, même par un lien gardé de côté.
  if (!fabric || fabric.is_active === false) notFound();
  const t = await getT();

  // La boutique : JALOFA, seul vendeur de tissus. Sa ligne sert encore aux
  // contrôles de vente (anti-arnaque) ; il n'y a plus de fiche vendeur publique.
  const vendor = fabric.vendor_id ? await getVendorById(fabric.vendor_id) : null;

  const family = await getFabrics({ category: fabric.category_slug ?? undefined });

  // Avis vérifiés portant sur CE tissu (clients qui l'ont réellement acheté et
  // reçu). Ils ne
  // s'affichent que s'il en existe.
  const fabricReviews = await getFabricReviews(id);
  const categories = await getFabricCategories();
  const categoryName = categories.find((c) => c.slug === fabric.category_slug)?.name ?? null;

  // Coloris : le même tissu (même matière) décliné dans la boutique JALOFA.
  const variants = family.filter(
    (f) =>
      (f.vendor_id ?? null) === (fabric.vendor_id ?? null) &&
      (f.material ?? "").toLowerCase() === (fabric.material ?? "").toLowerCase() &&
      f.is_active,
  );
  const variantIds = new Set(variants.map((v) => v.id));
  const related = family.filter((f) => !variantIds.has(f.id) && f.id !== fabric.id).slice(0, 4);

  const profile = fabricProfile(fabric);
  const uses = profile.uses.map((u) => pricedUse(u, fabric));
  const audiences = audiencesOf(profile);
  // Note affichée = moyenne des seuls avis vérifiés. Aucun chiffre inventé :
  // sans avis réel, la fiche n'affiche ni étoiles ni compteur.
  const reviewCount = fabricReviews.length;
  const rating = reviewCount
    ? Math.round((fabricReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : 0;

  // Tableau des caractéristiques : seules les lignes renseignées s'affichent ;
  // sans fiche détaillée, on retombe sur le profil déduit de la famille.
  const weight = pickKey(WEIGHTS, fabric.weight);
  const opacity = pickKey(OPACITIES, fabric.opacity);
  const drape = pickKey(DRAPES, fabric.drape);
  const stretch = pickKey(STRETCHES, fabric.stretch);
  const pattern = pickKey(PATTERNS, fabric.pattern);
  const care = (fabric.care_instructions ?? [])
    .map((c) => pickKey(CARE_INSTRUCTIONS, c))
    .filter((c): c is keyof typeof CARE_INSTRUCTIONS => c !== null);
  const usages = (fabric.recommended_usages ?? [])
    .map((u) => pickKey(USAGES, u))
    .filter((u): u is keyof typeof USAGES => u !== null);
  const sheer = opacity === "SHEER" || opacity === "SEMI_SHEER";
  const composition = fabric.composition ?? fabric.material;
  const specs: { icon: typeof Package; term: string; desc: string }[] = [
    {
      icon: Package,
      term: t("Matière"),
      desc:
        [categoryName ? t(categoryName) : t(profile.family), composition && `(${composition})`]
          .filter(Boolean)
          .join(" ") || "—",
    },
    ...(fabric.width_cm ? [{ icon: Ruler, term: t("Largeur (laize)"), desc: `${fabric.width_cm} cm` }] : []),
    ...(fabric.origin_brand ? [{ icon: MapPin, term: t("Origine / Qualité"), desc: fabric.origin_brand }] : []),
    ...(weight
      ? [
          {
            icon: Weight,
            term: t("Épaisseur"),
            desc: `${t(WEIGHTS[weight].label)}${fabric.grammage_gsm ? ` (${fabric.grammage_gsm} g/m²)` : ""}`,
          },
        ]
      : []),
    ...(opacity ? [{ icon: Eye, term: t("Opacité"), desc: t(OPACITIES[opacity].label) }] : []),
    ...(drape ? [{ icon: Wind, term: t("Tombé"), desc: t(DRAPES[drape].label) }] : []),
    ...(stretch ? [{ icon: MoveHorizontal, term: t("Élasticité"), desc: t(STRETCHES[stretch].label) }] : []),
    ...(pattern ? [{ icon: Shapes, term: t("Motif"), desc: t(PATTERNS[pattern].label) }] : []),
    ...(fabric.finish ? [{ icon: Sparkles, term: t("Finition"), desc: fabric.finish }] : []),
    {
      icon: Droplets,
      term: t("Entretien"),
      desc: care.length ? care.map((c) => t(CARE_INSTRUCTIONS[c].label)).join(" · ") : t(profile.care),
    },
    ...(usages.length
      ? [{ icon: Shirt, term: t("Idéal pour"), desc: usages.map((u) => t(USAGES[u].label)).join(" · ") }]
      : []),
    ...(!weight ? [{ icon: Sun, term: t("Saison"), desc: t(profile.season) }] : []),
    {
      icon: BadgeCheck,
      term: t("Disponibilité"),
      desc: `${isFabricAvailable(fabric) ? t("Disponible") : t("Épuisé")}${fabric.color ? ` · ${fabric.color}` : ""}`,
    },
  ];

  // Points forts affichés sous le prix (liste cochée) : uniquement ce qui est
  // renseigné sur la fiche, jamais une promesse inventée.
  const topUse = [...uses].sort((a, b) => b.meters - a.meters)[0];
  const facts = [
    composition && `${t("Matière")} : ${composition}`,
    fabric.width_cm && t("Laize de {w} cm", { w: fabric.width_cm }),
    topUse && t("Idéal pour : {use}", { use: t(topUse.use.label).toLowerCase() }),
    `${t("Entretien")} : ${
      care.length ? care.map((c) => t(CARE_INSTRUCTIONS[c].label)).join(" · ") : t(profile.care)
    }`,
  ].filter((f): f is string => Boolean(f));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoBanner />

      {/* Fil d'Ariane — discret, « Accueil / Tissus / Nom » */}
      <nav aria-label={t("Fil d'Ariane")} className="text-muted-foreground mb-6 flex min-w-0 items-center gap-1.5 text-sm">
        <Link href="/" className="hover:text-foreground">
          {t("Accueil")}
        </Link>
        <span>/</span>
        <Link href="/tissus" className="hover:text-foreground">
          {t("Tissus")}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{fabric.name}</span>
      </nav>

      {/* Galerie + achat */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <FabricShowcase
            image={fabric.image_url}
            detailImage={fabric.detail_image_url ?? null}
            fabricName={fabric.name}
            colorLabel={fabric.color}
            uses={uses.map(({ use, meters }) => ({
              label: t(use.label),
              meters,
              icon: use.icon,
              audience: t(AUDIENCE_LABELS[use.audience]),
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
          uses={uses.map(({ use, meters }) => ({ label: t(use.label), meters }))}
          facts={facts}
          reviewPhotos={fabricReviews.flatMap((r) => r.photos)}
          deliveryZone={fabric.delivery_zone ?? "none"}
          rating={rating}
          reviewCount={reviewCount}
          salesPending={!canSell(vendor)}
          demo={isDemoFabric(fabric)}
        />
      </div>

      {/* Avis vérifiés de clients ayant acheté ce tissu (s'il y en a) */}
      {fabricReviews.length > 0 && (
        <section id="avis" className="mt-16 border-t pt-12">
          <h2 className="font-serif text-2xl tracking-tight">
            {t("Avis vérifiés")}
            <span className="text-muted-foreground ml-2 text-base font-normal">
              ({fabricReviews.length})
            </span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("De clients ayant acheté et reçu ce tissu.")}
          </p>
          <ReviewList reviews={fabricReviews} />
        </section>
      )}

      {/* Caractéristiques techniques — ce que JALOFA a renseigné */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl tracking-tight">{t("Caractéristiques")}</h2>
        {sheer && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
            <Eye className="size-3.5" /> {t("Doublure conseillée")}
          </p>
        )}
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {specs.map(({ icon: Icon, term, desc }) => (
            <div key={term} className="rounded-xl border p-4">
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                <Icon className="size-3.5" /> {term}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* À quoi sert ce tissu — la question n°1 devant un rouleau */}
      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl tracking-tight">{t("Pour quelles tenues ?")}</h2>
          <div className="flex flex-wrap gap-1.5">
            {audiences.map((a) => (
              <span
                key={a}
                className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {t(AUDIENCE_LABELS[a])}
              </span>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">{t(profile.pitch)}</p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {uses.map(({ use, meters, fabricPrice }) => (
            <li key={use.slug}>
              <Link
                href={`/tissus/${fabric.id}/tenue${
                  use.audience === "mixte" ? "" : `?pour=${use.audience}`
                }`}
                className="hover:border-border hover:bg-muted/40 group flex h-full items-center gap-3 rounded-xl border p-4 transition-colors"
              >
                <StyleIcon
                  name={use.icon}
                  className="text-muted-foreground group-hover:text-foreground h-14 w-10 shrink-0 transition-colors"
                />
                <div className="min-w-0">
                  <p className="font-medium">{t(use.label)}</p>
                  <p className="text-muted-foreground text-xs">
                    {t(AUDIENCE_LABELS[use.audience])} · {formatMeters(meters)}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatPrice(fabricPrice)}
                    <span className="text-muted-foreground font-normal"> {t("de tissu")}</span>
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground ml-auto size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">
          {t("Métrages conseillés par les ateliers pour une carrure standard. La confection du tailleur s'ajoute au prix du tissu.")}
        </p>
      </section>


      {/* Tissus similaires */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl tracking-tight">{t("Dans la même famille")}</h2>
            <Link href="/tissus" className="text-muted-foreground hover:text-foreground text-sm">
              {t("Tout voir")}
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((f) => (
              <FabricCard key={f.id} fabric={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
