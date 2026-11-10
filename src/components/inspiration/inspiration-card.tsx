import Image from "next/image";
import Link from "@/components/i18n/link";

import { Badge } from "@/components/ui/badge";
import { INSPIRATION_MAKER_KIND_BADGES } from "@/lib/constants";
import type { InspirationPostView } from "@/lib/inspiration-data";
import { getT } from "@/lib/i18n/server";

/**
 * Une tenue de la galerie « Inspiration » : sa première photo en portrait, la
 * provenance en pastille, et la légende dessous. Cliquable vers sa page.
 */
export async function InspirationCard({ post }: { post: InspirationPostView }) {
  const cover = post.photos[0];
  const t = await getT();

  return (
    <Link
      href={`/inspiration/${post.id}`}
      className="group bg-card block overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="bg-muted relative aspect-[3/4] overflow-hidden">
        {cover && (
          <Image
            src={cover}
            alt={post.garment_label ?? t("Tenue partagée")}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <Badge variant="secondary" className="absolute left-2 top-2">
          {t(INSPIRATION_MAKER_KIND_BADGES[post.maker_kind])}
        </Badge>
        {post.photos.length > 1 && (
          <span className="bg-foreground/70 text-background absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums">
            {t("{n} photos", { n: post.photos.length })}
          </span>
        )}
      </div>
      <div className="p-3">
        {post.garment_label && (
          <h3 className="line-clamp-1 font-medium">{post.garment_label}</h3>
        )}
        {post.caption && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {post.caption}
          </p>
        )}
        {post.author_name && (
          <p className="text-muted-foreground mt-1.5 text-xs">
            {t("Par {name}", { name: post.author_name })}
          </p>
        )}
      </div>
    </Link>
  );
}
