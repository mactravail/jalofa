import Image from "next/image";
import Link from "next/link";
import { EyeOff } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { DeleteInspirationButton } from "@/components/inspiration/delete-inspiration-button";
import { Badge } from "@/components/ui/badge";
import { INSPIRATION_MAKER_KIND_BADGES } from "@/lib/constants";
import { getAllInspiration } from "@/lib/admin-data";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminInspirationPage() {
  const posts = await getAllInspiration();

  return (
    <AdminPage
      title="Inspiration"
      subtitle="Les tenues partagées par les clients dans la galerie publique. Retirez toute publication inappropriée."
    >
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucune publication.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 p-4">
              <Link
                href={`/inspiration/${post.id}`}
                className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg"
              >
                {post.photos[0] && (
                  <Image
                    src={post.photos[0]}
                    alt={post.garment_label ?? "Tenue"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {INSPIRATION_MAKER_KIND_BADGES[post.maker_kind]}
                  </Badge>
                  {!post.is_published && (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <EyeOff className="size-3.5" /> Masquée
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {DATE_FORMAT.format(new Date(post.created_at))}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  <span className="font-medium">
                    {post.garment_label ?? "Tenue"}
                  </span>
                  {post.author_name && (
                    <span className="text-muted-foreground"> · par {post.author_name}</span>
                  )}
                </p>
                {post.caption && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                    {post.caption}
                  </p>
                )}
              </div>

              <DeleteInspirationButton id={post.id} />
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
