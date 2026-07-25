import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Scissors, Sparkles } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  INSPIRATION_MAKER_KIND_BADGES,
  INSPIRATION_MAKER_KIND_LABELS,
} from "@/lib/constants";
import { getInspirationPost } from "@/lib/inspiration-data";
import { cn } from "@/lib/utils";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getInspirationPost(id);
  if (!post) return { title: "Tenue introuvable" };
  const title = post.garment_label ?? "Tenue partagée";
  return {
    title,
    description: post.caption ?? `${title} partagée sur JALOFA.`,
    openGraph: post.photos[0] ? { images: [post.photos[0]] } : undefined,
  };
}

export default async function InspirationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getInspirationPost(id);
  if (!post) notFound();

  const title = post.garment_label ?? "Tenue partagée";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DemoBanner />

      <nav
        aria-label="Fil d'Ariane"
        className="text-muted-foreground mb-6 flex items-center gap-1 text-sm"
      >
        <Link href="/inspiration" className="hover:text-foreground">
          Inspiration
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground truncate font-medium">{title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        {/* Galerie */}
        <div className="space-y-3">
          <div className="bg-muted relative aspect-[3/4] overflow-hidden rounded-2xl border">
            {post.photos[0] && (
              <Image
                src={post.photos[0]}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
                preload
              />
            )}
            <Badge variant="secondary" className="absolute left-3 top-3">
              {INSPIRATION_MAKER_KIND_BADGES[post.maker_kind]}
            </Badge>
          </div>
          {post.photos.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {post.photos.slice(1).map((src) => (
                <div
                  key={src}
                  className="bg-muted relative aspect-square overflow-hidden rounded-xl border"
                >
                  <Image
                    src={src}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 33vw, 120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
          {post.author_name && (
            <p className="text-muted-foreground mt-1 text-sm">
              Partagée par {post.author_name} ·{" "}
              {DATE_FORMAT.format(new Date(post.created_at))}
            </p>
          )}

          {post.caption && (
            <p className="mt-5 leading-relaxed text-pretty">{post.caption}</p>
          )}

          <dl className="mt-6 space-y-4 border-t pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Provenance
              </dt>
              <dd className="mt-1">
                {INSPIRATION_MAKER_KIND_LABELS[post.maker_kind]}
                {post.maker_name && (
                  <span className="text-muted-foreground"> · {post.maker_name}</span>
                )}
              </dd>
            </div>

            {(post.fabric_note || post.fabric) && (
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Le tissu
                </dt>
                <dd className="mt-1 space-y-2">
                  {post.fabric_note && <p>{post.fabric_note}</p>}
                  {post.fabric && (
                    <Link
                      href={`/tissus/${post.fabric.id}`}
                      className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-2.5 transition-colors"
                    >
                      <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-lg">
                        {post.fabric.image_url && (
                          <Image
                            src={post.fabric.image_url}
                            alt={post.fabric.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {post.fabric.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Voir ce tissu au catalogue
                        </span>
                      </span>
                      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                    </Link>
                  )}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-8 space-y-3">
            <Link
              href="/tailleurs"
              className={cn(buttonVariants({ size: "lg" }), "w-full gap-2")}
            >
              <Scissors className="size-4" /> Je veux la même — trouver un tailleur
            </Link>
            <Link
              href="/inspiration"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full gap-2",
              )}
            >
              <Sparkles className="size-4" /> Voir d&apos;autres tenues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
